import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/guides?district=X&category=Y — guides (is_guide=true), newest profiles first
// POST /api/guides { device_id, is_guide, guide_years? } — toggle own flag
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = (searchParams.get("district") || "").slice(0, 80);
    const category = (searchParams.get("category") || "").slice(0, 40);
    const res = await query<Record<string, unknown>>(
      `select full_name, district, category, business_name, guide_years, what_you_sell
       from public.user_profiles
       where is_guide = true
         and ($1 = '' or district = $1)
         and ($2 = '' or category = $2)
       order by updated_at desc limit 30`,
      [district, category]
    );
    return NextResponse.json({ guides: res.rows });
  } catch (e) {
    console.error("GET /api/guides", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_id, is_guide, guide_years } = body;
    if (!device_id || typeof is_guide !== "boolean") {
      return NextResponse.json({ error: "device_id, is_guide required" }, { status: 400 });
    }
    const res = await query<Record<string, unknown>>(
      `update public.user_profiles set is_guide = $2, guide_years = $3, updated_at = now()
       where device_id = $1 returning is_guide, guide_years`,
      [device_id, is_guide, Math.max(0, Math.min(60, Number(guide_years) || 0))]
    );
    if (!res.rows[0]) return NextResponse.json({ error: "profile not found" }, { status: 404 });
    return NextResponse.json({ guide: res.rows[0] });
  } catch (e) {
    console.error("POST /api/guides", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
