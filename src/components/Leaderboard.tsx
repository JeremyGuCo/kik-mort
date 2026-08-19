"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/firebase/types";

type LeaderboardEntry = UserDoc & { id: string };

const RANK_STYLES = [
  { shadow: "shadow-pixel-acid", badge: "bg-gbc-acid" },
  { shadow: "shadow-pixel-violet", badge: "bg-gbc-violet" },
  { shadow: "shadow-pixel-pink", badge: "bg-gbc-pink" },
] as const;

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Contrairement à une vue SQL, une requête Firestore est nativement
    // "live" : pas besoin d'écouter les tables sources et de refetch.
    const usersQuery = query(collection(db, "users"), orderBy("totalScore", "desc"));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      setEntries(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as UserDoc) })),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Chargement du classement…
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Aucun joueur pour l&apos;instant.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3 w-full">
      {entries.map((entry, index) => {
        const rankStyle = RANK_STYLES[index];

        return (
          <li
            key={entry.id}
            className={`panel-pixel flex items-center gap-3 p-3 ${
              rankStyle ? rankStyle.shadow : ""
            }`}
          >
            <span
              className={`label-pixel flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gbc-ink text-gbc-ink ${
                rankStyle ? rankStyle.badge : "bg-gbc-gray-300"
              }`}
            >
              {index + 1}
            </span>

            {entry.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.avatarUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full border-2 border-gbc-ink object-cover"
              />
            ) : (
              <span className="h-8 w-8 shrink-0 rounded-full border-2 border-gbc-ink bg-gbc-panel2" />
            )}

            <span className="font-sans font-semibold text-sm flex-1 truncate">
              {entry.username}
            </span>

            <span className="label-pixel text-gbc-acid shrink-0">
              {entry.totalScore} pts
            </span>
          </li>
        );
      })}
    </ol>
  );
}
