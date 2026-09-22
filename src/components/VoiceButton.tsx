"use client";

import { useState } from "react";
import { speakText, stopSpeaking, isSpeaking } from "@/lib/voice";
import type { VoiceCode } from "@/lib/voice-strings";
import { IconSpeaker, IconStop } from "@/components/icons";

interface Props {
  text: string;
  lang: VoiceCode;
  /** Pre-baked clip key, e.g. "page_role" — enables instant file playback. */
  voiceKey?: string;
  label?: string;
  className?: string;
}

/** Round speaker button — plays the pre-baked clip instantly, else Sarvam, else device TTS. */
export default function VoiceButton({ text, lang, voiceKey, label, className }: Props) {
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    // Spam-proof: tapping while playing only stops — it never restarts
    // or overlaps. A fresh tap after it ends plays again.
    if (isSpeaking() || playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      await speakText(text, lang, voiceKey ? { cacheKey: `${voiceKey}:${lang}` } : undefined);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label ?? "Listen"}
      title={label ?? "Listen"}
      className={
        className ??
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-white hover:bg-[var(--gray-100)] active:scale-90"
      }
    >
      {playing ? <IconStop className="h-5 w-5" /> : <IconSpeaker className="h-5 w-5" />}
    </button>
  );
}
