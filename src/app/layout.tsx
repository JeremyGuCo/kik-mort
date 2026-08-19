import type { Metadata } from "next";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { PendingVoteModal } from "@/components/PendingVoteModal";

// Tout l'arbre dépend de l'état d'auth Firebase (AuthGate) et du temps réel
// Firestore : rien ici n'est vraiment statique, donc pas de prerendering.
// Ça évite aussi qu'un build échoue si les variables NEXT_PUBLIC_FIREBASE_*
// ne sont pas encore configurées sur l'environnement de déploiement.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kik-Mort",
  description: "Le jeu de comptage de points entre amis sur la mortalité des célébrités.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#181430",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AuthGate>
          {children}
          <PendingVoteModal />
        </AuthGate>
      </body>
    </html>
  );
}
