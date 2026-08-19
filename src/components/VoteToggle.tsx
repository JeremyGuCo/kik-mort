"use client";

type VoteToggleColor = "violet" | "pink";

const ACTIVE_TEXT: Record<VoteToggleColor, string> = {
  violet: "text-gbc-violet",
  pink: "text-gbc-pink",
};

const ACTIVE_BORDER: Record<VoteToggleColor, string> = {
  violet: "border-gbc-violet",
  pink: "border-gbc-pink",
};

const MAX_POINTS = 2;

export function VoteToggle({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: VoteToggleColor;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3">
      <span className="font-sans text-sm font-semibold text-gbc-gray-100">
        {label} <span className="label-pixel text-gbc-gray-300">/{MAX_POINTS}</span>
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Retirer un point (${label})`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="flex h-8 w-8 items-center justify-center border-2 border-gbc-ink
            bg-gbc-panel font-pixel text-sm text-gbc-gray-100
            disabled:pointer-events-none disabled:opacity-30"
        >
          −
        </button>

        <span
          className={`label-pixel w-4 text-center ${
            value > 0 ? ACTIVE_TEXT[color] : "text-gbc-gray-500"
          }`}
        >
          {value}
        </span>

        <button
          type="button"
          aria-label={`Ajouter un point (${label})`}
          onClick={() => onChange(Math.min(MAX_POINTS, value + 1))}
          disabled={value >= MAX_POINTS}
          className={`flex h-8 w-8 items-center justify-center border-2 bg-gbc-panel
            font-pixel text-sm text-gbc-gray-100 disabled:pointer-events-none
            disabled:opacity-30 ${value > 0 ? ACTIVE_BORDER[color] : "border-gbc-ink"}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
