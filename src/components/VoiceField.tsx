"use client";

import { useEffect, useRef, useState } from "react";
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

/** Strip leading/trailing silence from 16kHz PCM so short utterances
 * aren't drowned in room noise. Keeps 200ms padding each side. */
function trimSilence(pcm: Int16Array, sampleRate: number): Int16Array {
  const frameLen = Math.floor(sampleRate * 0.02); // 20ms frames
  const frames = Math.max(1, Math.floor(pcm.length / frameLen));
  let peak = 0;
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = f * frameLen;
    const end = Math.min(pcm.length, start + frameLen);
    for (let i = start; i < end; i++) sum += Math.abs(pcm[i]);
    energy[f] = sum / Math.max(1, end - start);
    if (energy[f] > peak) peak = energy[f];
  }
  const threshold = Math.max(300, peak * 0.08);
  let first = 0;
  while (first < frames - 1 && energy[first] < threshold) first++;
  let last = frames - 1;
  while (last > first && energy[last] < threshold) last--;
  const pad = 10; // 200ms padding
  const from = Math.max(0, (first - pad) * frameLen);
  const to = Math.min(pcm.length, (last + 1 + pad) * frameLen);
  return to > from ? pcm.slice(from, to) : pcm;
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    const CHUNK = 0x8000;
    let bin = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  });
}

/** Decode any recorded blob and re-encode as 16kHz mono WAV (what Sarvam STT wants). */
async function blobToWavBase64(blob: Blob): Promise<{ base64: string; mime: string }> {
  const raw = await blob.arrayBuffer();
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const decoded = await ctx.decodeAudioData(raw.slice(0));
    const targetRate = 16000;
    const ch = decoded.getChannelData(0);
    const ratio = decoded.sampleRate / targetRate;
    const len = Math.max(1, Math.floor(ch.length / ratio));
    const pcm = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, ch[Math.floor(i * ratio)]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    // Trim leading/trailing silence: short name clips drown in 8s of room
    // noise otherwise, and STT accuracy on 1–2 word utterances collapses.
    // 20ms frames, voice activity above 8% of peak, 200ms padding kept.
    const trimmed = trimSilence(pcm, targetRate);
    const buf = new ArrayBuffer(44 + trimmed.length * 2);
    const v = new DataView(buf);
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    v.setUint32(4, 36 + trimmed.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, targetRate, true);
    v.setUint32(28, targetRate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    writeStr(36, "data");
    v.setUint32(40, trimmed.length * 2, true);
    new Int16Array(buf, 44).set(trimmed);
    const bytes = new Uint8Array(buf);
    const CHUNK = 0x8000;
    let bin = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return { base64: btoa(bin), mime: "audio/wav" };
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }
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
  const [speaking, setSpeaking] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [justHeard, setJustHeard] = useState(false);
  // Mic state machine: idle → announcing → recording → processing → idle.
  // Every async step is guarded by sessionRef, so rapid taps can never
  // orphan a recorder or overlap two sessions.
  const [phase, setPhase] = useState<"idle" | "announcing" | "recording" | "processing">("idle");
  const [secsLeft, setSecsLeft] = useState(8);
  const { t } = useLanguage();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionRef = useRef(0);
  const recSessionRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    try {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
  };

  // Full cleanup on unmount: no ghost recorders, no live mic.
  useEffect(() => {
    return () => {
      // Intentional: invalidate by current counter (simple monotonic id,
      // not a DOM node, so the stale-closure concern doesn't apply).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      sessionRef.current++;
      clearTimer();
      try {
        if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      } catch {
        /* ignore */
      }
      mediaRef.current = null;
      try {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
      } catch {
        /* ignore */
      }
      streamRef.current = null;
    };
  }, []);

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
    const mySession = ++sessionRef.current;
    clearTimer();
    const alive = () => mySession === sessionRef.current;
    try {
      setPhase("announcing");
      setSttError(null);
      // Ask for the mic UP FRONT, in parallel with the announcement —
      // otherwise the user waits ~3s staring at a pulse before recording.
      const micPromise = navigator.mediaDevices.getUserMedia({ audio: true });
      // interrupt:true — a tap on mic is explicit: cut any prompt so the
      // recording doesn't capture our own voice.
      await speakText(VOICE_STRINGS.a_listen[lang], lang, { cacheKey: `a_listen:${lang}`, interrupt: true });
      // Cancelled (second tap) while announcing? Never touch the mic.
      if (!alive()) {
        micPromise.then((s) => s.getTracks().forEach((tr) => tr.stop())).catch(() => undefined);
        return;
      }
      const stream = await micPromise;
      if (!alive()) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });
      chunksRef.current = [];
      recSessionRef.current = mySession;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onerror = () => {
        if (recSessionRef.current !== sessionRef.current) return;
        sessionRef.current++;
        clearTimer();
        stopStream();
        mediaRef.current = null;
        setPhase("idle");
        setSttError(t.voice.sttFailed);
      };
      rec.onstop = async () => {
        // Stale session (cancelled/tapped-away)? Just release the mic.
        if (recSessionRef.current !== sessionRef.current) {
          stopStream();
          return;
        }
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        stopStream();
        mediaRef.current = null;
        await transcribe(blob, mySession);
      };
      mediaRef.current = rec;
      rec.start(250); // timeslice: chunks flow even if stop is ever missed
      if (rec.state !== "recording") throw new Error("recorder did not start");
      setPhase("recording");
      setSecsLeft(8);
      timerRef.current = window.setInterval(() => {
        setSecsLeft((s) => {
          if (s <= 1) {
            finishRecording();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      if (!alive()) return;
      sessionRef.current++;
      clearTimer();
      stopStream();
      mediaRef.current = null;
      setPhase("idle");
      setSttError(t.voice.micDenied);
    }
  };

  const finishRecording = () => {
    clearTimer();
    const rec = mediaRef.current;
    if (rec && rec.state === "recording") {
      setPhase("processing");
      try {
        rec.stop(); // onstop → transcribe
      } catch {
        sessionRef.current++;
        stopStream();
        mediaRef.current = null;
        setPhase("idle");
      }
    } else {
      setPhase("idle");
    }
  };

  /** Mic button: idle → start, recording → stop & send, otherwise cancel. */
  const toggleMic = () => {
    if (phase === "recording") {
      finishRecording();
    } else if (phase === "idle") {
      void startListening();
    } else {
      // announcing/processing: cancel everything, back to idle.
      sessionRef.current++;
      clearTimer();
      stopSpeaking();
      try {
        if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      } catch {
        /* guarded by session in onstop */
      }
      mediaRef.current = null;
      stopStream();
      setPhase("idle");
    }
  };

  const transcribe = async (blob: Blob, mySession: number) => {
    const alive = () => mySession === sessionRef.current;
    if (!alive()) return;
    setSttError(null);
    try {
      // Sarvam STT only promises wav/PCM — browsers record webm, so convert
      // on-device (16kHz mono WAV) before uploading. Falls back to the raw
      // blob if decoding fails.
      const { base64, mime } = await blobToWavBase64(blob).catch(async () => ({
        base64: await blobToBase64(blob),
        mime: blob.type || "audio/webm",
      }));
      const res = await fetch("/api/voice/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Names ("Sunita Patil" inside Marathi) need codemix so proper nouns
        // survive in Latin script; phone numbers need transcribe so spoken
        // digits normalize to 0-9 before our digit filter runs.
        body: JSON.stringify({
          audioBase64: base64,
          mime,
          language: lang,
          mode: numeric ? "transcribe" : "codemix",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("stt failed:", data?.error, data?.detail);
        throw new Error(data?.error || "stt failed");
      }
      if (data.transcript) {
        let text: string = data.transcript;
        if (numeric) text = text.replace(/\D/g, "").slice(0, maxLength ?? 10);
        else if (maxLength) text = text.slice(0, maxLength);
        if (!text) throw new Error("empty transcript after cleanup");
        if (!alive()) return;
        onChange(text);
        // Flash the field so the user sees the mic actually wrote something.
        setJustHeard(true);
        window.setTimeout(() => setJustHeard(false), 1800);
      } else {
        console.warn("stt empty transcript");
        throw new Error("empty transcript");
      }
    } catch (e) {
      if (!alive()) return;
      console.error("transcribe:", e instanceof Error ? e.message : e);
      setSttError(t.voice.sttFailed);
    } finally {
      if (alive()) setPhase("idle");
    }
  };

  const handleChange = (v: string) => {
    setSttError(null);
    setJustHeard(false);
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
          className={`h-12 w-full rounded-[14px] border-[2px] bg-white py-0 pl-4 pr-[92px] text-[15px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)] ${justHeard ? "border-green-600" : "border-[var(--black)]"}`}
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
            onClick={toggleMic}
            aria-label={phase === "idle" ? `${t.voice.speak} ${label}` : t.voice.stop}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[var(--black)] transition active:scale-90 ${
              phase === "recording" || phase === "announcing"
                ? "animate-pulse bg-[var(--red)] text-white"
                : "bg-[var(--black)] text-white"
            }`}
          >
            {phase === "processing" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : phase === "idle" ? (
              <IconMic className="h-4 w-4" />
            ) : (
              <IconStop className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {hint && phase !== "recording" && (
        <p className="mt-1 text-[11px] font-bold opacity-60">{hint}</p>
      )}
      {phase === "recording" && (
        <p className="mt-1 text-[11px] font-black text-[var(--red)]">
          {t.voice.stop} • {secsLeft}s
        </p>
      )}
      {phase === "announcing" && (
        <p className="mt-1 text-[11px] font-bold opacity-60">{t.listening}</p>
      )}
      {sttError && <p className="mt-1 text-[11px] font-bold text-[var(--red)]">{sttError}</p>}
    </div>
  );
}
