import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./client";
import type { UserDoc } from "./types";

// Petit cache mémoire partagé : évite de relire le même profil à chaque
// carte d'une liste (historique, votes...) pendant la durée de la session.
const usernameCache = new Map<string, string>();

export function useUsername(uid: string) {
  const [username, setUsername] = useState<string | null>(
    usernameCache.get(uid) ?? null,
  );

  useEffect(() => {
    if (usernameCache.has(uid)) {
      setUsername(usernameCache.get(uid)!);
      return;
    }

    let cancelled = false;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const name = (snap.data() as UserDoc).username;
      usernameCache.set(uid, name);
      setUsername(name);
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return username;
}
