"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setChecked(true);
      }),
    [],
  );

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

  return <>{children}</>;
}
