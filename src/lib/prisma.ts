import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

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

// When DATABASE_URL is a Prisma Accelerate URL (prisma://…), route every query
// through the connection pooler so serverless functions never open raw MySQL
// connections directly. Otherwise fall back to a direct connection.
function createPrismaClient(): PrismaClient {
  warnIfUnpooled();
  const client = new PrismaClient();
  if (process.env.DATABASE_URL?.trim().startsWith("prisma://")) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
