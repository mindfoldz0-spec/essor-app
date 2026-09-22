"use client";
export default function ProgressHeader({ step, total, label, showBack, onBack }: { step: number; total: number; label: string; showBack: boolean; onBack: () => void }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-[var(--black)] bg-[var(--white)] text-[14px] font-black hover:bg-[var(--gray-100)]">←</button>
          )}
          <span className="text-[11px] font-black tracking-widest opacity-60">{label}</span>
        </div>
        <span className="text-[11px] font-black opacity-40">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[var(--black)] bg-[var(--gray-100)] p-0.5">
        <div className="h-full rounded-full bg-[var(--red)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
