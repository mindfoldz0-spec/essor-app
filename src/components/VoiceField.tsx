"use client";

import { useRef, useState } from "react";
import { speakText, stopSpeaking, isSpeaking } from "@/lib/voice";
import type { VoiceCode } from "@/lib/voice-strings";
import { VOICE_STRINGS } from "@/lib/voice-strings";
import { useLanguage } from "@/lib/languageContext";
import { IconSpeaker, IconStop, IconMic } from "@/components/icons";

interface Props {
  label: string;
  /** Localized "what to fill" text, spoken on speaker tap + field focus. */
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  lang: VoiceCode;
  /** Pre-baked clip key for the prompt, e.g. "f_name". */
  voiceKey: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  /** Digits-only (phone/pincode style). */
  numeric?: boolean;
}

/** Text input with speaker listen + mic speak-to-fill, in Essor red/black style. */
export default function VoiceField({
  label,
  prompt,
  value,
  onChange,
  lang,
  voiceKey,
  inputMode,
  maxLength,
  placeholder,
  hint,
  numeric,
}: Props) {
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { t } = useLanguage();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speakPrompt = async () => {
    // Spam-proof: while the prompt is playing, taps only stop it.
    // A tap after it finishes plays it again — never restarted mid-way.
    if (isSpeaking() || speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      await speakText(prompt, lang, { cacheKey: `${voiceKey}:${lang}` });
    } finally {
      setSpeaking(false);
    }
  };

  const startListening = async () => {
    try {
      setListening(true);
      // announce listening in chosen language (pre-baked, instant).
      // interrupt:true — a tap on mic is explicit: cut any prompt so the
      // recording doesn't capture our own voice.
      await speakText(VOICE_STRINGS.a_listen[lang], lang, { cacheKey: `a_listen:${lang}`, interrupt: true });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await transcribe(blob);
      };
      mediaRef.current = rec;
      rec.start();
      // auto-stop after 8s
      setTimeout(() => {
        if (rec.state === "recording") {
          rec.stop();
          setListening(false);
        }
      }, 8000);
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    setListening(false);
  };

  const transcribe = async (blob: Blob) => {
    setBusy(true);
    try {
      const buf = await blob.arrayBuffer();
      // base64 without Buffer (browser-safe)
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const res = await fetch("/api/voice/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: b64, mime: blob.type || "audio/webm", language: lang }),
      });
      const data = await res.json();
      if (data.transcript) {
        let t: string = data.transcript;
        if (numeric) t = t.replace(/\D/g, "").slice(0, maxLength ?? 10);
        else if (maxLength) t = t.slice(0, maxLength);
        onChange(t);
      }
    } catch {
      /* keep old value */
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (v: string) => {
    if (numeric) onChange(v.replace(/\D/g, "").slice(0, maxLength ?? 10));
    else onChange(v);
  };

  return (
    <div className="w-full">
      <label className="mb-1 block text-[13px] font-black">{label}</label>
      <div className="relative">
        <input
          value={value}
          type="text"
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            speakText(prompt, lang, { cacheKey: `${voiceKey}:${lang}` }).catch(() => undefined);
          }}
          className="h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white py-0 pl-4 pr-[92px] text-[15px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          <button
            type="button"
            onClick={speakPrompt}
            aria-label={`${t.voice.hear} ${label}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[var(--black)] bg-white transition active:scale-90"
          >
            {speaking ? <IconStop className="h-4 w-4" /> : <IconSpeaker className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? t.voice.stop : `${t.voice.speak} ${label}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[var(--black)] transition active:scale-90 ${
              listening ? "animate-pulse bg-[var(--red)] text-white" : "bg-[var(--black)] text-white"
            }`}
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : listening ? (
              <IconStop className="h-4 w-4" />
            ) : (
              <IconMic className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {hint && <p className="mt-1 text-[11px] font-bold opacity-60">{hint}</p>}
    </div>
  );
}
