"use client";

import { useState } from "react";
import { Dumbbell, Plus, Repeat, X } from "lucide-react";
import type { Movement, Wod } from "@/lib/wod";

type MovementItem = Movement & { id: string };
type WodState = Omit<Wod, "movements"> & { movements: MovementItem[] };

const withId = (m: Movement): MovementItem => ({ ...m, id: crypto.randomUUID() });

const EXAMPLE = `"Fran"
21-15-9 for time:
Thrusters (95/65 lb)
Pull-ups`;

const FORMAT_LABELS: Record<Wod["format"], string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  rounds: "Rounds",
  intervals: "Intervals",
  strength: "Strength",
  other: "Workout",
};

const CATEGORY_STYLES: Record<Movement["category"], string> = {
  weightlifting: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  gymnastics: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  monostructural: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  other: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export default function Home() {
  const [text, setText] = useState("");
  const [wod, setWod] = useState<WodState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWod(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setWod({ ...data.wod, movements: (data.wod as Wod).movements.map(withId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">WOD Prep</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Paste today&apos;s workout to break it down by movement.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={7}
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Parsing…" : "Break it down"}
          </button>
          {!text && (
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Use example
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {wod && <WodSummary wod={wod} onChange={setWod} />}
    </main>
  );
}

function WodSummary({ wod, onChange }: { wod: WodState; onChange: (wod: WodState) => void }) {
  const meta = [FORMAT_LABELS[wod.format], wod.rounds, wod.duration].filter(Boolean);

  const remove = (id: string) =>
    onChange({ ...wod, movements: wod.movements.filter((m) => m.id !== id) });
  const add = (m: Movement) => onChange({ ...wod, movements: [...wod.movements, withId(m)] });

  return (
    <section className="mt-8">
      {wod.title && <h2 className="text-2xl font-semibold">{wod.title}</h2>}
      <p className="text-zinc-600 dark:text-zinc-400">{meta.join(" · ")}</p>
      {wod.notes && <p className="mt-1 text-sm text-zinc-500">{wod.notes}</p>}

      <ul className="mt-4 space-y-3">
        {wod.movements.map((m) => (
          <li key={m.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium">{m.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${CATEGORY_STYLES[m.category]}`}>
                  {m.category}
                </span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {m.reps && (
                <span className="flex items-center gap-1.5" title="Reps">
                  <Repeat size={14} aria-hidden /> {m.reps}
                </span>
              )}
              {m.load && (
                <span className="flex items-center gap-1.5" title="Load">
                  <Dumbbell size={14} aria-hidden /> {m.load}
                </span>
              )}
              {!m.reps && !m.load && <span>{m.originalText}</span>}
            </div>
          </li>
        ))}
      </ul>

      <AddMovement onAdd={add} />
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

function AddMovement({ onAdd }: { onAdd: (m: Movement) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [category, setCategory] = useState<Movement["category"]>("other");

  function reset() {
    setName("");
    setReps("");
    setLoad("");
    setCategory("other");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({
      name: trimmed,
      originalText: trimmed,
      reps: reps.trim() || null,
      load: load.trim() || null,
      category,
    });
    reset();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <Plus size={16} /> Add movement
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Movement, e.g. Wall Balls"
        className={inputClass}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Reps, e.g. 15"
          className={inputClass}
        />
        <input
          value={load}
          onChange={(e) => setLoad(e.target.value)}
          placeholder="Load, e.g. 20/14 lb"
          className={inputClass}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Movement["category"])}
          className={inputClass}
        >
          {Object.keys(CATEGORY_STYLES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
