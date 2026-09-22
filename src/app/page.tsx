"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";
import { useUserProfile } from "@/lib/userProfile";
import { IconPin, IconCart, IconBox } from "@/components/icons";

export default function Home() {
  const profile = useUserProfile();
  const { t } = useLanguage();
  const isBuyer = profile?.role === "buyer";

  if (profile === undefined) return <div className="p-6 animate-pulse"><div className="h-32 rounded-[20px] bg-[var(--gray-100)]" /></div>;
  if (profile === null) return null; // guard will redirect

  const name = profile.full_name?.split(" ")[0] || "";

  return (
    <div className="w-full px-4 py-6 space-y-4">
      <section className="rounded-[24px] border-[2px] border-[var(--black)] bg-[var(--white)] p-5 shadow-[4px_4px_0_var(--black)]">
        <span className="rounded-full bg-[var(--black)] px-3 py-1 text-[11px] font-black tracking-widest text-white">{isBuyer ? t.home.buyerBadge : t.home.sellerBadge}</span>
        <h1 className="mt-3 text-[22px] font-black leading-tight">{t.home.greeting(name)}</h1>
        <p className="mt-1 text-[13px] font-bold opacity-60">{isBuyer ? t.home.subtitleBuyer(profile.location_name||"") : t.home.subtitleSeller}</p>
        {profile.location_name && <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--black)] bg-[var(--gray-100)] px-2.5 py-1 text-[11px] font-black"><IconPin className="h-3.5 w-3.5" /> {profile.location_name}{profile.pincode?` — ${profile.pincode}`:""}</span>}
      </section>

      <section>
        <h2 className="px-1 text-[12px] font-black tracking-widest opacity-50 uppercase">{t.home.quickTitle}</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {isBuyer ? (
            <>
              <Link href="/search" className="rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] p-4 hover:shadow-[4px_4px_0_var(--black)]">
                <div className="flex items-center gap-2 text-[13px] font-black"><IconCart className="h-5 w-5 shrink-0" /> {t.home.quick.shopNearby}</div><div className="text-[11px] font-bold opacity-60">{t.home.quick.shopNearbyDesc}</div>
              </Link>
              <Link href="/profile" className="rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] p-4 hover:shadow-[4px_4px_0_var(--black)]">
                <div className="flex items-center gap-2 text-[13px] font-black"><IconBox className="h-5 w-5 shrink-0" /> {t.home.quick.myOrders}</div><div className="text-[11px] font-bold opacity-60">{t.home.quick.myOrdersDesc}</div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/schemes" className="rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] p-4 hover:shadow-[4px_4px_0_var(--black)]">
                <div className="text-[13px] font-black">{t.home.schemes}</div><div className="text-[11px] font-bold opacity-60">{t.home.schemesDesc}</div>
              </Link>
              <Link href="/orders" className="rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--white)] p-4 hover:shadow-[4px_4px_0_var(--black)]">
                <div className="text-[13px] font-black">{t.home.market}</div><div className="text-[11px] font-bold opacity-60">{t.home.marketDesc}</div>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[18px] border-[2px] border-[var(--black)] bg-[var(--red-soft)] p-4">
        <div className="text-[12px] font-black">Essor v0.0.1 • {isBuyer ? t.role.buyer : t.role.seller} • {t.langName}</div>
        <div className="text-[11px] font-bold opacity-60">{profile.full_name} — {profile.district||profile.location_name} {profile.phone?`• ${profile.phone}`:""}</div>
      </section>
    </div>
  );
}
