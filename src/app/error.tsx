"use client";
import { useEffect } from "react";
import { useLanguage } from "@/lib/languageContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the actual error (Next.js recommended pattern); keep the UI generic.
  useEffect(() => {
    console.error(error);
  }, [error]);

  const { t } = useLanguage();

  return (
    <div className="p-8 text-center">
      <h1 className="text-[18px] font-black">{t.errorPage.title}</h1>
      <p className="mt-1 text-[12px] font-bold opacity-60">{error.message}</p>
      {error.digest && <p className="mt-1 text-[10px] font-bold opacity-40">Ref: {error.digest}</p>}
      <button onClick={reset} className="mt-4 h-10 rounded-full bg-[var(--red)] px-6 text-white font-black border-[2px] border-[var(--black)]">{t.errorPage.retry}</button>
    </div>
  );
}
