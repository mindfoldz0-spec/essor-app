import { useSyncExternalStore } from "react";
import type { Language } from "./translations";

export type { Language };
export type Role = "seller" | "buyer";
export type BusinessStage = "have_business" | "want_to_start";
export type PrimaryGoal = "credit" | "customers" | "skills" | null;
export type Category = "farmer" | "tailor" | "transporter" | "kirana" | "food" | "artisan" | "dairy" | "other" | null;

export function isRole(value: unknown): value is Role {
  return value === "seller" || value === "buyer";
}

export interface UserProfile {
  id?: string;
  device_id?: string;
  role: Role;
  preferred_language: Language;
  full_name: string;
  location_name: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  business_stage: BusinessStage | null;
  business_name: string | null;
  category: Category;
  what_you_sell: string[] | null;
  business_idea: Category;
  primary_goal: PrimaryGoal;
  is_woman_entrepreneur: boolean;
  phone: string | null;
  buyer_preferences: string[] | null;
  profile_picture: string | null;
  created_at?: string; updated_at?: string;
}

export interface OnboardingDraft {
  role: Role | null;
  preferred_language: Language;
  full_name: string;
  location_name: string | null; district: string | null; state: string | null; pincode: string | null;
  latitude: number | null; longitude: number | null;
  business_stage: BusinessStage | null;
  business_name: string;
  category: Category;
  what_you_sell: string[];
  business_idea: Category;
  is_dont_know: boolean;
  primary_goal: PrimaryGoal;
  is_woman_entrepreneur: boolean | null;
  phone: string;
  buyer_preferences: string[];
  profile_picture: string | null;
  step: number;
}

const DEVICE_KEY = "essor_device_id";
const DRAFT_KEY = "essor_onboarding_draft";

function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = (globalThis.crypto?.randomUUID?.() ?? `dev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (typeof window === "undefined") return null;
  const deviceId = getDeviceId();
  if (!deviceId) return null;
  // Neon storage via server API (no direct DB creds in browser)
  const res = await fetch(`/api/profile?device_id=${encodeURIComponent(deviceId)}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    console.error("getUserProfile", err);
    return null;
  }
  const json = (await res.json()) as { profile: UserProfile | null };
  return json.profile ?? null;
}

export async function saveUserProfile(p: UserProfile): Promise<UserProfile> {
  const deviceId = getDeviceId();
  if (!deviceId) throw new Error("No device id");
  const payload = {
    device_id: deviceId,
    role: p.role,
    preferred_language: p.preferred_language,
    full_name: p.full_name.trim(),
    location_name: p.location_name, district: p.district, state: p.state, pincode: p.pincode,
    latitude: p.latitude, longitude: p.longitude,
    business_stage: p.business_stage, business_name: p.business_name,
    category: p.category, what_you_sell: p.what_you_sell, business_idea: p.business_idea,
    primary_goal: p.primary_goal, is_woman_entrepreneur: p.is_woman_entrepreneur,
    phone: p.phone, buyer_preferences: p.buyer_preferences,
    profile_picture: p.profile_picture,
  };
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || "Failed to save profile (Neon)");
  }
  const json = (await res.json()) as { profile: UserProfile };
  const saved = json.profile;
  localStorage.removeItem(DRAFT_KEY);
  localStorage.setItem("essor_role", p.role);
  localStorage.setItem("essor_language", p.preferred_language);
  setSharedProfile(saved);
  window.dispatchEvent(new Event("essor:profile-updated"));
  window.dispatchEvent(new Event("essor:language-changed"));
  return saved;
}

export function getOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(DRAFT_KEY); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
}
export function saveOnboardingDraft(d: OnboardingDraft): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { console.error(e); }
}
export function clearOnboardingDraft(): void { if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY); }

/* ── Shared profile store ────────────────────────────────────────────────
 * One Neon API fetch for the whole app. Every useUserProfile() consumer
 * subscribes to the same cache instead of firing its own request.
 * undefined = still loading, null = no profile, UserProfile = ready.
 * ─────────────────────────────────────────────────────────────────────── */
type Listener = () => void;
let cache: UserProfile | null | undefined = undefined;
let inflight: Promise<void> | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function setSharedProfile(profile: UserProfile): void {
  cache = profile;
  notify();
}

export function refreshUserProfile(): void {
  if (typeof window === "undefined" || inflight) return;
  inflight = getUserProfile()
    .catch((e: unknown) => {
      console.error("getUserProfile", e);
      return null;
    })
    .then((profile) => {
      cache = profile;
      inflight = null;
      notify();
    });
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onChange = () => refreshUserProfile();
  if (typeof window !== "undefined") {
    if (cache === undefined && !inflight) refreshUserProfile();
    window.addEventListener("essor:profile-updated", onChange);
    window.addEventListener("storage", onChange);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("essor:profile-updated", onChange);
      window.removeEventListener("storage", onChange);
    }
  };
}

const getSnapshot = (): UserProfile | null | undefined => cache;
const getServerSnapshot = (): UserProfile | null | undefined => undefined;

export function useUserProfile(): UserProfile | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ── Stored role (localStorage fallback for the pre-fetch window) ────────
 * Exposed via useSyncExternalStore so SSR/hydration always start from null
 * and there is no setState-in-effect.
 * ─────────────────────────────────────────────────────────────────────── */
const ROLE_KEY = "essor_role";
let storedRoleCache: Role | null = null;
const roleListeners = new Set<Listener>();

function refreshStoredRole(): void {
  if (typeof window === "undefined") return;
  let next: Role | null = null;
  try {
    const raw = window.localStorage.getItem(ROLE_KEY);
    next = isRole(raw) ? raw : null;
  } catch {
    next = null;
  }
  if (next !== storedRoleCache) {
    storedRoleCache = next;
    roleListeners.forEach((listener) => listener());
  }
}

function subscribeStoredRole(listener: Listener): () => void {
  roleListeners.add(listener);
  refreshStoredRole();
  const onStorage = (e: StorageEvent) => { if (e.key === ROLE_KEY) refreshStoredRole(); };
  const onCustom = () => refreshStoredRole();
  window.addEventListener("storage", onStorage);
  window.addEventListener("essor:profile-updated", onCustom);
  return () => {
    roleListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("essor:profile-updated", onCustom);
  };
}

export function useStoredRole(): Role | null {
  return useSyncExternalStore(
    subscribeStoredRole,
    () => storedRoleCache,
    () => null,
  );
}
