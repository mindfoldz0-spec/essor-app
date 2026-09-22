import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/schemes/[id] — full detail incl. steps, docs, videos
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const res = await query<Record<string, unknown>>(`select * from public.schemes where id = $1 limit 1`, [id]);
    if (!res.rows[0]) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ scheme: res.rows[0] });
  } catch (e) {
    console.error("GET /api/schemes/[id]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
