"use client";

import Link from "next/link";

export function DeclareFab() {
  return (
    <Link
      href="/declarer"
      aria-label="Déclarer un décès"
      className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center
        rounded-full border-4 border-gbc-acid bg-black shadow-pixel-acid
        active:translate-x-pixel active:translate-y-pixel active:shadow-none
        transition-none select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/skull-fab.png"
        alt=""
        className="h-20 w-20 shrink-0"
        style={{ imageRendering: "pixelated" }}
      />

      <span
        aria-hidden="true"
        className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center
          rounded-full border-4 border-gbc-ink bg-gbc-acid font-pixel text-base
          leading-none text-gbc-ink"
      >
        +
      </span>
    </Link>
  );
}
