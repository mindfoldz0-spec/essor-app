"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/languageContext";
import Loader from "@/components/Loader";
import VoiceButton from "@/components/VoiceButton";
import { voiceCode, getVoiceText } from "@/lib/voice-strings";

interface Order {
  id: string;
  title: string;
  detail: string;
  amount: string | number;
  kind: string;
  counterparty_name: string;
  status: string;
  created_at: string;
}

const FLOW = ["open", "confirmed", "paid", "delivered"] as const;

function deviceId(): string | null {
  try {
    return window.localStorage.getItem("essor_device_id");
  } catch {
    return null;
  }
}

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const vc = voiceCode(language);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [title, setTitle] = useState("");
  const [who, setWho] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = deviceId();
    if (!id) {
      return;
    }
    let cancelled = false;
    fetch(`/api/orders?device_id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setOrders(j.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const add = async () => {
    const id = deviceId();
    if (!id || !title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: id,
          title: title.trim(),
          counterparty_name: who.trim(),
          amount: Number(amount) || 0,
        }),
      });
      if (res.ok) {
        setTitle("");
        setWho("");
        setAmount("");
        setReloadKey((k) => k + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const advance = async (o: Order) => {
    const id = deviceId();
    if (!id) return;
    const idx = FLOW.indexOf(o.status as (typeof FLOW)[number]);
    const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
    if (!next) return;
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, device_id: id, status: next }),
    });
    if (res.ok) setReloadKey((k) => k + 1);
  };

  const statusLabel = (s: string) =>
    (t.orders.statuses as Record<string, string>)[s] ?? s;

  return (
    <div className="w-full space-y-4 px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-[22px] font-black leading-tight">{t.orders.title}</h1>
        <VoiceButton text={getVoiceText("page_orders", vc)} lang={vc} voiceKey="page_orders" label={t.listen} />
      </div>

      <div className="rounded-[20px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
        <h2 className="text-[14px] font-black">{t.orders.newTitle}</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.orders.newPlaceholder}
          maxLength={120}
          className="mt-2 h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[14px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder={t.orders.withLabel}
            maxLength={80}
            className="h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[14px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder={t.orders.amountLabel}
            inputMode="numeric"
            className="h-12 w-full rounded-[14px] border-[2px] border-[var(--black)] bg-white px-4 text-[14px] font-bold outline-none placeholder:opacity-40 focus:border-[var(--red)]"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving || !title.trim()}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full border-[2px] border-[var(--black)] bg-[var(--black)] text-white text-[13px] font-black disabled:opacity-40"
        >
          {t.orders.add}
        </button>
      </div>

      <div className="space-y-3">
        {orders === null && (
          <div className="flex justify-center p-8"><Loader /></div>
        )}
        {orders !== null && orders.length === 0 && (
          <div className="rounded-[14px] border-[2px] border-[var(--black)] bg-white p-4 text-[13px] font-bold opacity-60">
            {t.orders.empty}
          </div>
        )}
        {(orders ?? []).map((o) => (
          <div key={o.id} className="rounded-[18px] border-[2px] border-[var(--black)] bg-white p-4 shadow-[4px_4px_0_var(--black)]">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[15px] font-black leading-snug">{o.title}</div>
              <span className="shrink-0 rounded-full bg-[var(--gray-100)] px-2.5 py-0.5 text-[10px] font-black">
                {statusLabel(o.status)}
              </span>
            </div>
            {(o.counterparty_name || Number(o.amount) > 0) && (
              <div className="mt-1 text-[12px] font-bold opacity-60">
                {o.counterparty_name}{o.counterparty_name && Number(o.amount) > 0 ? " • " : ""}{Number(o.amount) > 0 ? `₹${o.amount}` : ""}
              </div>
            )}
            {FLOW.includes(o.status as (typeof FLOW)[number]) && (
              <button
                type="button"
                onClick={() => advance(o)}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-full border-[1.5px] border-[var(--black)] bg-white text-[12px] font-black hover:bg-[var(--gray-100)]"
              >
                {t.orders.advance} → {statusLabel(FLOW[FLOW.indexOf(o.status as (typeof FLOW)[number]) + 1])}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
