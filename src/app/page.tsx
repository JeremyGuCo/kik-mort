import Link from "next/link";
import { AccountBadge } from "@/components/AccountBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { DeclarationHistory } from "@/components/DeclarationHistory";
import { DeclareFab } from "@/components/DeclareFab";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 p-4 pb-28 lg:pb-12">
      <div className="flex w-full max-w-sm items-center justify-between lg:max-w-4xl">
        <h1 className="text-xl text-gbc-acid">KI-KÉ-MORT</h1>
        <AccountBadge />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-8 lg:max-w-4xl lg:flex-row lg:items-start">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="label-pixel text-gbc-gray-300">Classement</h2>
            <Link
              href="/historique"
              className="font-sans text-xs text-gbc-cyan underline decoration-dotted"
            >
              Historique →
            </Link>
          </div>
          <Leaderboard />
        </div>

        <div className="flex w-full flex-col gap-2">
          <h2 className="label-pixel text-gbc-gray-300">Morts déclarés</h2>
          <DeclarationHistory />
        </div>
      </div>

      <DeclareFab />
    </main>
  );
}
