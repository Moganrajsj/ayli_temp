import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL?.startsWith("prisma://")
    ? (new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient)
    : new PrismaClient());

globalForPrisma.prisma = prisma;