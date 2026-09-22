import { Pool } from "pg";

// ── Neon Postgres pool (server-only) ─────────────────────────────
// DATABASE_URL = Neon pooler URL, e.g.
// postgresql://neondb_owner:...@ep-...-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require
//
// Neon free tier auto-suspends compute → first query after idle can take
// 5-15s (cold start). So: long connection timeout + 1 automatic retry.
// Neon pooler = PgBouncer → keep max low, close idle conns fast so we
// don't hold stale sockets PgBouncer already killed.

function cleanConnectionString(url: string): string {
  try {
    const u = new URL(url);
    // pg doesn't understand channel_binding — drop it.
    u.searchParams.delete("channel_binding");
    // We pass `ssl` explicitly below; leaving sslmode=require in the URL
    // makes pg-connection-string emit a SECURITY WARNING on every connect.
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    return u.toString();
  } catch {
    return url
      .replace(/[?&]channel_binding=[^&]*/g, "")
      .replace(/[?&]sslmode=[^&]*/g, "");
  }
}

const rawUrl = process.env.DATABASE_URL ?? "";
const connectionString = rawUrl ? cleanConnectionString(rawUrl) : rawUrl;

declare global {
  // eslint-disable-next-line no-var
  var __essor_pg_pool: Pool | undefined;
}

function createPool(): Pool {
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL (Neon connection string)");
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 30_000,
    // Fail a stuck query instead of hanging the API route forever
    query_timeout: 25_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
  pool.on("error", (err) => {
    // A single bad client shouldn't poison the whole pool —
    // drop it so the next query() builds a fresh one.
    console.error("[neon] pool client error, resetting pool:", (err as Error).message);
    resetPool().catch(() => undefined);
  });
  return pool;
}

async function resetPool(): Promise<void> {
  const old = globalThis.__essor_pg_pool;
  globalThis.__essor_pg_pool = undefined;
  if (old) {
    try {
      await old.end();
    } catch {
      /* ignore */
    }
  }
}

// Reuse pool across HMR / serverless warm starts
export function getPool(): Pool {
  if (!globalThis.__essor_pg_pool) {
    globalThis.__essor_pg_pool = createPool();
  }
  return globalThis.__essor_pg_pool;
}

function isRetriableDbError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${(e as { code?: string }).code ?? ""}` : String(e);
  return (
    msg.includes("Connection terminated") ||
    msg.includes("connection timeout") ||
    msg.includes("timeout expired") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("EAI_AGAIN") ||
    msg.includes("57P01") || // admin shutdown (Neon suspend)
    msg.includes("57P02") || // crash shutdown
    msg.includes("08006") || // connection failure
    msg.includes("08000")
  );
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
  retries = 1
): Promise<{ rows: T[]; rowCount: number | null }> {
  const pool = getPool();
  try {
    const res = await pool.query(text, (params ?? []) as unknown as unknown[]);
    return res as unknown as { rows: T[]; rowCount: number | null };
  } catch (e) {
    if (retries > 0 && isRetriableDbError(e)) {
      console.warn(
        "[neon] retriable DB error, resetting pool and retrying once:",
        e instanceof Error ? e.message : String(e)
      );
      await resetPool();
      return query<T>(text, params, retries - 1);
    }
    throw e;
  }
}
