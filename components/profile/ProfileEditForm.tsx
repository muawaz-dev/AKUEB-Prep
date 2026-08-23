"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(main)/profile/actions";
import { classLevelToShortLabel } from "@/lib/slugFormat";

const fieldClass =
  "[color-scheme:light] dark:[color-scheme:dark] rounded-lg border border-black/15 dark:border-white/20 " +
  "bg-white dark:bg-white/10 px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors " +
  "hover:border-black/30 dark:hover:border-white/40 " +
  "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/30";

export function ProfileEditForm({
  initialName,
  initialClassId,
  classes,
}: {
  initialName: string;
  initialClassId: string | null;
  classes: { id: string; level: number }[];
}) {
  const [name, setName] = useState(initialName);
  const [classId, setClassId] = useState(initialClassId ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // A plain onSubmit (not the `action` form-actions API) deliberately -
  // React resets a form's fields once its `action` function resolves, even
  // when they're controlled, because our controlled state (name/classId)
  // doesn't itself change as a result of saving, so nothing re-renders to
  // re-assert it over that reset. Preventing the default submission and
  // reading FormData off the form element ourselves avoids that reset path.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(formData);
      setSaved(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-black/10 dark:border-white/10 p-5 flex flex-col sm:flex-row gap-4 sm:items-end"
    >
      <label className="flex-1 flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
        <span className="uppercase tracking-wide">Name</span>
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="Your name"
          className={fieldClass}
        />
      </label>
      <label className="flex-1 flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
        <span className="uppercase tracking-wide">Class</span>
        <select
          name="classId"
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        >
          <option value="">Not set</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLevelToShortLabel(c.level)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2.5 text-sm font-medium disabled:opacity-40 w-fit"
      >
        {pending ? "Saving..." : saved ? "Saved" : "Save"}
      </button>
    </form>
  );
}
