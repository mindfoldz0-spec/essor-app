"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";
import Loader from "@/components/Loader";
import VoiceButton from "@/components/VoiceButton";
import VoiceField from "@/components/VoiceField";
import { voiceCode, getVoiceText } from "@/lib/voice-strings";

interface Entry {
  id: string;
  person_name: string;
  amount: string | number;
  kind: string;
  note: string;
  created_at: string;
}

interface Passport {
  entries_30d: number;
  inflow_30d: number;
  outflow_30d: number;
  total_inflow: number;
  total_outflow: number;
  total_entries: number;
  active_days: number;
  counterparties: number;
  score: number;
  ready: boolean;
}

function deviceId(): string | null {
  try {
    return window.localStorage.getItem("essor_device_id");
  } catch {
    return null;
  }
}

const inr = (n: number | string) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function KhataPage() {
  const { t, language } = useLanguage();
  const vc = voiceCode(language);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"udhaar" | "jama">("udhaar");
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = deviceId();
    if (!id) {
      return;
    }
    let cancelled = false;
    fetch(`/api/khata?device_id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setEntries(j.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    fetch(`/api/khata/passport?device_id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setPassport(j.passport ?? null);
      })
      .catch(() => {
        if (!cancelled) setPassport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const add = async () => {
    const id = deviceId();
    if (!id || !person.trim() || !amount || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: id, person_name: person.trim(), amount: Number(amount), kind }),
      });
      if (res.ok) {
        setPerson("");
        setAmount("");
        setReloadKey((k) => k + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  // Loan readiness: 4 checks (history auto-read from passport totals)
  const totalEntries = passport?.total_entries ?? 0;
  const checks = [
    { id: "age", label: t.loan.qAge, auto: null as boolean | null },
    { id: "income", label: t.loan.qIncome, auto: null as boolean | null },
    { id: "docs", label: t.loan.qDocs, auto: null as boolean | null },
    { id: "history", label: t.loan.qHistory, auto: totalEntries >= 10 ? true : totalEntries > 0 ? null : false },
  ];
  const resolved = checks.map((c) => answers[c.id] ?? c.auto);
  const answered = resolved.filter((v) => v !== null) as boolean[];
  const score = answered.length ? Math.round((answered.filter(Boolean).length / checks.length) * 100) : 0;
  const verdict = score >= 75 ? t.loan.ready : score >= 50 ? t.loan.almost : t.loan.early;

  const net = (passport?.total_inflow ?? 0) - (passport?.total_outflow ?? 0);

  return (
    <div className="w-full space-y-4 px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-[22px] font-black leading-tight">{t.khata.title}</h1>
        <VoiceButton text={getVoiceText("page_khata", vc)} lang={vc} voiceKey="page_khata" label={t.listen} />
      </div>

      {/* Credit Passport */}
      <div className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--black)] p-5 text-white shadow-[4px_4px_0_var(--gray-200)]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black tracking-widest">{t.khata.passport}</span>
          <span className={`rounded-full px-3 py-1 text-[12px] font-black ${passport?.ready ? "bg-green-500" : "bg-[var(--red)]"}`}>
            {t.khata.score}: {passport?.score ?? 0}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[12px] bg-white/10 p-2">
            <div className="text-[14px] font-black">{inr(passport?.total_inflow ?? 0)}</div>
            <div className="text-[10px] font-bold opacity-70">{t.khata.inflow}</div>
          </div>
          <div className="rounded-[12px] bg-white/10 p-2">
            <div className="text-[14px] font-black">{inr(passport?.total_outflow ?? 0)}</div>
            <div className="text-[10px] font-bold opacity-70">{t.khata.outflow}</div>
          </div>
          <div className="rounded-[12px] bg-white/10 p-2">
            <div className="text-[14px] font-black">{inr(net)}</div>
            <div className="text-[10px] font-bold opacity-70">{t.khata.pending}</div>
          </div>
        </div>
        <div className="mt-2 text-[11px] font-bold opacity-70">
          {t.khata.entries30d}: {passport?.entries_30d ?? 0} • {t.khata.counterparties}: {passport?.counterparties ?? 0} •{" "}
          {passport?.ready ? t.khata.ready : t.khata.notReady}
        </div>
      </div>

      {/* Add entry */}
      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <VoiceField
          label={t.khata.personLabel}
          prompt={getVoiceText("f_name_hint", vc)}
          value={person}
          onChange={setPerson}
          lang={vc}
          voiceKey="f_name_hint"
          maxLength={60}
          placeholder={t.khata.personPlaceholder}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder={t.khata.amountLabel}
            inputMode="numeric"
            className="h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[15px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
          />
          <div className="grid grid-cols-2 gap-1">
            {(["udhaar", "jama"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-[14px] border-[2px] border-[var(--black)] text-[11px] font-black ${kind === k ? "bg-[var(--black)] text-white" : "bg-white"}`}
              >
                {k === "udhaar" ? t.khata.udhaar : t.khata.jama}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving || !person.trim() || !amount}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--red)] text-white text-[13px] font-black disabled:opacity-40"
        >
          {t.khata.add}
        </button>
      </div>

      {/* Loan readiness */}
      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <h2 className="text-[14px] font-black">{t.loan.title}</h2>
        <div className="mt-2 space-y-2">
          {checks.map((c) => {
            const v = answers[c.id] ?? c.auto;
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-[12px] border-[1.5px] border-[var(--gray-200)] p-2.5">
                <span className="text-[12px] font-bold">{c.label}</span>
                {c.auto !== null ? (
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${c.auto ? "bg-green-100 text-green-800" : "bg-[var(--gray-100)]"}`}>
                    {c.auto ? t.loan.yes : t.loan.no}
                  </span>
                ) : (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => setAnswers({ ...answers, [c.id]: true })}
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${v === true ? "bg-[var(--black)] text-white" : "bg-[var(--gray-100)]"}`}>{t.loan.yes}</button>
                    <button type="button" onClick={() => setAnswers({ ...answers, [c.id]: false })}
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${v === false ? "bg-[var(--black)] text-white" : "bg-[var(--gray-100)]"}`}>{t.loan.no}</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-[12px] bg-[var(--gray-100)] p-3">
          <div className="text-[12px] font-black">{t.loan.yourScore}: {score}%</div>
          <div className="text-[12px] font-bold text-[var(--red)]">{verdict}</div>
        </div>
        <Link href="/schemes?goal=credit" className="mt-3 flex h-11 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-white text-[13px] font-black hover:bg-[var(--gray-100)]">
          {t.loan.viewSchemes}
        </Link>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries === null && (
          <div className="flex justify-center p-8"><Loader /></div>
        )}
        {entries !== null && entries.length === 0 && (
          <div className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-4 text-[13px] font-bold opacity-60">
            {t.khata.empty}
          </div>
        )}
        {(entries ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded-[14px] border-[2px] border-[var(--black)] bg-white p-3">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-black">{e.person_name}</div>
              <div className="text-[10px] font-bold opacity-50">{new Date(e.created_at).toLocaleDateString()}</div>
            </div>
            <div className={`shrink-0 text-[14px] font-black ${e.kind === "jama" ? "text-green-700" : "text-[var(--red)]"}`}>
              {e.kind === "jama" ? "+" : "−"}{inr(e.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
