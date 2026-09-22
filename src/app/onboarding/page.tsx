"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isLanguage, Language, sellLabel } from "@/lib/translations";
import { useLanguage } from "@/lib/languageContext";
import { UserProfile, saveUserProfile, getOnboardingDraft, saveOnboardingDraft, OnboardingDraft, Category, PrimaryGoal, isRole } from "@/lib/userProfile";
import ProgressHeader from "@/components/onboarding/ProgressHeader";
import VoiceButton from "@/components/VoiceButton";
import VoiceField from "@/components/VoiceField";
import GreetingVideo from "@/components/GreetingVideo";
import { useVoice, stopSpeaking, preloadVoices } from "@/lib/voice";
import { voiceCode, getVoiceText, type VoiceKey, type VoiceCode } from "@/lib/voice-strings";
import {
  IconStore, IconCart, IconPin, IconCheck, IconAlert, IconCamera,
  IconRocket, IconBulb,
  IconFarmer, IconTailor, IconTruck, IconKirana,
  IconFood, IconArtisan, IconDairy, IconOther,
} from "@/components/icons";
import type { ComponentType } from "react";

const CATEGORY_OPTIONS: { id: Category; Icon: ComponentType<{ className?: string }> }[] = [
  { id: "farmer", Icon: IconFarmer }, { id: "tailor", Icon: IconTailor }, { id: "transporter", Icon: IconTruck },
  { id: "kirana", Icon: IconKirana }, { id: "food", Icon: IconFood }, { id: "artisan", Icon: IconArtisan },
  { id: "dairy", Icon: IconDairy }, { id: "other", Icon: IconOther },
];

const WHAT_SELL_MAP: Record<string, string[]> = {
  farmer: ["Wheat", "Onion", "Cotton", "Soybean", "Sugarcane"],
  tailor: ["Blouse", "Uniform", "Alteration", "Saree Fall"],
  transporter: ["Tempo", "Tractor", "Goods Auto", "Mini Truck"],
  kirana: ["Rice", "Oil", "Sugar", "Daily Goods"],
  food: ["Pickle", "Papad", "Spice", "Chips"],
  artisan: ["Pottery", "Bamboo", "Handloom"],
  dairy: ["Milk", "Curd", "Ghee", "Paneer"],
  other: ["Other"],
};

const BUYER_PREFS = ["groceries", "clothes", "farm_produce", "food"];

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const hasHydrated = useRef(false);

  const [role, setRole] = useState<"seller"|"buyer"|null>(null);
  const [language, setLanguage] = useState<Language>("hindi");
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");

  const [locationName, setLocationName] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [stateName, setStateName] = useState<string | null>(null);
  const [pincode, setPincode] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const abortRef = useRef<AbortController|null>(null);

  const [businessStage, setBusinessStage] = useState<"have_business"|"want_to_start"|null>(null);
  const [category, setCategory] = useState<Category>(null);
  const [businessName, setBusinessName] = useState("");
  const [whatSell, setWhatSell] = useState<string[]>([]);
  const [businessIdea, setBusinessIdea] = useState<Category>(null);
  const [isDontKnow, setIsDontKnow] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(null);
  const [isWoman, setIsWoman] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [buyerPrefs, setBuyerPrefs] = useState<string[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = getOnboardingDraft();
      if (draft) {
        if (isRole(draft.role)) setRole(draft.role);
        if (isLanguage(draft.preferred_language)) setLanguage(draft.preferred_language);
        if (draft.full_name) setFullName(draft.full_name);
        if (draft.location_name) setLocationName(draft.location_name);
        if (draft.district) setDistrict(draft.district);
        if (draft.state) setStateName(draft.state);
        if (draft.pincode) setPincode(draft.pincode);
        if (draft.latitude) setLat(draft.latitude);
        if (draft.longitude) setLon(draft.longitude);
        if (draft.business_stage) setBusinessStage(draft.business_stage);
        if (draft.category) setCategory(draft.category);
        if (draft.business_name) setBusinessName(draft.business_name);
        if (draft.what_you_sell) setWhatSell(draft.what_you_sell);
        if (draft.business_idea) setBusinessIdea(draft.business_idea);
        if (draft.is_dont_know) setIsDontKnow(draft.is_dont_know);
        if (draft.primary_goal) setPrimaryGoal(draft.primary_goal);
        if (draft.is_woman_entrepreneur !== null) setIsWoman(draft.is_woman_entrepreneur);
        if (draft.phone) setPhone(draft.phone);
        if (draft.buyer_preferences) setBuyerPrefs(draft.buyer_preferences);
        if (draft.profile_picture) setProfilePic(draft.profile_picture);
        if (draft.step) setStep(draft.step);
        if (isLanguage(draft.preferred_language)) localStorage.setItem("essor_language", draft.preferred_language);
        if (isRole(draft.role)) localStorage.setItem("essor_role", draft.role);
      } else {
        const storedLang = localStorage.getItem("essor_language");
        if (isLanguage(storedLang)) setLanguage(storedLang);
        const storedRole = localStorage.getItem("essor_role");
        if (isRole(storedRole)) setRole(storedRole);
      }
      setMounted(true);
      hasHydrated.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Debounced draft persistence — avoids stringifying (incl. base64 photos)
  // on every keystroke while keeping crash recovery.
  useEffect(() => {
    if (!hasHydrated.current) return;
    const timer = window.setTimeout(() => {
      const draft: OnboardingDraft = {
        role, preferred_language: language, full_name: fullName,
        location_name: locationName, district, state: stateName, pincode, latitude: lat, longitude: lon,
        business_stage: businessStage, category, business_name: businessName, what_you_sell: whatSell,
        business_idea: businessIdea, is_dont_know: isDontKnow, primary_goal: primaryGoal,
        is_woman_entrepreneur: isWoman, phone, buyer_preferences: buyerPrefs, profile_picture: profilePic, step,
      };
      saveOnboardingDraft(draft);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [role, language, fullName, locationName, district, stateName, pincode, lat, lon, businessStage, category, businessName, whatSell, businessIdea, isDontKnow, primaryGoal, isWoman, phone, buyerPrefs, profilePic, step]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const tr = t.onboarding;
  const catLabel = (id: string) => t.categories[id] || id;

  // ── Voice (Sarvam pre-baked clips in public/voices) ──────────────
  // One speaker per page (page instruction) + each input speaks its OWN
  // relevant hint — never the same text twice.
  const vc = voiceCode(language);
  const { speak } = useVoice(vc);
  const isSeller = role === "seller";

  const stepVoice = (): { key: VoiceKey; code: VoiceCode } | null => {
    // Step 1 stays Hindi-only: we don't know the user's language yet.
    if (step === 1) return { key: "page_language", code: "hi-IN" };
    if (step === 2) return { key: "page_role", code: vc };
    if (step === 3) return { key: "page_name", code: vc };
    if (!isSeller) {
      if (step === 4) return { key: "f_contact", code: vc };
      return null;
    }
    if (step === 4) return { key: "page_location", code: vc };
    if (step === 5) return { key: "f_stage", code: vc };
    if (step === 6) return { key: "f_business", code: vc };
    if (step === 7) return { key: "f_goal", code: vc };
    return null;
  };
  const cur = stepVoice();
  const curText = cur ? getVoiceText(cur.key, cur.code) : "";

  // Auto-speak each step (voice-first for low-literacy users).
  // interrupt:true — a new step cuts off the old prompt; everywhere else
  // (input taps) the current clip always plays to completion.
  // Note: language is intentionally NOT a dep — tapping a language on
  // step 1 speaks explicitly in the tap handler; re-running here would
  // cut that clip off mid-way.
  useEffect(() => {
    if (!mounted || !cur) return;
    const timer = window.setTimeout(() => {
      if (!cur) return;
      speak(getVoiceText(cur.key, cur.code), `${cur.key}:${cur.code}`, { interrupt: true });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, step]);

  // Stop audio when leaving the flow
  useEffect(() => () => stopSpeaking(), []);
  const total = isSeller ? 7 : 4;

  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setIsLocating(false);
      setLocationError(tr.error);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      setLat(latitude); setLon(longitude);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`, {
          signal: ctrl.signal,
          headers: { "Accept-Language": language === "marathi" ? "mr,en" : language === "hindi" ? "hi,en" : "en", "Accept": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const town = addr.city || addr.town || addr.village || addr.suburb || addr.county || "Area";
          const st = addr.state || "Maharashtra";
          const pin = addr.postcode || null;
          const dist = addr.state_district || addr.county || town;
          const fmt = st ? `${town}, ${st}` : town;
          setLocationName(fmt);
          setDistrict(dist);
          setStateName(st);
          setPincode(pin);
        } else {
          setLocationName(`${latitude.toFixed(3)}° N, ${longitude.toFixed(3)}° E`);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setLocationName(`${latitude.toFixed(3)}° N, ${longitude.toFixed(3)}° E`);
      } finally { setIsLocating(false); abortRef.current = null; }
    }, (err) => {
      setIsLocating(false); abortRef.current = null;
      if (err.code === err.PERMISSION_DENIED) setLocationError(tr.denied);
      else setLocationError(tr.error);
    }, { timeout: 15000, enableHighAccuracy: true });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setErrorMsg(tr.errors.photoType); e.target.value=""; return; }
    if (file.size > 2 * 1024 * 1024) { setErrorMsg(tr.errors.photoSize); e.target.value=""; return; }
    const r = new FileReader();
    r.onloadend = () => {
      const res = r.result as string;
      if (!res.startsWith("data:image/") || res.includes("image/svg")) { setErrorMsg(tr.errors.photoInvalid); return; }
      setProfilePic(res); setErrorMsg(null);
    };
    r.onerror = () => setErrorMsg(tr.errors.photoRead);
    r.readAsDataURL(file);
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      localStorage.setItem("essor_language", language);
      window.dispatchEvent(new Event("essor:language-changed"));
      preloadVoices(voiceCode(language));
      setStep(2); return;
    }
    if (step === 2) {
      if (!role) { setErrorMsg(tr.roleHelper); return; }
      localStorage.setItem("essor_language", language);
      localStorage.setItem("essor_role", role);
      window.dispatchEvent(new Event("essor:language-changed"));
      setStep(3); return;
    }
    if (step === 3) {
      if (!fullName.trim()) { setErrorMsg(tr.nameError); return; }
      if (isSeller) { setStep(4); }
      else {
        if (!locationName) { setErrorMsg(tr.denied); return; }
        setStep(4);
      }
      return;
    }
    if (isSeller) {
      if (step === 4) {
        if (!locationName) { setErrorMsg(tr.denied); return; }
        setStep(5); return;
      }
      if (step === 5) {
        if (!businessStage) { setErrorMsg(tr.errors.chooseOption); return; }
        setStep(6); return;
      }
      if (step === 6) {
        if (businessStage === "have_business") {
          if (!category) { setErrorMsg(tr.errors.pickWork); return; }
          if (!businessName.trim()) { setErrorMsg(tr.errors.enterBusinessName); return; }
          if (whatSell.length === 0) { setErrorMsg(tr.errors.pickWhatSell); return; }
        } else {
          if (!isDontKnow && !businessIdea) { setErrorMsg(tr.errors.pickIdea); return; }
        }
        setStep(7); return;
      }
      if (step === 7) {
        if (!primaryGoal) { setErrorMsg(tr.errors.pickGoal); return; }
        if (isWoman === null) { setErrorMsg(tr.errors.chooseYesNo); return; }
        if (phone && !/^\d{10}$/.test(phone)) { setErrorMsg(tr.errors.phoneDigits); return; }
        setStep(8); return;
      }
    } else {
      if (step === 4) {
        if (phone && !/^\d{10}$/.test(phone)) { setErrorMsg(tr.errors.phoneDigits); return; }
        setStep(5); return;
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (isSaving) return;
    stopSpeaking();
    setIsSaving(true); setErrorMsg(null);
    try {
      const profile: UserProfile = {
        role: role as "seller"|"buyer",
        preferred_language: language,
        full_name: fullName.trim(),
        location_name: locationName, district, state: stateName || "Maharashtra", pincode,
        latitude: lat, longitude: lon,
        business_stage: isSeller ? businessStage : null,
        business_name: isSeller && businessStage === "have_business" ? businessName.trim() : null,
        category: isSeller && businessStage === "have_business" ? category : isSeller && businessStage === "want_to_start" && !isDontKnow ? businessIdea : null,
        what_you_sell: isSeller && businessStage === "have_business" ? whatSell : null,
        business_idea: isSeller && businessStage === "want_to_start" && !isDontKnow ? businessIdea : null,
        primary_goal: isSeller ? primaryGoal : null,
        is_woman_entrepreneur: isSeller ? !!isWoman : false,
        phone: phone || null,
        buyer_preferences: !isSeller ? buyerPrefs : null,
        profile_picture: isSeller ? profilePic : null,
      };
      await saveUserProfile(profile);
      router.push("/");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : tr.errors.saveFailed);
    } finally { setIsSaving(false); }
  };

  if (!mounted) return <div className="p-6"><div className="h-6 w-32 animate-pulse rounded bg-[var(--gray-200)]" /></div>;

  return (
    <div className="relative min-h-[calc(100vh-140px)] w-full px-4 py-6">
      <div className="relative z-10">
        {step < (isSeller ? 8 : 5) && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1">
              <ProgressHeader step={step} total={total} label={t.stepIndicator(step, total)} showBack={step>1} onBack={handleBack} />
            </div>
            {cur && <VoiceButton text={curText} lang={cur.code} voiceKey={cur.key} label={t.listen} />}
          </div>
        )}

        {errorMsg && <div className="mb-4 rounded-[14px] border-[2px] border-[var(--red)] bg-white p-3 text-[13px] font-bold text-[var(--red)]"><IconAlert className="mr-1 inline-block h-4 w-4 align-[-2px]" /> {errorMsg}</div>}

        {/* STEP 1 — LANGUAGE ONLY */}
        {step === 1 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[24px] font-black leading-tight">{tr.chooseLanguageTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.chooseLanguageHelper}</p>
            <div className="mt-6 grid grid-cols-1 gap-3">
              {[
                { id: "english", label: "English", sub: "English" },
                { id: "marathi", label: "मराठी", sub: "Marathi" },
                { id: "hindi", label: "हिंदी", sub: "Hindi" },
              ].map((it) => (
                <button key={it.id} type="button" onClick={() => {
                    const next = it.id as Language;
                    setLanguage(next);
                    localStorage.setItem("essor_language", it.id);
                    window.dispatchEvent(new Event("essor:language-changed"));
                    // Confirm IN the chosen language: "you have chosen Hindi…"
                    const code = voiceCode(next);
                    speak(getVoiceText("lang_picked", code), `lang_picked:${code}`, { interrupt: true });
                  }}
                  className={`flex w-full items-center justify-between rounded-[18px] border-[2px] border-[var(--black)] p-4 text-left font-black ${language===it.id ? "bg-[var(--red)] text-white" : "bg-[var(--white)] hover:bg-[var(--gray-100)]"}`}>
                  <div><div className="text-[18px]">{it.label}</div><div className={`text-[12px] font-bold opacity-70 ${language===it.id?"text-white":""}`}>{it.sub}</div></div>
                  {language===it.id && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--red)]"><IconCheck className="h-4 w-4" /></span>}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleNext} className="mt-8 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-[16px] font-black text-white hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {/* STEP 2 — ROLE */}
        {step === 2 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[24px] font-black leading-tight">{t.role.title}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{t.role.subtitle}</p>
            <p className="mt-1 text-[12px] font-bold opacity-40">{tr.roleHelper}</p>
            <div className="mt-6 grid grid-cols-1 gap-3">
              <button type="button" onClick={()=>{
                  setRole("seller");
                  const code = voiceCode(language);
                  speak(getVoiceText("role_picked_seller", code), `role_picked_seller:${code}`, { interrupt: true });
                }}
                className={`rounded-[18px] border-[2px] border-[var(--black)] p-4 text-left ${role==="seller"?"bg-[var(--black)] text-white":"bg-[var(--white)] hover:bg-[var(--gray-100)]"}`}>
                <div className="flex items-center gap-2 text-[16px] font-black"><IconStore className="h-6 w-6 shrink-0" /> {t.role.seller}</div><div className="text-[12px] font-bold opacity-70">{t.role.sellerSub}</div>
              </button>
              <button type="button" onClick={()=>{
                  setRole("buyer");
                  const code = voiceCode(language);
                  speak(getVoiceText("role_picked_buyer", code), `role_picked_buyer:${code}`, { interrupt: true });
                }}
                className={`rounded-[18px] border-[2px] border-[var(--black)] p-4 text-left ${role==="buyer"?"bg-[var(--black)] text-white":"bg-[var(--white)] hover:bg-[var(--gray-100)]"}`}>
                <div className="flex items-center gap-2 text-[16px] font-black"><IconCart className="h-6 w-6 shrink-0" /> {t.role.buyer}</div><div className="text-[12px] font-bold opacity-70">{t.role.buyerSub}</div>
              </button>
            </div>
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-[16px] font-black text-white hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {/* STEP 3 — NAME (seller) or NAME+LOCATION (buyer) */}
        {step === 3 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[24px] font-black">{tr.nameTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.nameHelper}</p>
            <div className="mt-4">
              <VoiceField
                label={tr.nameTitle}
                prompt={getVoiceText("f_name_hint", vc)}
                value={fullName}
                onChange={setFullName}
                lang={vc}
                voiceKey="f_name_hint"
                maxLength={60}
                placeholder={tr.namePlaceholder}
                hint={tr.nameFocus}
              />
            </div>

            {!isSeller && (
              <div className="mt-6 border-t-[2px] border-[var(--black)] pt-5">
                <h2 className="text-[18px] font-black">{tr.locationTitle}</h2>
                <p className="text-[12px] font-bold opacity-60">{tr.locationHelper}</p>
                <button type="button" onClick={handleDetectLocation} disabled={isLocating}
                  className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] px-4 text-[16px] font-black hover:bg-[var(--gray-100)] disabled:opacity-50">
                  {isLocating ? tr.locating : (<span className="inline-flex items-center gap-2"><IconPin className="h-5 w-5" />{tr.locationButton}</span>)}
                </button>
                {locationName && !locationError && (
                  <div className="mt-3 rounded-[14px] border-[2px] border-[var(--black)] bg-[var(--gray-100)] p-3">
                    <div className="text-[11px] font-black tracking-widest text-[var(--red)]"><IconCheck className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" /> {tr.detected}</div>
                    <div className="text-[14px] font-black">{locationName}{pincode?` — ${pincode}`:""}</div>
                    <button type="button" onClick={handleDetectLocation} className="mt-1 text-[11px] font-black underline">{tr.wrong}</button>
                  </div>
                )}
                {locationError && <div className="mt-3 rounded-[14px] border-[2px] border-[var(--red)] bg-white p-3 text-[13px] font-bold text-[var(--red)]">{locationError} <button type="button" onClick={handleDetectLocation} className="ml-2 underline">{tr.retry}</button></div>}
              </div>
            )}

            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {/* SELLER STEPS 4-7 */}
        {isSeller && step === 4 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[24px] font-black">{tr.locationTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.locationHelper}</p>
            <button type="button" onClick={handleDetectLocation} disabled={isLocating}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] px-4 text-[16px] font-black hover:bg-[var(--gray-100)] disabled:opacity-50">
              {isLocating ? tr.locating : (<span className="inline-flex items-center gap-2"><IconPin className="h-5 w-5" />{tr.locationButton}</span>)}
            </button>
            {locationName && !locationError && (
              <div className="mt-4 rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--gray-100)] p-4">
                <div className="text-[12px] font-black text-[var(--red)]"><IconCheck className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" /> {tr.detected}</div>
                <div className="mt-1 text-[18px] font-black">{locationName}{pincode?` — ${pincode}`:""}</div>
                <button type="button" onClick={handleDetectLocation} className="mt-2 text-[11px] font-black underline">{tr.wrong}</button>
              </div>
            )}
            {locationError && <div className="mt-4 rounded-[14px] border-[2px] border-[var(--red)] bg-white p-3 text-[13px] font-bold text-[var(--red)]">{locationError} <button type="button" onClick={handleDetectLocation} className="ml-2 underline">{tr.retry}</button></div>}
            <p className="mt-3 text-[11px] font-bold opacity-50">{tr.errors.locationRequired}</p>
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)] disabled:opacity-40" disabled={!locationName}>{t.continue} →</button>
          </section>
        )}

        {isSeller && step === 5 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[24px] font-black">{tr.stageTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.stageHelper}</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={()=>setBusinessStage("have_business")} className={`flex w-full items-center justify-between rounded-[18px] border-[2px] border-[var(--black)] p-4 text-left font-black ${businessStage==="have_business"?"bg-[var(--black)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>
                <span className="inline-flex items-center gap-2"><IconStore className="h-6 w-6 shrink-0" /> {tr.have}</span>{businessStage==="have_business"&&<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--red)] text-white"><IconCheck className="h-3.5 w-3.5" /></span>}
              </button>
              <button type="button" onClick={()=>setBusinessStage("want_to_start")} className={`flex w-full items-center justify-between rounded-[18px] border-[2px] border-[var(--black)] p-4 text-left font-black ${businessStage==="want_to_start"?"bg-[var(--black)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>
                <span className="inline-flex items-center gap-2"><IconRocket className="h-6 w-6 shrink-0" /> {tr.want}</span>{businessStage==="want_to_start"&&<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--red)] text-white"><IconCheck className="h-3.5 w-3.5" /></span>}
              </button>
            </div>
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {isSeller && step === 6 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            {businessStage==="have_business" ? (
              <>
                <h1 className="text-[24px] font-black">{tr.haveTitle}</h1>
                <p className="mt-1 text-[13px] font-bold opacity-60">{tr.haveHelper}</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <label className="block text-[13px] font-black mb-1">{tr.categoryLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORY_OPTIONS.map(({ id, Icon }) => {
                        const active = category === id;
                        return (
                          <button key={id} type="button" onClick={() => { setCategory(id); setWhatSell([]); }}
                            className={`flex items-center gap-2 rounded-[14px] border-[2px] border-[var(--black)] p-3 text-left text-[13px] font-black ${active ? "bg-[var(--black)] text-white" : "bg-white hover:bg-[var(--gray-100)]"}`}>
                            <Icon className="h-6 w-6 shrink-0" />
                            <span>{catLabel(id!)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] font-bold opacity-60">{tr.categoryFocus}</p>
                  </div>
                  <div>
                    <VoiceField
                      label={tr.businessNameLabel}
                      prompt={getVoiceText("f_bizname_hint", vc)}
                      value={businessName}
                      onChange={setBusinessName}
                      lang={vc}
                      voiceKey="f_bizname_hint"
                      maxLength={60}
                      placeholder={tr.businessNamePlaceholder}
                      hint={tr.businessNameFocus}
                    />
                  </div>
                  {category && (
                    <div>
                      <label className="block text-[13px] font-black mb-1">{tr.whatSellLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {(WHAT_SELL_MAP[category]||[]).map((item)=> {
                          const active = whatSell.includes(item);
                          return <button key={item} type="button" onClick={()=> setWhatSell(active? whatSell.filter(w=>w!==item) : [...whatSell, item])} className={`rounded-full border-[1.5px] border-[var(--black)] px-3 py-1.5 text-[12px] font-black ${active?"bg-[var(--red)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>{sellLabel(item, language)}</button>
                        })}
                      </div>
                      <p className="mt-1 text-[11px] font-bold opacity-60">{tr.whatSellFocus}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-[24px] font-black">{tr.wantTitle}</h1>
                <p className="mt-1 text-[13px] font-bold opacity-60">{tr.wantHelper}</p>
                <div className="mt-5">
                  <label className="block text-[13px] font-black mb-1">{tr.ideaLabel}</label>
                  <div className={`grid grid-cols-2 gap-2 ${isDontKnow ? "opacity-40" : ""}`}>
                    {CATEGORY_OPTIONS.map(({ id, Icon }) => {
                      const active = businessIdea === id;
                      return (
                        <button key={id} type="button" disabled={isDontKnow} onClick={() => setBusinessIdea(id)}
                          className={`flex items-center gap-2 rounded-[14px] border-[2px] border-[var(--black)] p-3 text-left text-[13px] font-black ${active ? "bg-[var(--black)] text-white" : "bg-white hover:bg-[var(--gray-100)]"}`}>
                          <Icon className="h-6 w-6 shrink-0" />
                          <span>{catLabel(id!)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[11px] font-bold opacity-60">{tr.ideaFocus}</p>
                  <button type="button" onClick={()=>{ setIsDontKnow(!isDontKnow); if(!isDontKnow) setBusinessIdea(null); }} className={`mt-3 flex w-full items-center justify-between rounded-[14px] border-[2px] border-[var(--black)] p-3 text-left font-black ${isDontKnow?"bg-[var(--red)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>
                    <span className="inline-flex items-center gap-2"><IconBulb className="h-5 w-5 shrink-0" /> {tr.dontKnow}</span>{isDontKnow&&<span><IconCheck className="h-4 w-4" /></span>}
                  </button>
                </div>
              </>
            )}
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {isSeller && step === 7 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[20px] font-black">{tr.goalTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.goalHelper}</p>
            <div className="mt-4 space-y-2">
              {[{id:"credit", label: tr.goalCredit},{id:"customers", label: tr.goalCustomers},{id:"skills", label: tr.goalSkills}].map(o=>(
                <button key={o.id} type="button" onClick={()=>setPrimaryGoal(o.id as PrimaryGoal)} className={`flex w-full items-center justify-between rounded-[14px] border-[2px] border-[var(--black)] p-3 text-left font-black ${primaryGoal===o.id?"bg-[var(--black)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>
                  <span>{o.label}</span>{primaryGoal===o.id&&<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--red)] text-white"><IconCheck className="h-3.5 w-3.5" /></span>}
                </button>
              ))}
            </div>
            <div className="mt-6 border-t-[2px] border-[var(--black)] pt-4">
              <h2 className="text-[14px] font-black">{tr.womanTitle}</h2>
              <p className="text-[11px] font-bold opacity-60">{tr.womanHelper}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" onClick={()=>setIsWoman(true)} className={`h-14 rounded-[14px] border-[2px] border-[var(--black)] font-black ${isWoman===true?"bg-[var(--red)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>{tr.yes}</button>
                <button type="button" onClick={()=>setIsWoman(false)} className={`h-14 rounded-[14px] border-[2px] border-[var(--black)] font-black ${isWoman===false?"bg-[var(--black)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>{tr.no}</button>
              </div>
            </div>
            <div className="mt-6">
              <VoiceField
                label={tr.phoneTitle}
                prompt={getVoiceText("f_phone_hint", vc)}
                value={phone}
                onChange={setPhone}
                lang={vc}
                voiceKey="f_phone_hint"
                inputMode="numeric"
                maxLength={10}
                numeric
                placeholder={tr.phonePlaceholder}
                hint={tr.phoneFocus}
              />
            </div>
            <div className="mt-5 flex flex-col items-center">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[2px] border-[var(--black)] bg-[var(--gray-100)]">
                {profilePic ? <Image src={profilePic} alt="pic" width={80} height={80} unoptimized className="h-full w-full object-cover" /> : <IconCamera className="h-8 w-8 opacity-40" />}
              </div>
              <button type="button" onClick={()=>fileRef.current?.click()} className="mt-2 rounded-full border-[1.5px] border-[var(--black)] bg-white px-4 py-1.5 text-[12px] font-black hover:bg-[var(--gray-100)]">{profilePic?tr.changePhoto:tr.addPhoto}</button>
              <p className="mt-1 text-[11px] font-bold opacity-50">{tr.photoHelper}</p>
            </div>
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {/* BUYER STEP 4 */}
        {!isSeller && step === 4 && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 shadow-[4px_4px_0_var(--black)]">
            <h1 className="text-[20px] font-black">{tr.phoneTitle}</h1>
            <p className="mt-1 text-[13px] font-bold opacity-60">{tr.phoneHelper}</p>
            <div className="mt-4">
            <VoiceField
              label={tr.phoneTitle}
              prompt={getVoiceText("f_phone_hint", vc)}
              value={phone}
              onChange={setPhone}
              lang={vc}
              voiceKey="f_phone_hint"
              inputMode="numeric"
              maxLength={10}
              numeric
              placeholder={tr.phonePlaceholder}
              hint={tr.phoneFocus}
            />
            </div>
            <div className="mt-6 border-t-[2px] border-[var(--black)] pt-4">
              <h2 className="text-[14px] font-black">{tr.buyerPrefTitle}</h2>
              <p className="text-[11px] font-bold opacity-60">{tr.buyerPrefHelper}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BUYER_PREFS.map(p=> {
                  const active = buyerPrefs.includes(p);
                  return <button key={p} type="button" onClick={()=> setBuyerPrefs(active? buyerPrefs.filter(x=>x!==p): [...buyerPrefs, p])} className={`rounded-full border-[1.5px] border-[var(--black)] px-3 py-1.5 text-[12px] font-black ${active?"bg-[var(--red)] text-white":"bg-white hover:bg-[var(--gray-100)]"}`}>{catLabel(p)}</button>
                })}
              </div>
            </div>
            <button type="button" onClick={handleNext} className="mt-6 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white font-black hover:bg-[var(--red)]">{t.continue} →</button>
          </section>
        )}

        {/* COMPLETION */}
        {((isSeller && step===8) || (!isSeller && step===5)) && (
          <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-6 text-center shadow-[4px_4px_0_var(--black)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--red)] text-white"><IconCheck className="h-7 w-7" /></div>
            <h1 className="mt-3 text-[24px] font-black">{tr.completionTitle}</h1>
            <p className="mt-1 text-[14px] font-black text-[var(--red)]">{tr.completionSub(fullName || "Friend")}</p>

            {/* Greeting Video Mapped to Chosen Language */}
            <div className="my-5">
              <GreetingVideo
                initialLanguage={language}
                userName={fullName || undefined}
                autoPlay={true}
              />
            </div>

            <div className="mt-4 rounded-[14px] border-[2px] border-[var(--black)] bg-[var(--gray-100)] p-3 text-left">
              <div className="text-[12px] font-black">{fullName} — {locationName}</div>
              <div className="text-[11px] font-bold opacity-60">{isSeller ? t.role.seller : t.role.buyer} • {t.langName}</div>
            </div>
            <button type="button" onClick={handleComplete} disabled={isSaving} className="mt-4 flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--red)] text-white font-black hover:bg-[var(--red-hover)] disabled:opacity-50">{isSaving?tr.errors.saving:tr.goToHome}</button>
          </section>
        )}
      </div>
    </div>
  );
}
