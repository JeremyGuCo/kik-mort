"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase/client";
import type { DeclarationDoc, VoteDoc } from "@/lib/firebase/types";

type OwnDeclaration = DeclarationDoc & { id: string };

function useVoteTally(declarationId: string) {
  const [tally, setTally] = useState({ voters: 0, points: 0 });

  useEffect(() => {
    return onSnapshot(
      collection(db, "declarations", declarationId, "votes"),
      (snapshot) => {
        let points = 0;
        snapshot.forEach((voteDoc) => {
          const vote = voteDoc.data() as VoteDoc;
          if (vote.known) points += 1;
          if (vote.emotion) points += 1;
        });
        setTally({ voters: snapshot.size, points });
      },
    );
  }, [declarationId]);

  return tally;
}

function OwnDeclarationCard({ declaration }: { declaration: OwnDeclaration }) {
  const tally = useVoteTally(declaration.id);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setClosing(true);
    setError(null);
    try {
      const closeDeclaration = httpsCallable(functions, "closeDeclaration");
      await closeDeclaration({ declarationId: declaration.id });
    } catch {
      setError("La clôture a échoué. Réessaie.");
      setClosing(false);
    }
  }

  return (
    <li className="panel-pixel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-sans text-sm font-semibold">
          {declaration.celebrityName}
        </span>
        <span className="label-pixel shrink-0 text-gbc-yellow">ouverte</span>
      </div>

      <p className="font-sans text-sm text-gbc-gray-300">
        {tally.voters} vote{tally.voters > 1 ? "s" : ""} · {tally.points} pt
        {tally.points > 1 ? "s" : ""} en attente
      </p>

      {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}

      <button
        type="button"
        onClick={handleClose}
        disabled={closing}
        className="btn-pixel-violet text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        {closing ? "Clôture…" : "Clôturer"}
      </button>
    </li>
  );
}

export function MyOpenDeclarations() {
  const [user, setUser] = useState<User | null>(null);
  const [declarations, setDeclarations] = useState<OwnDeclaration[]>([]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setDeclarations([]);
      return;
    }

    const ownOpenQuery = query(
      collection(db, "declarations"),
      where("declaredBy", "==", user.uid),
      where("status", "==", "open"),
    );

    return onSnapshot(ownOpenQuery, (snapshot) => {
      setDeclarations(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DeclarationDoc) })),
      );
    });
  }, [user]);

  if (declarations.length === 0) return null;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <h2 className="label-pixel text-gbc-gray-300">Mes déclarations en cours</h2>
      <ul className="flex flex-col gap-3">
        {declarations.map((declaration) => (
          <OwnDeclarationCard key={declaration.id} declaration={declaration} />
        ))}
      </ul>
    </div>
  );
}
