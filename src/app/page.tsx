export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <div className="panel-pixel p-6 flex flex-col items-center gap-4 text-center max-w-sm w-full">
        <h1 className="text-xl text-gbc-acid">KIK-MORT</h1>
        <p className="text-sm text-gbc-gray-300 font-sans">
          Thème 8-bit coloré et lisible : titres et scores en pixel-art,
          contenu en sans-serif pour rester clair au quotidien.
        </p>

        <div className="panel-pixel bg-gbc-panel2 p-4 w-full flex items-center justify-between">
          <span className="font-sans text-sm">Amélie</span>
          <span className="label-pixel text-gbc-acid">12 pts</span>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button className="btn-pixel text-sm">Déclarer</button>
          <button className="btn-pixel-violet text-sm">Connu</button>
          <button className="btn-pixel-pink text-sm">Émotion</button>
        </div>

        <div className="flex gap-2">
          <span className="label-pixel bg-gbc-cyan text-gbc-ink px-2 py-1 border-2 border-gbc-ink">
            info
          </span>
          <span className="label-pixel bg-gbc-yellow text-gbc-ink px-2 py-1 border-2 border-gbc-ink">
            streak
          </span>
          <span className="label-pixel bg-gbc-danger text-gbc-ink px-2 py-1 border-2 border-gbc-ink">
            fermé
          </span>
        </div>
      </div>
    </main>
  );
}
