"use client";

import Link from "next/link";

export function DeclareFab() {
  return (
    <Link
      href="/declarer"
      aria-label="Déclarer un décès"
      className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center
        rounded-full border-4 border-gbc-ink bg-gbc-acid text-gbc-ink shadow-pixel-lg
        active:translate-x-pixel active:translate-y-pixel active:shadow-none
        transition-none select-none"
    >
      <span className="text-3xl leading-none" aria-hidden="true">
        +
      </span>
    </Link>
  );
}
