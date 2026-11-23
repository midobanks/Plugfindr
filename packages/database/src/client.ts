import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

type PrismaGlobal = { prisma?: PrismaClient };

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function createClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error('DATABASE_URL is required');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
