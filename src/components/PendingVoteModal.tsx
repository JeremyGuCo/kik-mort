"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { DeclarationDoc } from "@/lib/firebase/types";
import { VoteToggle } from "./VoteToggle";

type PendingDeclaration = DeclarationDoc & { id: string };

export function PendingVoteModal() {
  const [user, setUser] = useState<User | null>(null);
  const [openDeclarations, setOpenDeclarations] = useState<PendingDeclaration[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [known, setKnown] = useState(false);
  const [emotion, setEmotion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Déclarations actuellement ouvertes, à l'exclusion des siennes.
  useEffect(() => {
    if (!user) {
      setOpenDeclarations([]);
      return;
    }

    const openQuery = query(collection(db, "declarations"), where("status", "==", "open"));

    return onSnapshot(openQuery, (snapshot) => {
      setOpenDeclarations(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as DeclarationDoc) }))
          .filter((d) => d.declaredBy !== user.uid),
      );
    });
  }, [user]);

  // Pour chaque déclaration candidate, vérifie si ce joueur a déjà voté.
  useEffect(() => {
    if (!user || openDeclarations.length === 0) {
      setVotedIds(new Set());
      return;
    }

    const unsubscribes = openDeclarations.map((declaration) =>
      onSnapshot(doc(db, "declarations", declaration.id, "votes", user.uid), (snap) => {
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (snap.exists()) next.add(declaration.id);
          else next.delete(declaration.id);
          return next;
        });
      }),
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, openDeclarations]);

  const pending = openDeclarations.find((d) => !votedIds.has(d.id));

  // Repart de zéro à chaque nouvelle déclaration à voter.
  useEffect(() => {
    setKnown(false);
    setEmotion(false);
  }, [pending?.id]);

  if (!user || !pending) return null;

  async function handleVote() {
    if (!user || !pending) return;

    setSubmitting(true);
    try {
      await setDoc(doc(db, "declarations", pending.id, "votes", user.uid), {
        known,
        emotion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="panel-pixel flex w-full max-w-sm animate-pixel-pop flex-col gap-5 p-6">
        <div className="text-center">
          <p className="label-pixel mb-2 text-gbc-gray-300">Nouvelle déclaration</p>
          <h2 className="break-words text-lg text-gbc-acid">{pending.celebrityName}</h2>
          <p className="mt-2 font-sans text-sm text-gbc-gray-300">est mort(e). Vrai ?</p>
        </div>

        <VoteToggle
          label="Connu"
          points={1}
          color="violet"
          checked={known}
          onChange={setKnown}
        />
        <VoteToggle
          label="Émotion"
          points={1}
          color="pink"
          checked={emotion}
          onChange={setEmotion}
        />

        <button
          type="button"
          onClick={handleVote}
          disabled={submitting}
          className="btn-pixel text-sm disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? "Envoi…" : "Voter"}
        </button>
      </div>
    </div>
  );
}
