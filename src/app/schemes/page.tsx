"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";
import { useUserProfile } from "@/lib/userProfile";
import Loader from "@/components/Loader";
import type { Language } from "@/lib/translations";

interface SchemeRow {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  department: string;
  level: string;
  categories: string[];
  is_women_focused: boolean;
  primary_goal: string;
  max_benefit: string;
  summary: string;
}

function displayName(s: SchemeRow, lang: Language): string {
  if (lang === "hindi") return s.name_hi || s.name;
  if (lang === "marathi") return s.name_mr || s.name;
  return s.name;
}

const GOALS = ["credit", "skills", "subsidy", "insurance"] as const;

export default function SchemesPage() {
  const { t, language } = useLanguage();
  const profile = useUserProfile();
  const [rows, setRows] = useState<SchemeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [level, setLevel] = useState<"all" | "Central" | "Maharashtra">("all");
  const [goal, setGoal] = useState<string>("all");
  const [womenOnly, setWomenOnly] = useState(false);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    // Loading reset on filter change (deliberate sync setState: shows
    // skeleton instead of stale results).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(null);
    setError(null);
    const params = new URLSearchParams();
    const myCat = mine ? profile?.category : null;
    if (myCat) params.set("category", myCat);
    if (level !== "all") params.set("level", level);
    if (goal !== "all") params.set("goal", goal);
    if (womenOnly || (mine && profile?.is_woman_entrepreneur)) params.set("women", "true");
    if (debouncedQ) params.set("q", debouncedQ);
    fetch(`/api/schemes?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setRows(j.schemes ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, level, goal, womenOnly, mine, profile?.category, profile?.is_woman_entrepreneur]);

  const goalLabel = (g: string) =>
    (t.schemes.goals as Record<string, string>)[g] ?? g;

  return (
    <div className="w-full px-4 py-6">
      <h1 className="text-[22px] font-black leading-tight">{t.schemes.title}</h1>

      <div className="mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.schemes.searchPlaceholder}
          className="h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[14px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["all", "Central", "Maharashtra"] as const).map((l) => {
          const active = level === l;
          const label = l === "all" ? t.schemes.all : l === "Central" ? t.schemes.central : t.schemes.state;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`rounded-full border-[1.5px] border-[var(--black)] px-3 py-1.5 text-[12px] font-black ${active ? "bg-[var(--black)] text-white" : "bg-white hover:bg-[var(--gray-100)]"}`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setWomenOnly(!womenOnly)}
          className={`rounded-full border-[1.5px] border-[var(--black)] px-3 py-1.5 text-[12px] font-black ${womenOnly ? "bg-[var(--red)] text-white" : "bg-white hover:bg-[var(--gray-100)]"}`}
        >
          {t.schemes.womenOnly}
        </button>
        {profile?.category && (
          <button
            type="button"
            onClick={() => setMine(!mine)}
            className={`rounded-full border-[1.5px] border-[var(--black)] px-3 py-1.5 text-[12px] font-black ${mine ? "bg-[var(--red)] text-white" : "bg-white hover:bg-[var(--gray-100)]"}`}
          >
            {t.categories[profile.category] || profile.category}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {[ "all", ...GOALS].map((g) => {
          const active = goal === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`rounded-full border px-3 py-1 text-[11px] font-black ${active ? "border-[var(--black)] bg-[var(--gray-100)]" : "border-[var(--gray-200)] bg-white opacity-70"}`}
            >
              {g === "all" ? t.schemes.all : goalLabel(g)}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {rows === null && !error && (
          <div className="flex justify-center p-8"><Loader /></div>
        )}
        {error && (
          <div className="rounded-[14px] border-[2px] border-[var(--red)] bg-white p-4 text-[13px] font-bold text-[var(--red)]">
            {error}
          </div>
        )}
        {rows !== null && rows.length === 0 && !error && (
          <div className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-4 text-[13px] font-bold opacity-60">
            {t.schemes.empty}
          </div>
        )}
        {(rows ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/schemes/${s.id}`}
            className="block rounded-[18px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[15px] font-black leading-snug">{displayName(s, language)}</div>
              {s.is_women_focused && (
                <span className="shrink-0 rounded-full bg-[var(--red)] px-2 py-0.5 text-[10px] font-black text-white">{t.schemes.womenOnly}</span>
              )}
            </div>
            <div className="mt-1 text-[11px] font-bold opacity-60">
              {s.level} • {goalLabel(s.primary_goal)}
            </div>
            {s.max_benefit && (
              <div className="mt-2 rounded-[10px] bg-[var(--gray-100)] p-2 text-[12px] font-black">
                {t.schemes.benefit}: {s.max_benefit}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
