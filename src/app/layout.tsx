import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kik-Mort",
  description: "Le jeu de comptage de points entre amis sur la mortalité des célébrités.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f0f1b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
