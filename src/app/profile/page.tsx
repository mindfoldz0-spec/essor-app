"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserProfile, signOut, refreshUserProfile } from "@/lib/userProfile";
import { useLanguage } from "@/lib/languageContext";
import Loader from "@/components/Loader";
import { IconPin, IconCheck } from "@/components/icons";
import { Language, sellLabel } from "@/lib/translations";

export default function ProfilePage() {
  const profile = useUserProfile();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [upiOverride, setUpiOverride] = useState<string | null>(null);
  const [upiSaved, setUpiSaved] = useState(false);
  // Derived during render (no effect): manual edits win, else saved value.
  const upi = upiOverride ?? profile?.upi_vpa ?? "";

  if (profile === undefined) return <div className="flex min-h-[50vh] items-center justify-center p-8"><Loader /></div>;
  if (profile === null) return <div className="p-6"><div className="rounded-[24px] border-[2px] border-[var(--black)] bg-white p-8 text-center shadow-[4px_4px_0_var(--black)]"><h1 className="text-[18px] font-black">{t.profile.noProfileTitle}</h1><p className="text-[13px] font-bold opacity-60">{t.profile.noProfileDesc}</p><Link href="/onboarding" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[var(--red)] px-6 text-white font-black border-[2px] border-[var(--black)]">{t.profile.goOnboarding}</Link></div></div>;

  const isSeller = profile.role === "seller";
  const langs: { code: Language; label: string }[] = [{code:"english",label:"English"},{code:"marathi",label:"मराठी"},{code:"hindi",label:"हिंदी"}];
  const goalLabel = (g: string) =>
    g === "credit" ? t.onboarding.goalCredit : g === "customers" ? t.onboarding.goalCustomers : g === "skills" ? t.onboarding.goalSkills : g;

  const saveUpi = async () => {
    const id = (() => {
      try {
        return window.localStorage.getItem("essor_device_id");
      } catch {
        return null;
      }
    })();
    if (!id || !profile) return;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, device_id: id, upi_vpa: upi.trim() || null }),
    });
    if (res.ok) {
      setUpiOverride(null);
      setUpiSaved(true);
      refreshUserProfile();
      window.setTimeout(() => setUpiSaved(false), 1800);
    }
  };

  return (
    <div className="w-full px-4 py-6 space-y-4">
      <div className="rounded-[24px] border-[2px] border-[var(--black)] bg-white p-5 shadow-[4px_4px_0_var(--black)]">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2px] border-[var(--black)] bg-[var(--gray-100)]">
            {profile.profile_picture ? <Image src={profile.profile_picture} alt={profile.full_name} fill unoptimized className="object-cover" /> : <span className="text-[20px] font-black">{profile.full_name.charAt(0)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest text-white ${isSeller?"bg-[var(--black)]":"bg-[var(--red)]"}`}>{profile.role.toUpperCase()}</span>
            <h1 className="truncate text-[18px] font-black">{profile.full_name}</h1>
            <p className="truncate text-[12px] font-bold opacity-60"><IconPin className="mr-0.5 inline-block h-3.5 w-3.5 align-[-2px]" /> {profile.location_name}{profile.pincode?` — ${profile.pincode}`:""} • {t.categories[profile.category||""]||profile.category||""}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/onboarding" className="flex h-10 flex-1 items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-white text-[12px] font-black hover:bg-[var(--gray-100)]">{t.profile.edit}</Link>
          <Link href="/" className="flex h-10 flex-1 items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white text-[12px] font-black">{t.profile.home}</Link>
        </div>
      </div>

      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <h2 className="text-[12px] font-black tracking-widest uppercase">{t.profile.language}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {langs.map(l=>{
            const active = language===l.code;
            return <button key={l.code} type="button" onClick={()=>setLanguage(l.code)} className={`rounded-[14px] border-[2px] py-2.5 text-[13px] font-black ${active?"bg-[var(--black)] text-white border-[var(--black)]":"bg-white border-[var(--gray-200)] hover:border-[var(--black)]"}`}>{l.label}</button>
          })}
        </div>
      </div>

      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <h2 className="text-[12px] font-black tracking-widest uppercase">{t.profile.upi.label}</h2>
        <p className="mt-0.5 text-[11px] font-bold opacity-60">{t.profile.upi.hint}</p>
        <div className="mt-2 flex gap-2">
          <input
            value={upi}
            onChange={(e) => { setUpiOverride(e.target.value); setUpiSaved(false); }}
            placeholder={t.profile.upi.placeholder}
            maxLength={60}
            className="h-11 min-w-0 flex-1 rounded-[12px] border-[2px] border-[var(--black)] bg-white px-3 text-[13px] font-bold outline-none placeholder:opacity-40"
          />
          <button
            type="button"
            onClick={saveUpi}
            className={`flex h-11 shrink-0 items-center rounded-full border-[2px] border-[var(--black)] px-4 text-[12px] font-black ${upiSaved ? "bg-green-600 text-white" : "bg-[var(--black)] text-white"}`}
          >
            {upiSaved ? <IconCheck className="h-4 w-4" /> : t.profile.edit}
          </button>
        </div>
        {profile.is_guide && (
          <p className="mt-2 text-[11px] font-black text-green-700">{t.samuday.guideOn}</p>
        )}
      </div>

      <div className="space-y-2">
        {[
          [t.profile.role, isSeller ? t.role.seller : t.role.buyer],
          [t.profile.location, `${profile.location_name||""} ${profile.district?`• ${profile.district}`:""} ${profile.pincode?`• ${profile.pincode}`:""}`],
          [t.profile.phone, profile.phone || t.profile.details.notSet],
          ...(isSeller ? [
            [t.profile.business, `${profile.business_name||""} ${profile.category?`• ${t.categories[profile.category]||profile.category}`:""}`],
            [t.profile.details.whatSell, (profile.what_you_sell||[]).map((s) => sellLabel(s, language)).join(", ") || (profile.business_idea ? t.categories[profile.business_idea] || profile.business_idea : "") || "—"],
            [t.profile.goal, profile.primary_goal ? goalLabel(profile.primary_goal) : "—"],
            [t.profile.woman, profile.is_woman_entrepreneur ? t.profile.details.yesUnlocked : t.profile.details.no],
          ] : [
            [t.profile.details.preferences, (profile.buyer_preferences||[]).map(p=>t.categories[p]||p).join(", ") || "—"],
          ]),
          [t.profile.details.district, profile.district || "—"],
          [t.profile.details.state, profile.state || "—"],
          [t.profile.details.pincode, profile.pincode || "—"],
        ].map(([k,v])=> (
          <div key={k} className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-3">
            <div className="text-[10px] font-black tracking-widest opacity-50 uppercase">{k}</div>
            <div className="text-[13px] font-black">{v as string}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] border-[2px] border-[var(--black)] bg-[var(--red-soft)] p-3">
        <div className="text-[11px] font-black opacity-60">{t.profile.details.deviceId}</div>
        <div className="text-[10px] font-mono font-bold break-all">{profile.device_id}</div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (window.confirm(t.profile.details.logoutConfirm)) {
            signOut();
            router.push("/onboarding");
          }
        }}
        className="flex h-12 w-full items-center justify-center rounded-full border-[2px] border-[var(--red)] bg-white text-[14px] font-black text-[var(--red)] active:scale-[0.98]"
      >
        {t.profile.details.logout}
      </button>
    </div>
  );
}
