"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function AccountBadge() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
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
