"use client";

type VoteToggleColor = "violet" | "pink";

const ACTIVE_BG: Record<VoteToggleColor, string> = {
  violet: "bg-gbc-violet",
  pink: "bg-gbc-pink",
};

export function VoteToggle({
  label,
  points,
  color,
  checked,
  onChange,
}: {
  label: string;
  points: number;
  color: VoteToggleColor;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between border-4 border-gbc-ink px-4 py-3
        font-sans text-sm font-semibold transition-none
        ${checked ? `${ACTIVE_BG[color]} text-gbc-ink shadow-pixel-sm` : "bg-gbc-panel2 text-gbc-gray-300"}`}
    >
      <span>
        {label} <span className="label-pixel ml-1">+{points}</span>
      </span>

      <span
        className={`flex h-6 w-11 shrink-0 items-center border-2 border-gbc-ink px-0.5
          ${checked ? "justify-end bg-black/20" : "justify-start bg-black/10"}`}
      >
        <span className="h-4 w-4 border-2 border-gbc-ink bg-gbc-gray-100" />
      </span>
    </button>
  );
}
