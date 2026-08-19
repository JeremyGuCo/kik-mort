"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useNickname } from "@/lib/firebase/useNickname";
import { useVoteTally } from "@/lib/firebase/useVoteTally";
import type { DeclarationDoc, VoteDoc } from "@/lib/firebase/types";
import { VoteToggle } from "./VoteToggle";

type HistoryDeclaration = DeclarationDoc & { id: string };

function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) return "à l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp.toDate());
}

function VoteRow({
  voterId,
  known,
  emotion,
}: {
  voterId: string;
  known: number;
  emotion: number;
}) {
  const nickname = useNickname(voterId);
  const points = known + emotion;

  return (
    <li className="flex items-center justify-between gap-2 font-sans text-xs text-gbc-gray-300">
      <span className="truncate">{nickname ?? "…"}</span>
      <span className="label-pixel shrink-0">
        {points === 0
          ? "0 pt"
          : [known > 0 && `connu ${known}`, emotion > 0 && `émotion ${emotion}`]
              .filter(Boolean)
              .join(" · ")}
      </span>
    </li>
  );
}

function VoteDetails({ declarationId }: { declarationId: string }) {
  const [votes, setVotes] = useState<(VoteDoc & { id: string })[]>([]);

  useEffect(() => {
    return onSnapshot(
      collection(db, "declarations", declarationId, "votes"),
      (snapshot) => {
        setVotes(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VoteDoc) })));
      },
    );
  }, [declarationId]);

  if (votes.length === 0) {
    return (
      <p className="font-sans text-xs text-gbc-gray-300">Aucun vote pour l&apos;instant.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 border-t-2 border-gbc-ink pt-2">
      {votes.map((vote) => (
        <VoteRow key={vote.id} voterId={vote.id} known={vote.known} emotion={vote.emotion} />
      ))}
    </ul>
  );
}

// Toggles éditables pour son propre vote — modifiable à tout moment, il
// n'y a plus de notion de clôture.
function MyVoteEditor({
  declarationId,
  celebrityName,
  voterId,
}: {
  declarationId: string;
  celebrityName: string;
  voterId: string;
}) {
  const [known, setKnown] = useState(0);
  const [emotion, setEmotion] = useState(0);

  useEffect(() => {
    return onSnapshot(
      doc(db, "declarations", declarationId, "votes", voterId),
      (snap) => {
        if (!snap.exists()) return;
        const vote = snap.data() as VoteDoc;
        setKnown(vote.known);
        setEmotion(vote.emotion);
      },
    );
  }, [declarationId, voterId]);

  async function save(nextKnown: number, nextEmotion: number) {
    await setDoc(doc(db, "declarations", declarationId, "votes", voterId), {
      voterId,
      celebrityName,
      known: nextKnown,
      emotion: nextEmotion,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t-2 border-gbc-ink pt-2">
      <p className="label-pixel text-gbc-gray-300">Mon vote</p>
      <div className="flex gap-2">
        <VoteToggle
          label="Connu"
          color="violet"
          value={known}
          onChange={(value) => {
            setKnown(value);
            save(value, emotion);
          }}
        />
        <VoteToggle
          label="Émotion"
          color="pink"
          value={emotion}
          onChange={(value) => {
            setEmotion(value);
            save(known, value);
          }}
        />
      </div>
    </div>
  );
}

function HistoryCard({ declaration }: { declaration: HistoryDeclaration }) {
  const [user, setUser] = useState<User | null>(null);
  const declarantName = useNickname(declaration.declaredBy);
  const liveTally = useVoteTally(declaration.id);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isOwn = user?.uid === declaration.declaredBy;

  return (
    <li className="panel-pixel flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold">
            {declaration.celebrityName}
          </p>
          <p className="font-sans text-xs text-gbc-gray-300">
            par {declarantName ?? "…"} · {formatDate(declaration.createdAt)}
          </p>
        </div>
        <span className="label-pixel shrink-0 text-gbc-acid">
          {liveTally.points} pt{liveTally.points > 1 ? "s" : ""}
        </span>
      </div>

      {declaration.wikipediaUrl && (
        <a
          href={declaration.wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit font-sans text-xs text-gbc-cyan underline decoration-dotted"
        >
          Voir la fiche Wikipédia
        </a>
      )}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-fit font-sans text-xs text-gbc-gray-300 underline decoration-dotted"
      >
        {expanded ? "Masquer les votes" : "Voir les votes"}
      </button>

      {expanded && <VoteDetails declarationId={declaration.id} />}

      {user && !isOwn && (
        <MyVoteEditor
          declarationId={declaration.id}
          celebrityName={declaration.celebrityName}
          voterId={user.uid}
        />
      )}
    </li>
  );
}

export function DeclarationHistory() {
  const [declarations, setDeclarations] = useState<HistoryDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyQuery = query(collection(db, "declarations"), orderBy("createdAt", "desc"));
    return onSnapshot(historyQuery, (snapshot) => {
      setDeclarations(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DeclarationDoc) })),
      );
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">Chargement…</p>
    );
  }

  if (declarations.length === 0) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Aucune déclaration pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-3">
      {declarations.map((declaration) => (
        <HistoryCard key={declaration.id} declaration={declaration} />
      ))}
    </ul>
  );
}
