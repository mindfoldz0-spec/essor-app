"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/languageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return <div className="p-8 text-center"><h1 className="text-[24px] font-black">{t.notFound.title}</h1><Link href="/" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[var(--black)] px-6 text-white font-black border-[2px] border-[var(--black)]">{t.notFound.home}</Link></div>;
}
