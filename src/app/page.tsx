import { Leaderboard } from "@/components/Leaderboard";
import { DeclareFab } from "@/components/DeclareFab";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 p-4 pb-28">
      <h1 className="text-xl text-gbc-acid text-center mt-4">KIK-MORT</h1>

      <div className="w-full max-w-sm">
        <Leaderboard />
      </div>

      <DeclareFab />
    </main>
  );
}
