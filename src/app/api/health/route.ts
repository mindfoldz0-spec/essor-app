import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "unknown";
    }
  })();

  let reachable: boolean | null = null;
  let dbError: string | null = null;
  let profileCount: number | null = null;

  if (hasDb) {
    try {
      await query("select 1 as ok");
      reachable = true;
      try {
        const res = await query<{ count: string }>(
          "select count(*)::text as count from public.user_profiles"
        );
        profileCount = Number(res.rows[0]?.count ?? 0);
      } catch (e: unknown) {
        // Table missing → DB reachable but schema not applied yet
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("does not exist") || msg.includes("42P01")) {
          profileCount = null;
          dbError = "user_profiles table missing — run scripts/schema.sql";
        } else {
          dbError = msg.slice(0, 200);
        }
      }
    } catch (e: unknown) {
      reachable = false;
      dbError = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    }
  }

  return NextResponse.json({
    ok: hasDb && reachable === true,
    storage: "neon-postgres",
    dbHost,
    env: {
      DATABASE_URL: hasDb ? "set" : "missing",
    },
    db: { reachable, error: dbError, user_profiles_count: profileCount },
  });
}
