"use client";

const PRESET_AVATARS = ["acid", "violet", "pink", "cyan", "yellow", "gray"].map(
  (name) => `/avatars/${name}.png`,
);

export function AvatarPicker({
  currentAvatarUrl,
  onSelect,
}: {
  currentAvatarUrl: string | null;
  onSelect: (avatarUrl: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {currentAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentAvatarUrl}
          alt=""
          className="h-16 w-16 rounded-full border-4 border-gbc-ink object-cover"
        />
      ) : (
        <span className="h-16 w-16 rounded-full border-4 border-gbc-ink bg-gbc-panel2" />
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {PRESET_AVATARS.map((avatarUrl) => (
          <button
            key={avatarUrl}
            type="button"
            onClick={() => onSelect(avatarUrl)}
            aria-label="Choisir cet avatar"
            className={`h-10 w-10 rounded-full border-2 bg-gbc-panel2 p-0.5
              ${currentAvatarUrl === avatarUrl ? "border-gbc-acid" : "border-gbc-ink"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
