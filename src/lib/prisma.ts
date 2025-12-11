import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

// Create a PostgreSQL pool
const createPool = () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return new pg.Pool({ connectionString });
};

// Create Prisma client with the pg adapter (required for Prisma 7)
const createPrismaClient = () => {
  const pool = createPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// Use global variable to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
