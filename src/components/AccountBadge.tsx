"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/firebase/types";

export function AccountBadge() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Écoute en direct (pas le cache useNickname) pour refléter immédiatement
  // une modification faite sur /profil.
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setNickname((snap.data() as UserDoc).nickname);
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Link href="/profil" className="flex items-center gap-2">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="h-8 w-8 rounded-full border-2 border-gbc-ink object-cover"
          />
        ) : (
          <span className="h-8 w-8 rounded-full border-2 border-gbc-ink bg-gbc-panel2" />
        )}
        {nickname && (
          <span className="max-w-[6rem] truncate font-sans text-sm">{nickname}</span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => signOut(auth)}
        className="label-pixel text-gbc-gray-300 underline decoration-dotted"
      >
        déconnexion
      </button>
    </div>
  );
}
