"use client";

import { useCallback } from "react";
import type { VoiceCode } from "./voice-strings";
import { VOICE_KEYS } from "./voice-strings";
import { shortHash } from "./voice-key";

// ---------- IndexedDB audio cache ----------
const DB_NAME = "essor-voice-db";
const STORE = "tts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => resolve((rq.result as Blob) ?? null);
      rq.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, blob: Blob) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
  } catch {
    /* ignore */
  }
}

// Browsers block <audio> playback before the first tap, but device speech
// synthesis usually still talks — so a blocked file falls back to it
// (zero network, best chance of being heard on first landing).

/** Device TTS, awaitable: resolves when the utterance ends (or safety timeout). */
function browserSpeakAsync(text: string, lang: VoiceCode, myGen: number): Promise<void> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.95;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      // Safety: never hold the audio lock longer than the estimate.
      const estimate = Math.min(15000, Math.max(3000, text.length * 120));
      setTimeout(finish, estimate);
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }
      synth.speak(u);
      try {
        // Unstick Chrome's engine: a paused queue bursts out later as
        // overlapping "ghost" voices if never resumed.
        synth.resume();
      } catch {
        /* ignore */
      }
      // A newer clip took over while we queued — drop this one at once.
      if (myGen !== generation) {
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
        finish();
      }
    } catch {
      resolve();
    }
  });
}

let currentAudio: HTMLAudioElement | null = null;
// Spam-proofing: only one clip may play at a time. While a clip is playing,
// new speak requests are IGNORED (never restarted, never overlapped) unless
// they pass interrupt:true (step changes). finishCurrent resolves the
// in-flight play promise when stopSpeaking() cuts it off.
let isPlaying = false;
let generation = 0;
let finishCurrent: (() => void) | null = null;

class SpeechCancelled extends Error {}
class AutoplayBlocked extends Error {}

/** True while a clip is actually playing (or starting). */
export function isSpeaking(): boolean {
  return isPlaying;
}

export function stopSpeaking() {
  generation++;
  try {
    currentAudio?.pause();
    currentAudio = null;
    window.speechSynthesis?.cancel();
    // Unstick Chrome: without resume(), a cancelled queue can burst out
    // later as ghost audio overlapping the next clip.
    window.speechSynthesis?.resume();
  } catch {
    /* ignore */
  }
  finishCurrent?.();
  finishCurrent = null;
  isPlaying = false;
}

/** Play an <audio> element to completion. Resolves early if stopSpeaking() cuts it. */
function playToEnd(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    currentAudio = audio;
    finishCurrent = () => resolve();
    audio.onended = () => {
      finishCurrent = null;
      resolve();
    };
    audio.onerror = () => {
      finishCurrent = null;
      resolve();
    };
  });
}

async function startAudio(url: string, myGen: number): Promise<void> {
  const audio = new Audio(url);
  const done = playToEnd(audio);
  try {
    await audio.play();
  } catch (e) {
    finishCurrent?.();
    finishCurrent = null;
    // Browsers block audio before the first user tap — stay silent instead
    // of cascading into TTS fetches that would also be blocked.
    if (e instanceof DOMException && e.name === "NotAllowedError") throw new AutoplayBlocked();
    throw e instanceof Error ? e : new Error(String(e));
  }
  if (myGen !== generation) throw new SpeechCancelled();
  await done;
}

/** Play a pre-baked clip from public/voices to completion.
 * No HEAD check — just play; a 404 rejects play() and counts as missing.
 * Throws SpeechCancelled if a newer clip took over, AutoplayBlocked if the
 * browser refused playback (pre-tap landing). */
async function playLocalFile(voiceKey: string, lang: VoiceCode, myGen: number): Promise<boolean> {
  if (!VOICE_KEYS.includes(voiceKey as (typeof VOICE_KEYS)[number])) return false;
  const url = `/voices/${lang}/${voiceKey}.wav`;
  try {
    if (myGen !== generation) throw new SpeechCancelled();
    await startAudio(url, myGen);
    return true;
  } catch (e) {
    if (e instanceof SpeechCancelled || e instanceof AutoplayBlocked) throw e;
    return false;
  }
}

/** Warm the browser cache for a language so every tap plays instantly. */
export function preloadVoices(lang: VoiceCode) {
  try {
    VOICE_KEYS.forEach((k) => {
      const a = new Audio(`/voices/${lang}/${k}.wav`);
      a.preload = "auto";
      try {
        a.load();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

/** Fetch (cached) Sarvam TTS audio and play it to completion. Falls back to browser TTS.
 * Order: pre-baked file -> IndexedDB -> /api/voice/tts -> speechSynthesis.
 * The file is ALWAYS tried first — even pre-tap (sometimes allowed) — and a
 * blocked file skips the network chain straight to device speech.
 *
 * Spam-proof: if a clip is already playing, the new request is IGNORED so the
 * current one always completes — no restarts, no overlapping audio, no matter
 * how fast the user taps. Pass { interrupt: true } only for step changes and
 * explicit taps, where the new prompt must cut off the old one (with a short
 * settle so the killed output can't tail over the new clip). Resolves when
 * the clip ends (or is stopped), so callers can track playing state. */
export async function speakText(
  text: string,
  lang: VoiceCode,
  opts?: { cacheKey?: string; interrupt?: boolean }
): Promise<void> {
  if (isPlaying && !opts?.interrupt) return;
  stopSpeaking();
  const myGen = ++generation;
  isPlaying = true;
  const alive = () => {
    if (myGen !== generation) throw new SpeechCancelled();
  };
  const release = () => {
    if (myGen === generation) isPlaying = false;
  };
  try {
    if (opts?.interrupt) {
      // Let the killed output fully die (esp. speech-synthesis tails)
      // before starting the new clip — otherwise they overlap briefly.
      await new Promise((r) => setTimeout(r, 120));
      alive();
    }
    // 0. Pre-baked clip — instant, no network API, no delay.
    // cacheKey format is "<voiceKey>:<lang>", e.g. "page_role:hi-IN".
    let blocked = false;
    if (opts?.cacheKey) {
      const sep = opts.cacheKey.lastIndexOf(":");
      if (sep > 0) {
        const vk = opts.cacheKey.slice(0, sep);
        const lg = opts.cacheKey.slice(sep + 1) as VoiceCode;
        if (lg === lang) {
          try {
            if (await playLocalFile(vk, lg, myGen)) return;
          } catch (e) {
            if (e instanceof SpeechCancelled) throw e;
            // Blocked (pre-tap): a Sarvam fetch would be blocked too —
            // skip the network and talk with device speech instead.
            if (e instanceof AutoplayBlocked) blocked = true;
          }
        }
      }
    }
    if (blocked) {
      try {
        await browserSpeakAsync(text, lang, myGen);
      } finally {
        release();
      }
      return;
    }
    alive();
    const key = `tts:${lang}:${opts?.cacheKey ?? text}:${versionOf(text)}`;
    // 1. IndexedDB hit
    const cached = typeof indexedDB !== "undefined" ? await idbGet(key) : null;
    alive();
    if (cached) {
      const url = URL.createObjectURL(cached);
      try {
        await startAudio(url, myGen);
      } finally {
        URL.revokeObjectURL(url);
      }
      return;
    }
    // 2. Server TTS (Sarvam bulbul:v3)
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      });
      alive();
      if (!res.ok) throw new Error("tts failed");
      const blob = await res.blob();
      alive();
      if (blob.size > 1000) {
        await idbSet(key, blob);
        alive();
        const url = URL.createObjectURL(blob);
        try {
          await startAudio(url, myGen);
        } finally {
          URL.revokeObjectURL(url);
        }
        return;
      }
      throw new Error("empty audio");
    } catch (e) {
      if (e instanceof SpeechCancelled || e instanceof AutoplayBlocked) throw e;
      await browserSpeakAsync(text, lang, myGen);
    }
  } catch (e) {
    // Cancelled: stay silent. Anything else already fell back to device
    // TTS above — one last awaited attempt so outputs never overlap.
    if (e instanceof SpeechCancelled) return;
    try {
      await browserSpeakAsync(text, lang, myGen);
    } catch {
      /* ignore */
    }
  } finally {
    if (myGen === generation) isPlaying = false;
  }
}

function versionOf(text: string): string {
  // Content version follows the exact text: edited wording = new device-
  // cache key, so no stale audio can ever play.
  return shortHash(text);
}

export function useVoice(lang: VoiceCode) {
  const speak = useCallback(
    (text: string, cacheKey?: string, opts?: { interrupt?: boolean }) =>
      speakText(text, lang, { cacheKey, interrupt: opts?.interrupt }),
    [lang]
  );

  return { speak, stop: stopSpeaking };
}
