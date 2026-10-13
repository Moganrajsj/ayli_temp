import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { isTransientDbError } from "@/lib/db-error";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// One-time, non-fatal diagnostic. Never logs the URL or credentials — it only
// reports whether serverless requests are routed through a pooler, which is the
// main defence against Hostinger's `max_connections_per_hour` cap.
function warnIfUnpooled(): void {
  if (process.env.VERCEL !== "1") return;
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.startsWith("prisma://")) return;
  if (/[?&]connection_limit=/.test(url)) return;
  console.warn(
    "[prisma] Running on Vercel against a direct MySQL URL without connection_limit. " +
      "Each serverless instance may open its own pool; append ?connection_limit=1 to DATABASE_URL " +
      "or use a Prisma Accelerate (prisma://) URL to protect the database connection quota."
  );
}

// Prisma's defaults (connect_timeout=5s, pool_timeout=10s) are tight for a
// remote, connection-capped MySQL host reached from a serverless function; a
// slow cold connect or a briefly-saturated single-connection pool then throws
// instead of waiting. Widen them when the operator has not set a value.
// String-append only, so credentials in the URL are never re-encoded.
function applyConnectionDefaults(): void {
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith("prisma")) return;
  let next = url;
  if (!/[?&]connect_timeout=/.test(next)) {
    next += (next.includes("?") ? "&" : "?") + "connect_timeout=15";
  }
  if (!/[?&]pool_timeout=/.test(next)) {
    next += (next.includes("?") ? "&" : "?") + "pool_timeout=15";
  }
  if (next !== url) process.env.DATABASE_URL = next;
}

// Reads are idempotent, so retrying them after a transient connection failure
// is safe. This absorbs the intermittent Hostinger/MySQL hiccups that used to
// surface as "Could not load this …" errors. Writes are never retried here.
const RETRYABLE_READ_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_BASE_DELAY_MS = 120;

async function withDbRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < DB_RETRY_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === DB_RETRY_ATTEMPTS - 1) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, DB_RETRY_BASE_DELAY_MS * 2 ** attempt)
      );
    }
  }
  throw lastError;
}

// When DATABASE_URL is a Prisma Accelerate URL (prisma://…), route every query
// through the connection pooler so serverless functions never open raw MySQL
// connections directly. Otherwise fall back to a direct connection. Either way,
// transient read failures are retried.
function createPrismaClient(): PrismaClient {
  warnIfUnpooled();
  applyConnectionDefaults();

  const base = new PrismaClient();
  const withPooler = (
    process.env.DATABASE_URL?.trim().startsWith("prisma://")
      ? base.$extends(withAccelerate())
      : base
  ) as unknown as PrismaClient;

  const client = withPooler.$extends({
    query: {
      $allOperations({ operation, args, query }) {
        if (!RETRYABLE_READ_OPERATIONS.has(operation)) return query(args);
        return withDbRetry(() => query(args));
      },
    },
  });

  return client as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
