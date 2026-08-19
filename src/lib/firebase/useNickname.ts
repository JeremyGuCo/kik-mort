import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./client";
import type { UserDoc } from "./types";

// Petit cache mémoire partagé : évite de relire le même profil à chaque
// carte d'une liste (historique, votes...) pendant la durée de la session.
const nicknameCache = new Map<string, string>();

export function useNickname(uid: string) {
  const [nickname, setNickname] = useState<string | null>(
    nicknameCache.get(uid) ?? null,
  );

  useEffect(() => {
    if (!uid) return;

    if (nicknameCache.has(uid)) {
      setNickname(nicknameCache.get(uid)!);
      return;
    }

    let cancelled = false;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const name = (snap.data() as UserDoc).nickname;
      nicknameCache.set(uid, name);
      setNickname(name);
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return nickname;
}
