import Link from "next/link";
import { DeclareForm } from "@/components/DeclareForm";

export default function DeclarerPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-6 p-4">
      <div className="mt-4 flex w-full max-w-sm items-center gap-3">
        <Link
          href="/"
          aria-label="Retour au classement"
          className="btn-pixel px-3 py-2 text-sm"
        >
          ←
        </Link>
        <h1 className="text-lg text-gbc-acid">Déclarer</h1>
      </div>

      <DeclareForm />
    </main>
  );
}
