import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const LIST_COLS = `id, name, name_hi, name_mr, department, level, categories,
  target_group, is_women_focused, primary_goal, max_benefit, summary, official_portal`;

// GET /api/schemes?category=farmer&level=Maharashtra&goal=credit&women=true&q=loan&limit=50
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const goal = searchParams.get("goal");
    const women = searchParams.get("women") === "true";
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

    const conds: string[] = [];
    const params: unknown[] = [];
    const push = (c: string, v: unknown) => {
      params.push(v);
      conds.push(c.replace("?", `$${params.length}`));
    };

    if (category) push(`categories @> ARRAY[?]`, category);
    if (level && (level === "Central" || level === "Maharashtra")) push(`level = ?`, level);
    if (goal && ["credit", "skills", "subsidy", "insurance"].includes(goal)) push(`primary_goal = ?`, goal);
    if (women) conds.push(`is_women_focused = true`);
    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      conds.push(`(name ilike $${n} or name_hi ilike $${n} or name_mr ilike $${n} or summary ilike $${n} or department ilike $${n})`);
    }

    const where = conds.length ? `where ${conds.join(" and ")}` : "";
    params.push(limit);
    const res = await query<Record<string, unknown>>(
      `select ${LIST_COLS} from public.schemes ${where} order by is_women_focused desc, name asc limit $${params.length}`,
      params
    );
    return NextResponse.json({ count: res.rows.length, schemes: res.rows });
  } catch (e) {
    console.error("GET /api/schemes", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "db error" }, { status: 500 });
  }
}
