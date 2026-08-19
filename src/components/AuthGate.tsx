"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
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

    tx.set(profileRef, {
      username:
        user.displayName ?? user.email?.split("@")[0] ?? `joueur-${user.uid.slice(0, 6)}`,
      avatarUrl: user.photoURL ?? null,
      totalScore: 0,
      createdAt: serverTimestamp(),
    });
    tx.set(counterRef, { count: count + 1 });
  });
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setSigningIn(false);
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
          <h1 className="text-xl text-gbc-acid">KIK-MORT</h1>
          <p className="font-sans text-sm text-gbc-gray-300">
            Connecte-toi pour rejoindre le classement.
          </p>

          {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className="btn-pixel text-sm disabled:pointer-events-none disabled:opacity-50"
          >
            {signingIn ? "Connexion…" : "Se connecter avec Google"}
          </button>
        </div>
      </main>
    );
  }

  if (!profileExists && profileTimedOut) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 panel-pixel p-6 text-center">
          <h1 className="text-xl text-gbc-acid">KIK-MORT</h1>
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
