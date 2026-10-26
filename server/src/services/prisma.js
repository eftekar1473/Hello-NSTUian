import { PrismaClient } from '@prisma/client';

const fallbackDbUrl = "postgresql://postgres.rhhlebvhiikrqfrzyexr:allahisthebest09876@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

let rawUrl = process.env.DATABASE_URL || fallbackDbUrl;

// If URL uses IPv6 direct host `db.rhhlebvhiikrqfrzyexr.supabase.co`, convert to IPv4 connection pooler
if (rawUrl.includes('db.rhhlebvhiikrqfrzyexr.supabase.co')) {
  rawUrl = rawUrl.replace(
    'postgres:allahisthebest09876@db.rhhlebvhiikrqfrzyexr.supabase.co:5432',
    'postgres.rhhlebvhiikrqfrzyexr:allahisthebest09876@aws-0-ap-southeast-1.pooler.supabase.com:5432'
  );
  if (rawUrl.includes('db.rhhlebvhiikrqfrzyexr.supabase.co')) {
    rawUrl = fallbackDbUrl;
  }
}

// Ensure process.env.DATABASE_URL is also updated globally
process.env.DATABASE_URL = rawUrl;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: rawUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
