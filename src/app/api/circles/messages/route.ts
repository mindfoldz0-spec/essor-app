import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/circles/messages?district=X&category=Y — latest 50, oldest first for reading
// POST /api/circles/messages { device_id, district, category, display_name, body }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = (searchParams.get("district") || "").slice(0, 80);
    const category = (searchParams.get("category") || "").slice(0, 40);
    const res = await query<Record<string, unknown>>(
      `select id, display_name, body, created_at from public.circle_messages
       where ($1 = '' or district = $1) and ($2 = '' or category = $2)
       order by created_at desc limit 50`,
      [district, category]
    );
    return NextResponse.json({ messages: [...res.rows].reverse() });
  } catch (e) {
    console.error("GET /api/circles/messages", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_id, district, category, display_name, body: text } = body;
    if (!device_id || !text?.trim()) {
      return NextResponse.json({ error: "device_id, body required" }, { status: 400 });
    }
    const clean = text.trim().slice(0, 500);
    if (!clean) return NextResponse.json({ error: "empty message" }, { status: 400 });
    const res = await query<Record<string, unknown>>(
      `insert into public.circle_messages (device_id, district, category, display_name, body)
       values ($1, $2, $3, $4, $5) returning id, display_name, body, created_at`,
      [
        device_id,
        (district ?? "").toString().slice(0, 80),
        (category ?? "").toString().slice(0, 40),
        (display_name ?? "").toString().slice(0, 60),
        clean,
      ]
    );
    return NextResponse.json({ message: res.rows[0] });
  } catch (e) {
    console.error("POST /api/circles/messages", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
