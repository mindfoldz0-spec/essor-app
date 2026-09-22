"use client";
import { useLanguage } from "@/lib/languageContext";

export default function Loader() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--black)] border-t-[var(--red)]" />
      <span className="text-[12px] font-black tracking-widest opacity-60">{t.loading}</span>
    </div>
  );
}
