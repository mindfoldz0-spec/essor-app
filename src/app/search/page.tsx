"use client";
import { useLanguage } from "@/lib/languageContext";

export default function SearchPage() {
  const { t } = useLanguage();
  return (
    <div className="p-6">
      <div className="rounded-[24px] border-[2px] border-[var(--black)] bg-white p-6 shadow-[4px_4px_0_var(--black)]">
        <h1 className="text-[18px] font-black">{t.search.title} — {t.search.tag}</h1>
        <p className="mt-1 text-[13px] font-bold opacity-60">{t.search.desc}</p>
      </div>
    </div>
  );
}
