"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { VoteDoc } from "@/lib/firebase/types";
import { VoteToggle } from "./VoteToggle";

type GivenVote = VoteDoc & { id: string; declarationId: string };

function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) return "à l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp.toDate());
}

function GivenVoteRow({ vote, voterId }: { vote: GivenVote; voterId: string }) {
  const points = (vote.known ? 1 : 0) + (vote.emotion ? 1 : 0);

  async function save(known: boolean, emotion: boolean) {
    await setDoc(doc(db, "declarations", vote.declarationId, "votes", voterId), {
      voterId,
      celebrityName: vote.celebrityName,
      known,
      emotion,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <li className="panel-pixel flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold">{vote.celebrityName}</p>
          <p className="font-sans text-xs text-gbc-gray-300">{formatDate(vote.createdAt)}</p>
        </div>
        <span className="label-pixel shrink-0 text-gbc-violet">
          {points} pt{points > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-2">
        <VoteToggle
          label="Connu"
          points={1}
          color="violet"
          checked={vote.known}
          onChange={(value) => save(value, vote.emotion)}
        />
        <VoteToggle
          label="Émotion"
          points={1}
          color="pink"
          checked={vote.emotion}
          onChange={(value) => save(vote.known, value)}
        />
      </div>
    </li>
  );
}

export function MyGivenPoints() {
  const [user, setUser] = useState<User | null>(null);
  const [votes, setVotes] = useState<GivenVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;

    // Requête sur toutes les sous-collections "votes", quelle que soit la
    // déclaration parente — c'est ce que collectionGroup permet.
    const givenQuery = query(collectionGroup(db, "votes"), where("voterId", "==", user.uid));

    return onSnapshot(givenQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        declarationId: d.ref.parent.parent!.id,
        ...(d.data() as VoteDoc),
      }));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setVotes(docs);
      setLoading(false);
    });
  }, [user]);

  if (loading || !user) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-6">Chargement…</p>
    );
  }

  if (votes.length === 0) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-6">
        Tu n&apos;as encore voté sur aucune déclaration.
      </p>
    );
  }

  const totalGiven = votes.reduce(
    (sum, vote) => sum + (vote.known ? 1 : 0) + (vote.emotion ? 1 : 0),
    0,
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="font-sans text-xs text-gbc-gray-300">
        {totalGiven} pt{totalGiven > 1 ? "s" : ""} donné{totalGiven > 1 ? "s" : ""} au total
      </p>

      <ul className="flex w-full flex-col gap-2">
        {votes.map((vote) => (
          <GivenVoteRow key={vote.id} vote={vote} voterId={user.uid} />
        ))}
      </ul>
    </div>
  );
}
