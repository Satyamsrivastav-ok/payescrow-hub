import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Global declaration for singleton in dev
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export interface DatabaseHealth {
  connected: boolean;
  provider: 'PostgreSQL';
  orm: 'Prisma';
  databaseUrlConfigured: boolean;
  latencyMs?: number;
  message: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql://'));
  
  if (!hasDbUrl) {
    return {
      connected: false,
      provider: 'PostgreSQL',
      orm: 'Prisma',
      databaseUrlConfigured: false,
      message: 'DATABASE_URL is not set or not pointing to PostgreSQL. See docker-compose.yml or .env.example.',
    };
  }

  const start = Date.now();
  try {
    // Attempt standard raw query to PostgreSQL
    await prisma.$queryRaw`SELECT 1 as health_check;`;
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      provider: 'PostgreSQL',
      orm: 'Prisma',
      databaseUrlConfigured: true,
      latencyMs,
      message: 'Connected to PostgreSQL database via Prisma ORM.',
    };
  } catch {
    return {
      connected: false,
      provider: 'PostgreSQL',
      orm: 'Prisma',
      databaseUrlConfigured: true,
      latencyMs: Date.now() - start,
      message: 'PostgreSQL is unreachable or the connection settings are invalid.',
    };
  }
}
