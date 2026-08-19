"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collectionGroup, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { VoteDoc } from "@/lib/firebase/types";

type GivenVote = VoteDoc & { id: string };

function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) return "à l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp.toDate());
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
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VoteDoc) }));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setVotes(docs);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
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
        {votes.map((vote) => {
          const points = (vote.known ? 1 : 0) + (vote.emotion ? 1 : 0);

          return (
            <li key={vote.id} className="panel-pixel flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-sans text-sm font-semibold">
                  {vote.celebrityName}
                </p>
                <p className="font-sans text-xs text-gbc-gray-300">
                  {formatDate(vote.createdAt)}
                </p>
              </div>
              <span className="label-pixel shrink-0 text-gbc-violet">
                {points === 0
                  ? "0 pt"
                  : [vote.known && "connu", vote.emotion && "émotion"]
                      .filter(Boolean)
                      .join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
