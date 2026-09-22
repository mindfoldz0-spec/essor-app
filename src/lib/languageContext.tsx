"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { isLanguage, Language, TranslationStrings, translations } from "./translations";
import { useUserProfile } from "./userProfile";

const LANGUAGE_KEY = "essor_language";
const CHANGE_EVENT = "essor:language-changed";

interface CtxType { language: Language; setLanguage: (l: Language) => void; t: TranslationStrings; }

/* Shared external store: SSR and hydration always render "hindi" (the default
 * for new users), then the client swaps to the stored language right after
 * hydration. This avoids both hydration mismatches and setState-in-effect. */
let snapshot: Language = "hindi";
const listeners = new Set<() => void>();

const HTML_LANG: Record<Language, string> = { english: "en", hindi: "hi", marathi: "mr" };

function applySnapshot(next: Language): void {
  if (next !== snapshot) {
    snapshot = next;
    try {
      document.documentElement.lang = HTML_LANG[next] ?? "hi";
    } catch {
      /* ignore */
    }
    listeners.forEach((listener) => listener());
  }
}

function refreshFromStorage(): void {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  const next = isLanguage(stored) ? stored : "hindi";
  try {
    document.documentElement.lang = HTML_LANG[next] ?? "hi";
  } catch {
    /* ignore */
  }
  applySnapshot(next);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  refreshFromStorage();
  const onStorage = (e: StorageEvent) => { if (e.key === LANGUAGE_KEY) refreshFromStorage(); };
  const onCustom = () => refreshFromStorage();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => "hindi" as Language;

const Ctx = createContext<CtxType>({ language: "hindi", setLanguage: () => {}, t: translations.hindi });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const profile = useUserProfile();

  // Seed the stored language from the saved profile when nothing is stored yet
  // (writes to the external system only — no state update in the effect body).
  useEffect(() => {
    if (!profile?.preferred_language) return;
    if (!window.localStorage.getItem(LANGUAGE_KEY)) {
      window.localStorage.setItem(LANGUAGE_KEY, profile.preferred_language);
      refreshFromStorage();
    }
  }, [profile?.preferred_language]);

  const setLanguage = useCallback((l: Language) => {
    window.localStorage.setItem(LANGUAGE_KEY, l);
    refreshFromStorage();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const t = useMemo(() => translations[language] ?? translations.hindi, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useLanguage() { return useContext(Ctx); }
