"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

// Le profil Firestore est créé par la Cloud Function onUserCreate, en
// général en moins d'une seconde. Si rien n'arrive dans ce délai, c'est
// que le quota de comptes est atteint et qu'aucun profil ne sera jamais
// créé pour ce compte.
const PROFILE_TIMEOUT_MS = 8000;

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
