"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/languageContext";
import Loader from "@/components/Loader";
import type { Language } from "@/lib/translations";

interface Scheme {
  id: string;
  name: string;
  name_hi: string;
  name_mr: string;
  department: string;
  department_hi: string;
  department_mr: string;
  level: string;
  categories: string[];
  target_group: string;
  target_group_hi: string;
  target_group_mr: string;
  is_women_focused: boolean;
  primary_goal: string;
  max_benefit: string;
  max_benefit_hi: string;
  max_benefit_mr: string;
  summary: string;
  summary_hi: string;
  summary_mr: string;
  eligibility: string[];
  eligibility_hi: string[];
  eligibility_mr: string[];
  documents: string[];
  documents_hi: string[];
  documents_mr: string[];
  apply_steps: string[];
  apply_steps_hi: string[];
  apply_steps_mr: string[];
  official_portal: string;
  youtube_tutorials: { title: string; url: string; language: string }[];
  official_articles: { title: string; url: string }[];
}

function displayName(s: Scheme, lang: Language): string {
  if (lang === "hindi") return s.name_hi || s.name;
  if (lang === "marathi") return s.name_mr || s.name;
  return s.name;
}

/** Localized text / list with English fallback (translation backfill in progress). */
function pick(en: string, hi: string, mr: string, lang: Language): string {
  if (lang === "hindi") return hi || en;
  if (lang === "marathi") return mr || en;
  return en;
}

function pickArr(en: string[], hi: string[], mr: string[], lang: Language): string[] {
  if (lang === "hindi") return hi?.length ? hi : en;
  if (lang === "marathi") return mr?.length ? mr : en;
  return en;
}

export default function SchemeDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const { t, language } = useLanguage();
  const [scheme, setScheme] = useState<Scheme | null | undefined>(() => (!id ? null : undefined));

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/schemes/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setScheme(j.scheme ?? null);
      })
      .catch(() => {
        if (!cancelled) setScheme(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (scheme === undefined)
    return <div className="flex min-h-[50vh] items-center justify-center p-8"><Loader /></div>;
  if (scheme === null)
    return (
      <div className="p-6">
        <div className="rounded-[24px] border-[2px] border-[var(--black)] bg-white p-8 text-center shadow-[4px_4px_0_var(--black)]">
          <h1 className="text-[18px] font-black">{t.schemes.empty}</h1>
          <Link href="/schemes" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[var(--black)] px-6 text-white font-black border-[2px] border-[var(--black)]">{t.schemes.back}</Link>
        </div>
      </div>
    );

  const goalLabel = (t.schemes.goals as Record<string, string>)[scheme.primary_goal] ?? scheme.primary_goal;

  return (
    <div className="w-full space-y-4 px-4 py-6">
      <Link href="/schemes" className="inline-flex h-9 items-center rounded-full border-[1.5px] border-[var(--black)] bg-white px-4 text-[12px] font-black hover:bg-[var(--gray-100)]">
        ← {t.schemes.back}
      </Link>

      <div className="rounded-[24px] border-[2px] border-[var(--black)] bg-white p-5 shadow-[4px_4px_0_var(--black)]">
        <span className="rounded-full bg-[var(--black)] px-3 py-1 text-[11px] font-black tracking-widest text-white">
          {scheme.level} • {goalLabel}
        </span>
        <h1 className="mt-3 text-[20px] font-black leading-tight">{displayName(scheme, language)}</h1>
        <p className="mt-1 text-[12px] font-bold opacity-60">{pick(scheme.department, scheme.department_hi, scheme.department_mr, language)}</p>
        {scheme.summary && <p className="mt-3 text-[13px] font-bold leading-relaxed">{pick(scheme.summary, scheme.summary_hi, scheme.summary_mr, language)}</p>}
        {scheme.max_benefit && (
          <div className="mt-3 rounded-[14px] bg-[var(--gray-100)] p-3 text-[13px] font-black">
            {t.schemes.benefit}: {pick(scheme.max_benefit, scheme.max_benefit_hi, scheme.max_benefit_mr, language)}
          </div>
        )}
        {scheme.official_portal && (
          <a href={scheme.official_portal} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--red)] text-white text-[14px] font-black">
            {t.schemes.portal} ↗
          </a>
        )}
      </div>

      {pickArr(scheme.eligibility, scheme.eligibility_hi, scheme.eligibility_mr, language).length > 0 && (
        <Section title={t.schemes.eligibility} items={pickArr(scheme.eligibility, scheme.eligibility_hi, scheme.eligibility_mr, language)} ordered={false} />
      )}
      {pickArr(scheme.documents, scheme.documents_hi, scheme.documents_mr, language).length > 0 && (
        <Section title={t.schemes.documents} items={pickArr(scheme.documents, scheme.documents_hi, scheme.documents_mr, language)} ordered={false} />
      )}
      {pickArr(scheme.apply_steps, scheme.apply_steps_hi, scheme.apply_steps_mr, language).length > 0 && (
        <Section title={t.schemes.steps} items={pickArr(scheme.apply_steps, scheme.apply_steps_hi, scheme.apply_steps_mr, language)} ordered />
      )}

      {scheme.youtube_tutorials.length > 0 && (
        <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
          <h2 className="text-[14px] font-black">{t.schemes.videos}</h2>
          <div className="mt-2 space-y-2">
            {scheme.youtube_tutorials.map((v, i) => (
              <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block rounded-[12px] border-[1.5px] border-[var(--gray-200)] p-3 hover:border-[var(--black)]">
                <div className="text-[13px] font-black leading-snug">{v.title}</div>
                <div className="text-[11px] font-bold opacity-50">{v.language} • YouTube</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, ordered }: { title: string; items: string[]; ordered: boolean }) {
  return (
    <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
      <h2 className="text-[14px] font-black">{title}</h2>
      {ordered ? (
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] font-bold">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      ) : (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] font-bold">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}
