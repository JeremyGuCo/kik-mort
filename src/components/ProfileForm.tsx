"use client";

import { type FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/firebase/types";

export function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;

    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists()) return;
      const profile = snap.data() as UserDoc;
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setNickname(profile.nickname);
      setLoading(false);
    });
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: trimmedNickname,
      });
      setSaved(true);
    } catch {
      setError("Impossible d'enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="font-sans text-sm text-gbc-gray-300 text-center py-8">Chargement…</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-pixel flex w-full max-w-sm flex-col gap-4 p-5"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="nickname" className="label-pixel text-gbc-acid">
          Surnom (affiché dans l&apos;app)
        </label>
        <input
          id="nickname"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setSaved(false);
          }}
          maxLength={30}
          className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
            text-gbc-gray-100 outline-none focus:border-gbc-violet"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="firstName" className="font-sans text-xs text-gbc-gray-300">
          Prénom
        </label>
        <input
          id="firstName"
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
            setSaved(false);
          }}
          maxLength={50}
          className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
            text-gbc-gray-100 outline-none focus:border-gbc-violet"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="lastName" className="font-sans text-xs text-gbc-gray-300">
          Nom
        </label>
        <input
          id="lastName"
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);
            setSaved(false);
          }}
          maxLength={50}
          className="border-4 border-gbc-ink bg-gbc-panel2 px-3 py-3 font-sans text-base
            text-gbc-gray-100 outline-none focus:border-gbc-violet"
        />
      </div>

      {error && <p className="font-sans text-sm text-gbc-danger">{error}</p>}
      {saved && !error && (
        <p className="font-sans text-sm text-gbc-acid">Profil enregistré.</p>
      )}

      <button
        type="submit"
        disabled={saving || nickname.trim().length === 0}
        className="btn-pixel text-sm disabled:pointer-events-none disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
