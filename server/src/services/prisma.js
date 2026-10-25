import { PrismaClient } from '@prisma/client';

const fallbackDbUrl = "postgresql://postgres:allahisthebest09876@db.rhhlebvhiikrqfrzyexr.supabase.co:5432/postgres";
const databaseUrl = process.env.DATABASE_URL || fallbackDbUrl;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
