"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type LeaderboardEntry = Database["public"]["Views"]["leaderboard"]["Row"];

const RANK_STYLES = [
  { shadow: "shadow-pixel-acid", badge: "bg-gbc-acid" },
  { shadow: "shadow-pixel-violet", badge: "bg-gbc-violet" },
  { shadow: "shadow-pixel-pink", badge: "bg-gbc-pink" },
] as const;

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_score", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const supabase = createClient();
    // La vue leaderboard n'est pas elle-même "realtime" : on écoute les
    // tables sources (un score change quand une déclaration se ferme, ou
    // qu'un nouveau joueur rejoint) et on refetch l'agrégat à chaque coup.
    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "declarations" },
        fetchLeaderboard,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "users" },
        fetchLeaderboard,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

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

            {entry.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.avatar_url}
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
              {entry.total_score} pts
            </span>
          </li>
        );
      })}
    </ol>
  );
}
