import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/khata/passport?device_id=xxx — Credit Passport: 30-day activity,
// inflow/outflow, repayment regularity, trust score 0-100.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("device_id");
    if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });

    const agg = await query<{
      entries_30d: string; inflow_30d: string; outflow_30d: string;
      total_inflow: string; total_outflow: string; total_entries: string;
      active_days: string; counterparties: string; oldest: string | null;
    }>(
      `select count(*) filter (where created_at > now() - interval '30 days')::text as entries_30d,
              coalesce(sum(amount) filter (where kind = 'jama' and created_at > now() - interval '30 days'), 0)::text as inflow_30d,
              coalesce(sum(amount) filter (where kind = 'udhaar' and created_at > now() - interval '30 days'), 0)::text as outflow_30d,
              coalesce(sum(amount) filter (where kind = 'jama'), 0)::text as total_inflow,
              coalesce(sum(amount) filter (where kind = 'udhaar'), 0)::text as total_outflow,
              count(*)::text as total_entries,
              count(distinct created_at::date)::text as active_days,
              count(distinct person_name)::text as counterparties,
              min(created_at)::text as oldest
       from public.khata_entries where device_id = $1`,
      [deviceId]
    );
    const a = agg.rows[0];
    const n = (v: string | null) => Number(v ?? 0);
    const entries30 = n(a.entries_30d);
    const inflow = n(a.total_inflow);
    const outflow = n(a.total_outflow);
    const total = n(a.total_entries);

    // Trust score: activity (40) + regularity (30) + volume balance (20) + history (10)
    let score = 0;
    score += Math.min(40, entries30 * 4);
    score += Math.min(30, n(a.active_days) * 3);
    if (total > 0) {
      const repayRatio = inflow / Math.max(1, inflow + outflow);
      score += Math.round(repayRatio * 20);
    }
    if (a.oldest) {
      const daysOld = (Date.now() - new Date(a.oldest).getTime()) / 86400000;
      score += Math.min(10, Math.floor(daysOld / 9));
    }
    score = Math.max(0, Math.min(100, Math.round(score)));

    return NextResponse.json({
      passport: {
        entries_30d: entries30,
        inflow_30d: inflow,
        outflow_30d: outflow,
        total_inflow: inflow,
        total_outflow: outflow,
        total_entries: total,
        active_days: n(a.active_days),
        counterparties: n(a.counterparties),
        score,
        ready: total >= 10 && score >= 50,
      },
    });
  } catch (e) {
    console.error("GET /api/khata/passport", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
