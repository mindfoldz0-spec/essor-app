"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/languageContext";
import { useUserProfile, refreshUserProfile } from "@/lib/userProfile";
import Loader from "@/components/Loader";
import VoiceButton from "@/components/VoiceButton";
import { IconSpeaker, IconStop } from "@/components/icons";
import { voiceCode, getVoiceText } from "@/lib/voice-strings";
import { speakText, stopSpeaking } from "@/lib/voice";

interface Msg {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
}

interface Guide {
  full_name: string;
  district: string;
  category: string;
  business_name: string;
  guide_years: number;
  what_you_sell: string[] | null;
}

function deviceId(): string | null {
  try {
    return window.localStorage.getItem("essor_device_id");
  } catch {
    return null;
  }
}

export default function SamudayPage() {
  const { t, language } = useLanguage();
  const profile = useUserProfile();
  const vc = voiceCode(language);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [guides, setGuides] = useState<Guide[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [guideBusy, setGuideBusy] = useState(false);
  const [years, setYears] = useState("");
  const [digestPlaying, setDigestPlaying] = useState(false);

  const district = profile?.district || "";
  const category = profile?.category || "";

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    fetch(`/api/circles/messages?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setMsgs(j.messages ?? []))
      .catch(() => setMsgs([]));
    fetch(`/api/guides?${params.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setGuides(j.guides ?? []))
      .catch(() => setGuides([]));
  }, [district, category]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => stopSpeaking(), []);

  const send = async () => {
    const id = deviceId();
    if (!id || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/circles/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: id,
          district,
          category,
          display_name: profile?.full_name || "",
          body: text.trim(),
        }),
      });
      if (res.ok) {
        setText("");
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const toggleGuide = async () => {
    const id = deviceId();
    if (!id || guideBusy) return;
    setGuideBusy(true);
    try {
      const next = !profile?.is_guide;
      const res = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: id, is_guide: next, guide_years: Number(years) || 0 }),
      });
      if (res.ok) refreshUserProfile();
    } finally {
      setGuideBusy(false);
    }
  };

  const playDigest = async () => {
    if (digestPlaying) {
      stopSpeaking();
      setDigestPlaying(false);
      return;
    }
    setDigestPlaying(true);
    try {
      const g = guides ?? [];
      const m = msgs ?? [];
      const sentence =
        language === "hindi"
          ? `आपके समूह में ${g.length} गाइड और ${m.length} संदेश हैं। जुड़े रहें, सीखते रहें।`
          : language === "marathi"
            ? `तुमच्या गटात ${g.length} गाइड आणि ${m.length} संदेश आहेत. जोडलेले रहा, शिकत रहा.`
            : `Your circle has ${g.length} guides and ${m.length} messages. Stay connected, keep learning.`;
      await speakText(sentence, vc);
    } finally {
      setDigestPlaying(false);
    }
  };

  const speakMsg = (m: Msg) => {
    void speakText(`${m.display_name}: ${m.body}`.slice(0, 500), vc);
  };

  return (
    <div className="w-full space-y-4 px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-[22px] font-black leading-tight">{t.samuday.title}</h1>
        <VoiceButton text={getVoiceText("page_samuday", vc)} lang={vc} voiceKey="page_samuday" label={t.listen} />
      </div>
      {(district || category) && (
        <p className="text-[12px] font-bold opacity-60">
          {district}{district && category ? " • " : ""}{category ? t.categories[category] || category : ""}
        </p>
      )}

      <button
        type="button"
        onClick={playDigest}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white text-[13px] font-black"
      >
        {digestPlaying ? <IconStop className="h-4 w-4" /> : <IconSpeaker className="h-4 w-4" />}{t.samuday.digest}
      </button>

      {/* Guides */}
      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <h2 className="text-[14px] font-black">{t.samuday.guides}</h2>
        {guides === null && (
          <div className="flex justify-center p-4"><Loader /></div>
        )}
        {guides !== null && guides.length === 0 && (
          <p className="mt-1 text-[12px] font-bold opacity-60">{t.samuday.empty}</p>
        )}
        <div className="mt-2 space-y-2">
          {(guides ?? []).map((g, i) => (
            <div key={i} className="rounded-[12px] border-[1.5px] border-[var(--gray-200)] p-3">
              <div className="text-[13px] font-black">{g.full_name}</div>
              <div className="text-[11px] font-bold opacity-60">
                {g.business_name || (g.category ? t.categories[g.category] || g.category : "")} • {g.guide_years}y
              </div>
            </div>
          ))}
        </div>
        {profile && (
          <div className="mt-3 border-t-[1.5px] border-[var(--gray-200)] pt-3">
            <div className="text-[12px] font-black">{profile.is_guide ? t.samuday.guideOn : t.samuday.becomeGuide}</div>
            <div className="mt-2 flex gap-2">
              <input
                value={years}
                onChange={(e) => setYears(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder={t.samuday.yearsLabel}
                inputMode="numeric"
                className="h-11 w-28 rounded-[12px] border-[2px] border-[var(--black)] bg-white px-3 text-[13px] font-bold outline-none placeholder:opacity-40"
              />
              <button
                type="button"
                onClick={toggleGuide}
                disabled={guideBusy}
                className={`flex h-11 flex-1 items-center justify-center rounded-full border-[2px] border-[var(--black)] text-[12px] font-black disabled:opacity-40 ${profile.is_guide ? "bg-white" : "bg-[var(--red)] text-white"}`}
              >
                {profile.is_guide ? t.samuday.guideOff : t.samuday.becomeGuide}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {msgs === null && (
          <div className="flex justify-center p-8"><Loader /></div>
        )}
        {msgs !== null && msgs.length === 0 && (
          <div className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-4 text-[13px] font-bold opacity-60">
            {t.samuday.empty}
          </div>
        )}
        {(msgs ?? []).map((m) => (
          <div key={m.id} className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-[12px] font-black">{m.display_name || "…"}</div>
              <button
                type="button"
                onClick={() => speakMsg(m)}
                aria-label={t.listen}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--black)] bg-white transition active:scale-90"
              >
                <IconSpeaker className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-0.5 text-[13px] font-bold leading-snug">{m.body}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.samuday.askPlaceholder}
          maxLength={500}
          className="h-12 min-w-0 flex-1 rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[14px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex h-12 shrink-0 items-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] px-5 text-[13px] font-black text-white disabled:opacity-40"
        >
          {t.samuday.send}
        </button>
      </div>
    </div>
  );
}
