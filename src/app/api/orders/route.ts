import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const STATUSES = ["open", "confirmed", "paid", "delivered", "cancelled"];

// GET /api/orders?device_id=xxx — order threads, newest first
// POST /api/orders { device_id, title, detail?, amount?, kind?, counterparty_name? }
// PATCH /api/orders { id, device_id, status }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("device_id");
    if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });
    const res = await query<Record<string, unknown>>(
      `select * from public.orders where device_id = $1 order by created_at desc limit 100`,
      [deviceId]
    );
    return NextResponse.json({ orders: res.rows });
  } catch (e) {
    console.error("GET /api/orders", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { device_id, title, detail, amount, kind, counterparty_name } = body;
    if (!device_id || !title?.trim()) {
      return NextResponse.json({ error: "device_id, title required" }, { status: 400 });
    }
    if (kind && !["sale", "purchase"].includes(kind)) {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }
    const res = await query<Record<string, unknown>>(
      `insert into public.orders (device_id, title, detail, amount, kind, counterparty_name)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [
        device_id,
        title.trim().slice(0, 120),
        (detail ?? "").toString().slice(0, 500),
        Number(amount) || 0,
        kind ?? "sale",
        (counterparty_name ?? "").toString().slice(0, 80),
      ]
    );
    return NextResponse.json({ order: res.rows[0] });
  } catch (e) {
    console.error("POST /api/orders", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, device_id, status } = body;
    if (!id || !device_id || !STATUSES.includes(status)) {
      return NextResponse.json({ error: "id, device_id, valid status required" }, { status: 400 });
    }
    const res = await query<Record<string, unknown>>(
      `update public.orders set status = $3, updated_at = now()
       where id = $1 and device_id = $2 returning *`,
      [id, device_id, status]
    );
    if (!res.rows[0]) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ order: res.rows[0] });
  } catch (e) {
    console.error("PATCH /api/orders", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
