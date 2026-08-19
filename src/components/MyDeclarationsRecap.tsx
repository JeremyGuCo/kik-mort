"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useVoteTally } from "@/lib/firebase/useVoteTally";
import type { DeclarationDoc } from "@/lib/firebase/types";

type OwnDeclaration = DeclarationDoc & { id: string };

function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) return "à l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp.toDate());
}

function DeclarationRow({ declaration }: { declaration: OwnDeclaration }) {
  const liveTally = useVoteTally(declaration.id);
  const isOpen = declaration.status === "open";
  const score = isOpen ? liveTally.points : declaration.scoreAwarded ?? 0;

  return (
    <li className="panel-pixel flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate font-sans text-sm font-semibold">
          {declaration.celebrityName}
        </p>
        <p className="font-sans text-xs text-gbc-gray-300">
          {formatDate(declaration.createdAt)}
        </p>
      </div>
      <span className={`label-pixel shrink-0 ${isOpen ? "text-gbc-yellow" : "text-gbc-acid"}`}>
        {isOpen ? "ouverte" : `+${score} pt${score > 1 ? "s" : ""}`}
      </span>
    </li>
  );
}

export function MyDeclarationsRecap() {
  const [user, setUser] = useState<User | null>(null);
  const [declarations, setDeclarations] = useState<OwnDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;

    const ownQuery = query(
      collection(db, "declarations"),
      where("declaredBy", "==", user.uid),
    );

    return onSnapshot(ownQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DeclarationDoc) }));
      docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setDeclarations(docs);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-6">Chargement…</p>
    );
  }

  if (declarations.length === 0) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-6">
        Tu n&apos;as encore rien déclaré.
      </p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2">
      {declarations.map((declaration) => (
        <DeclarationRow key={declaration.id} declaration={declaration} />
      ))}
    </ul>
  );
}
