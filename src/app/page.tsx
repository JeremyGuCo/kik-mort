import Link from "next/link";
import { AccountBadge } from "@/components/AccountBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { DeclareFab } from "@/components/DeclareFab";
import { MyOpenDeclarations } from "@/components/MyOpenDeclarations";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 p-4 pb-28">
      <div className="flex w-full max-w-sm items-center justify-between">
        <h1 className="text-xl text-gbc-acid">KIK-MORT</h1>
        <AccountBadge />
      </div>

      <MyOpenDeclarations />

      <div className="flex w-full max-w-sm flex-col gap-2">
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

      <DeclareFab />
    </main>
  );
}
