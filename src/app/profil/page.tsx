import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { MyDeclarationsRecap } from "@/components/MyDeclarationsRecap";
import { MyGivenPoints } from "@/components/MyGivenPoints";

export default function ProfilPage() {
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
        <h1 className="text-lg text-gbc-acid">Profil</h1>
      </div>

      <ProfileForm />

      <div className="flex w-full max-w-sm flex-col gap-2">
        <h2 className="label-pixel text-gbc-gray-300">Mes déclarations</h2>
        <MyDeclarationsRecap />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <h2 className="label-pixel text-gbc-gray-300">Points donnés</h2>
        <MyGivenPoints />
      </div>
    </main>
  );
}
