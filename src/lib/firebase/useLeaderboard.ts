import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./client";
import type { DeclarationDoc, UserDoc, VoteDoc } from "./types";

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  totalScore: number;
}

// Pas de score stocké nulle part : chaque déclaration reste votable en
// permanence, donc le classement se recalcule en direct en sommant les
// votes reçus sur les déclarations de chacun — jamais de valeur "de
// confiance" écrite sur le profil d'un autre joueur.
export function useLeaderboard() {
  const [users, setUsers] = useState<(UserDoc & { id: string })[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [declarations, setDeclarations] = useState<(DeclarationDoc & { id: string })[]>([]);
  const [declarationsLoading, setDeclarationsLoading] = useState(true);

  const [pointsByDeclaration, setPointsByDeclaration] = useState<Record<string, number>>({});

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })));
      setUsersLoading(false);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "declarations"), (snapshot) => {
      setDeclarations(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DeclarationDoc) })),
      );
      setDeclarationsLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsubscribes = declarations.map((declaration) =>
      onSnapshot(collection(db, "declarations", declaration.id, "votes"), (snapshot) => {
        let points = 0;
        snapshot.forEach((voteDoc) => {
          const vote = voteDoc.data() as VoteDoc;
          if (vote.known) points += 1;
          if (vote.emotion) points += 1;
        });
        setPointsByDeclaration((prev) => ({ ...prev, [declaration.id]: points }));
      }),
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [declarations]);

  const entries = useMemo<LeaderboardEntry[]>(() => {
    return users
      .map((user) => ({
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        totalScore: declarations
          .filter((d) => d.declaredBy === user.id)
          .reduce((sum, d) => sum + (pointsByDeclaration[d.id] ?? 0), 0),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [users, declarations, pointsByDeclaration]);

  return { entries, loading: usersLoading || declarationsLoading };
}
