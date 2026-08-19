"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function DeclareForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [celebrityName, setCelebrityName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthChecked(true);
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const trimmedName = celebrityName.trim();
    if (!trimmedName) return;

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "declarations"), {
        celebrityName: trimmedName,
        declaredBy: user.uid,
        status: "open",
        scoreAwarded: null,
        createdAt: serverTimestamp(),
        closedAt: null,
      });
      router.push("/");
    } catch {
      setError("Impossible d'envoyer la déclaration. Réessaie.");
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Chargement…
      </p>
    );
  }

  if (!user) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Connecte-toi pour déclarer un décès.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-pixel flex w-full max-w-sm flex-col gap-4 p-5"
    >
      <label htmlFor="celebrityName" className="label-pixel text-gbc-acid">
        Qui est mort ?
      </label>

      <input
        id="celebrityName"
        name="celebrityName"
        type="text"
        autoFocus
        autoComplete="off"
        value={celebrityName}
        onChange={(event) => setCelebrityName(event.target.value)}
        placeholder="Nom de la célébrité"
        maxLength={100}
        className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
          text-gbc-gray-100 outline-none placeholder:text-gbc-gray-500
          focus:border-gbc-violet"
      />

      {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting || celebrityName.trim().length === 0}
        className="btn-pixel text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? "Envoi…" : "Déclarer"}
      </button>
    </form>
  );
}
