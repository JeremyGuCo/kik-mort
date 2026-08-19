"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { searchWikipedia, type WikipediaSuggestion } from "@/lib/wikipedia";

type SelectedWiki = { title: string; url: string };

export function DeclareForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [celebrityName, setCelebrityName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<WikipediaSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedWiki, setSelectedWiki] = useState<SelectedWiki | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthChecked(true);
    });
  }, []);

  // Recherche Wikipédia débouncée pendant la saisie, pour proposer une
  // fiche à associer à la déclaration (facultatif).
  useEffect(() => {
    if (!celebrityName.trim() || (selectedWiki && celebrityName === selectedWiki.title)) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timeout = setTimeout(() => {
      searchWikipedia(celebrityName, controller.signal)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
      setSearching(false);
    };
  }, [celebrityName, selectedWiki]);

  function handleNameChange(value: string) {
    setCelebrityName(value);
    if (selectedWiki && value !== selectedWiki.title) {
      setSelectedWiki(null);
    }
  }

  function handlePickSuggestion(suggestion: WikipediaSuggestion) {
    setSelectedWiki({ title: suggestion.title, url: suggestion.url });
    setCelebrityName(suggestion.title);
    setSuggestions([]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const trimmedName = celebrityName.trim();
    if (!trimmedName) return;

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "declarations"), {
        celebrityName: trimmedName,
        declaredBy: user.uid,
        createdAt: serverTimestamp(),
        wikipediaUrl: selectedWiki?.url ?? null,
      });
      router.push("/");
    } catch {
      setError("Impossible d'envoyer la déclaration. Réessaie.");
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Chargement…
      </p>
    );
  }

  if (!user) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">
        Connecte-toi pour déclarer un décès.
      </p>
    );
  }

  const showSuggestions = suggestions.length > 0 && !selectedWiki;
  const showNoMatch =
    !searching &&
    !selectedWiki &&
    suggestions.length === 0 &&
    celebrityName.trim().length >= 2;

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-pixel flex w-full max-w-sm flex-col gap-4 p-5"
    >
      <label htmlFor="celebrityName" className="label-pixel text-gbc-acid">
        Qui est mort ?
      </label>

      <div className="relative flex flex-col gap-2">
        <input
          id="celebrityName"
          name="celebrityName"
          type="text"
          autoFocus
          autoComplete="off"
          value={celebrityName}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Nom de la célébrité"
          maxLength={100}
          className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
            text-gbc-gray-100 outline-none placeholder:text-gbc-gray-500
            focus:border-gbc-violet"
        />

        {showSuggestions && (
          <ul className="flex flex-col gap-1 border-4 border-gbc-ink bg-gbc-panel2 p-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion.url}>
                <button
                  type="button"
                  onClick={() => handlePickSuggestion(suggestion)}
                  className="flex w-full items-center gap-2 px-2 py-2 text-left
                    font-sans hover:bg-gbc-panel"
                >
                  {suggestion.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={suggestion.thumbnailUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 border-2 border-gbc-ink object-cover"
                    />
                  ) : (
                    <span className="h-9 w-9 shrink-0 border-2 border-gbc-ink bg-gbc-panel" />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">
                      {suggestion.title}
                    </span>
                    {suggestion.description && (
                      <span className="truncate text-xs text-gbc-gray-300">
                        {suggestion.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {searching && (
          <p className="font-sans text-xs text-gbc-gray-300">
            Recherche sur Wikipédia…
          </p>
        )}

        {showNoMatch && (
          <p className="font-sans text-xs text-gbc-gray-300">
            Aucune fiche Wikipédia trouvée — tu peux déclarer sans lien.
          </p>
        )}

        {selectedWiki && (
          <div className="flex items-center justify-between gap-2 border-2 border-gbc-cyan bg-gbc-panel2 px-3 py-2">
            <span className="truncate font-sans text-sm">
              Lié à : {selectedWiki.title}
            </span>
            <button
              type="button"
              onClick={() => setSelectedWiki(null)}
              aria-label="Retirer le lien Wikipédia"
              className="label-pixel shrink-0 text-gbc-gray-300"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting || celebrityName.trim().length === 0}
        className="btn-pixel text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? "Envoi…" : "Déclarer"}
      </button>
    </form>
  );
}
