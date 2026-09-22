import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/khata?device_id=xxx — entries (latest first) + totals
// POST /api/khata { device_id, person_name, amount, kind: udhaar|jama, note? }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("device_id");
    if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });
    const res = await query<Record<string, unknown>>(
      `select * from public.khata_entries where device_id = $1 order by created_at desc limit 100`,
      [deviceId]
    );
    const t = await query<{ total_udhaar: string; total_jama: string; entries: string }>(
      `select coalesce(sum(amount) filter (where kind = 'udhaar'), 0)::text as total_udhaar,
              coalesce(sum(amount) filter (where kind = 'jama'), 0)::text as total_jama,
              count(*)::text as entries
       from public.khata_entries where device_id = $1`,
      [deviceId]
    );
    return NextResponse.json({ entries: res.rows, totals: t.rows[0] });
  } catch (e) {
    console.error("GET /api/khata", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_id, person_name, amount, kind, note } = body;
    if (!device_id || !person_name?.trim() || !amount || !["udhaar", "jama"].includes(kind)) {
      return NextResponse.json({ error: "device_id, person_name, amount, kind required" }, { status: 400 });
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0 || num > 10000000) {
      return NextResponse.json({ error: "invalid amount" }, { status: 400 });
    }
    const res = await query<Record<string, unknown>>(
      `insert into public.khata_entries (device_id, person_name, amount, kind, note)
       values ($1, $2, $3, $4, $5) returning *`,
      [device_id, person_name.trim().slice(0, 80), num, kind, (note ?? "").toString().slice(0, 200)]
    );
    return NextResponse.json({ entry: res.rows[0] });
  } catch (e) {
    console.error("POST /api/khata", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
