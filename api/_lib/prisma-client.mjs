import { PrismaClient } from "@prisma/client";

const globalForPrisma =
  globalThis.__EMPLOYEE_MANAGEMENT_PRISMA__ ??
  (globalThis.__EMPLOYEE_MANAGEMENT_PRISMA__ = {});

const databaseUrl =
  process.env.NG_APP_PRISMA_URL ||
  process.env.NG_APP_MONGODB_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI;

if (!databaseUrl) {
  console.warn(
    "[employee-management][prisma] No MongoDB connection string detected in NG_APP_PRISMA_URL, NG_APP_MONGODB_URI, DATABASE_URL, or MONGODB_URI."
  );
}

const prismaClientOptions = {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
};

/** @type {PrismaClient} */
export const prisma =
  globalForPrisma.client ||
  (globalForPrisma.client = new PrismaClient(prismaClientOptions));
