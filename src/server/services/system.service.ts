import { execSync } from 'child_process';
import { checkDatabaseConnection, DatabaseHealth } from '../db/prisma.js';
import { prisma } from '../db/prisma.js';

export class SystemService {
  static async getHealth(): Promise<{
    status: 'healthy' | 'degraded';
    timestamp: string;
    stack: {
      frontend: string[];
      backend: string[];
      database: string[];
      testing: string[];
      deployment: string[];
    };
    monetaryConvention: string;
    database: DatabaseHealth;
  }> {
    const dbHealth = await checkDatabaseConnection();
    return {
      status: dbHealth.connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      stack: {
        frontend: ['React.js 19', 'TypeScript', 'Vite 8', 'Tailwind CSS 4', 'React Router 7', 'Recharts 3'],
        backend: ['Node.js v22', 'Express.js 4', 'TypeScript', 'Zod 4'],
        database: ['PostgreSQL 16', 'Prisma ORM 6'],
        testing: ['Jest 30', 'Supertest 7', 'SWC Jest'],
        deployment: ['Docker', 'Docker Compose'],
      },
      monetaryConvention: 'Integer Paise (100 paise = 1 INR)',
      database: dbHealth,
    };
  }

  static async getPlatformMetrics() {
    const merchantsCount = await prisma.merchant.count();
    const ordersCount = await prisma.order.count();
    const payoutsCount = await prisma.payout.count();
    const ledgerEntriesCount = await prisma.ledgerEntry.count();

    const orders = await prisma.order.findMany({
      select: { totalAmountPaise: true, platformFeePaise: true, status: true },
    });

    let totalVolumePaise = 0;
    let totalCommissionPaise = 0;

    for (const o of orders) {
      if (o.status !== 'CANCELLED') {
        totalVolumePaise += o.totalAmountPaise;
        totalCommissionPaise += o.platformFeePaise;
      }
    }

    return {
      totalVolumePaise,
      totalCommissionPaise,
      merchantsCount,
      ordersCount,
      payoutsCount,
      ledgerEntriesCount,
    };
  }

  static async resetToEmpty() {
    await prisma.auditEvent.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.payout.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderAllocation.deleteMany();
    await prisma.order.deleteMany();
    await prisma.merchant.deleteMany();
    
    return {
      success: true,
      message: 'Platform state reset to clean zero-state. All test orders and payouts cleared.',
    };
  }

  static async seedDemoData() {
    try {
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
      return {
        success: true,
        message: 'Comprehensive fintech demo dataset seeded successfully.',
      };
    } catch (error: any) {
      console.error('Seed execution failed:', error);
      throw new Error(`Failed to seed demo data: ${error.message}`);
    }
  }
}
