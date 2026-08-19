import Link from "next/link";
import { DeclarationHistory } from "@/components/DeclarationHistory";

export default function HistoriquePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 p-4 pb-12">
      <div className="mt-4 flex w-full max-w-sm items-center gap-3">
        <Link
          href="/"
          aria-label="Retour au classement"
          className="btn-pixel px-3 py-2 text-sm"
        >
          ←
        </Link>
        <h1 className="text-lg text-gbc-acid">Historique</h1>
      </div>

      <div className="w-full max-w-sm">
        <DeclarationHistory />
      </div>
    </main>
  );
}
