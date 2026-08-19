"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  type AuthError,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

// Groupe d'amis fermé pour l'instant. Tenu en phase avec la limite de
// meta/registrationCount dans firestore.rules.
const MAX_USERS = 5;

// Filet de sécurité si la transaction d'inscription échoue silencieusement
// (réseau capricieux, etc.) : au-delà de ce délai sans profil détecté, on
// considère que l'inscription n'a pas pu aboutir.
const PROFILE_TIMEOUT_MS = 8000;

// Crée le profil du joueur ET incrémente le compteur d'inscriptions dans la
// même transaction : soit les deux écritures passent, soit aucune — un
// compte au-delà du quota ne peut jamais se retrouver avec un profil.
async function registerProfile(user: User) {
  const profileRef = doc(db, "users", user.uid);
  const counterRef = doc(db, "meta", "registrationCount");

  await runTransaction(db, async (tx) => {
    const profileSnap = await tx.get(profileRef);
    if (profileSnap.exists()) return; // déjà inscrit

    const counterSnap = await tx.get(counterRef);
    const count = counterSnap.exists() ? (counterSnap.data().count as number) : 0;
    if (count >= MAX_USERS) return; // quota atteint : pas de profil créé

    const fallbackName = user.email?.split("@")[0] ?? `joueur-${user.uid.slice(0, 6)}`;
    const [firstName, ...rest] = (user.displayName ?? fallbackName).split(" ");
    const lastName = rest.join(" ");

    tx.set(profileRef, {
      firstName,
      lastName,
      nickname: user.displayName ?? fallbackName,
      avatarUrl: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    });
    tx.set(counterRef, { count: count + 1 });
  });
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Un compte existe déjà avec cet email — connecte-toi plutôt.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte avec cet email — inscris-toi plutôt.",
  "auth/wrong-password": "Email ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives, réessaie dans un instant.",
};

function authErrorMessage(error: unknown): string {
  const code = (error as AuthError)?.code;
  return (code && AUTH_ERROR_MESSAGES[code]) || "Une erreur est survenue. Réessaie.";
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState<"in" | "up" | null>(null);

  const [profileExists, setProfileExists] = useState(false);
  const [profileTimedOut, setProfileTimedOut] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setChecked(true);
        setProfileExists(false);
        setProfileTimedOut(false);
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;

    // Tentative d'inscription (no-op si le profil existe déjà, ou si le
    // quota est atteint). Erreurs volontairement ignorées : dans les deux
    // cas, l'écran ci-dessous prendra le relais via profileTimedOut.
    registerProfile(user).catch(() => {});

    const timeout = setTimeout(() => setProfileTimedOut(true), PROFILE_TIMEOUT_MS);

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        clearTimeout(timeout);
        setProfileExists(true);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [user]);

  async function handleGoogleSignIn() {
    setGoogleSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleSigningIn(false);
    }
  }

  async function handleEmailAuth(event: FormEvent, mode: "in" | "up") {
    event.preventDefault();
    setEmailSubmitting(mode);
    setError(null);
    try {
      if (mode === "up") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setEmailSubmitting(null);
    }
  }

  if (!checked) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-sans text-sm text-gbc-gray-300">Chargement…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 panel-pixel p-6 text-center">
          <h1 className="text-xl text-gbc-acid">KI-KÉ-MORT</h1>
          <p className="font-sans text-sm text-gbc-gray-300">
            Connecte-toi pour rejoindre le classement.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleSigningIn}
            className="btn-pixel w-full text-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {googleSigningIn ? "Connexion…" : "Se connecter avec Google"}
          </button>

          <div className="flex w-full items-center gap-3">
            <span className="h-0.5 flex-1 bg-gbc-ink" />
            <span className="label-pixel text-gbc-gray-500">ou</span>
            <span className="h-0.5 flex-1 bg-gbc-ink" />
          </div>

          <form
            onSubmit={(event) => handleEmailAuth(event, "in")}
            className="flex w-full flex-col gap-3"
          >
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
                text-gbc-gray-100 outline-none placeholder:text-gbc-gray-500
                focus:border-gbc-violet"
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
                text-gbc-gray-100 outline-none placeholder:text-gbc-gray-500
                focus:border-gbc-violet"
            />

            {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={emailSubmitting !== null}
                className="btn-pixel-violet flex-1 text-sm disabled:pointer-events-none disabled:opacity-50"
              >
                {emailSubmitting === "in" ? "…" : "Se connecter"}
              </button>
              <button
                type="button"
                onClick={(event) => handleEmailAuth(event, "up")}
                disabled={emailSubmitting !== null}
                className="btn-pixel-pink flex-1 text-sm disabled:pointer-events-none disabled:opacity-50"
              >
                {emailSubmitting === "up" ? "…" : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (!profileExists && profileTimedOut) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 panel-pixel p-6 text-center">
          <h1 className="text-xl text-gbc-acid">KI-KÉ-MORT</h1>
          <p className="font-sans text-sm text-gbc-gray-300">
            Désolé, les places sont toutes prises pour l&apos;instant.
          </p>

          <button
            type="button"
            onClick={() => signOut(auth)}
            className="btn-pixel text-sm"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    );
  }

  if (!profileExists) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-sans text-sm text-gbc-gray-300">Création de ton profil…</p>
      </main>
    );
  }

  return <>{children}</>;
}
