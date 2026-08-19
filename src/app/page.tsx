export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <div className="panel-pixel p-6 flex flex-col items-center gap-4 text-center">
        <h1 className="text-lg text-gbc-acid">KIK-MORT</h1>
        <p className="text-sm text-gbc-gray-300">
          Thème 8-bit validé. Composants à venir.
        </p>
        <button className="btn-pixel text-sm">Déclarer</button>
      </div>
    </main>
  );
}
