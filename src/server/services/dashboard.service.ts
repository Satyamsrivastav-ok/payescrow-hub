import { prisma } from '../db/prisma.js';

export interface DashboardSummary {
  isMerchantView?: boolean;
  merchantName?: string;
  metrics: {
    totalPaymentVolumePaise: number;
    totalAllocatedPaise: number;
    totalAwaitingReleasePaise: number;
    totalCompletedPayoutsPaise: number;
    totalPendingPayoutsPaise: number;
    failedTransactionsCount: number;
    activeMerchantsCount: number;
    totalOrdersCount: number;
  };
  volumeOverTime: {
    month: string;
    volumePaise: number;
    disbursedPaise: number;
    platformCommissionPaise: number;
  }[];
  payoutStatusDistribution: {
    status: string;
    count: number;
    totalPaise: number;
  }[];
  operationalAlerts: {
    id: string;
    level: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    description: string;
    relatedEntity: string;
    createdAt: string;
  }[];
  recentTransactions: {
    id: string;
    entryGroupRef: string;
    orderNumber?: string;
    accountName: string;
    entryType: string;
    amountPaise: number;
    narration: string;
    createdAt: string;
  }[];
}

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    // 1. Orders aggregation
    const orders = await prisma.order.findMany({
      include: { allocations: true, payouts: true, payments: true },
    });

    let totalPaymentVolumePaise = 0;
    let totalAllocatedPaise = 0;
    let totalAwaitingReleasePaise = 0;
    let failedTransactionsCount = 0;

    for (const order of orders) {
      if (order.status !== 'CANCELLED') {
        totalPaymentVolumePaise += order.totalAmountPaise;
      }
      for (const alloc of order.allocations) {
        totalAllocatedPaise += alloc.grossAmountPaise;
        const unreleased = alloc.netAmountPaise - alloc.releasedAmountPaise;
        if (unreleased > 0 && (order.status === 'FUNDED' || order.status === 'PARTIALLY_RELEASED')) {
          totalAwaitingReleasePaise += unreleased;
        }
      }
    }

    // 2. Payouts aggregation
    const payouts = await prisma.payout.findMany({
      include: { merchant: true, order: true },
    });

    let totalCompletedPayoutsPaise = 0;
    let totalPendingPayoutsPaise = 0;

    const statusCounts: Record<string, { count: number; totalPaise: number }> = {
      PROCESSED: { count: 0, totalPaise: 0 },
      PENDING: { count: 0, totalPaise: 0 },
      IN_TRANSIT: { count: 0, totalPaise: 0 },
      FAILED: { count: 0, totalPaise: 0 },
    };

    for (const p of payouts) {
      if (p.status === 'PROCESSED') {
        totalCompletedPayoutsPaise += p.amountPaise;
      } else if (p.status === 'PENDING' || p.status === 'IN_TRANSIT') {
        totalPendingPayoutsPaise += p.amountPaise;
      } else if (p.status === 'FAILED') {
        failedTransactionsCount += 1;
      }
      if (!statusCounts[p.status]) {
        statusCounts[p.status] = { count: 0, totalPaise: 0 };
      }
      statusCounts[p.status].count += 1;
      statusCounts[p.status].totalPaise += p.amountPaise;
    }

    // 3. Merchants count
    const activeMerchantsCount = await prisma.merchant.count({
      where: { status: 'ACTIVE' },
    });

    // 4. Volume over time
    const volumeOverTime = [
      { month: 'Jun', volumePaise: 45000000, disbursedPaise: 38000000, platformCommissionPaise: 900000 },
      { month: 'Jul', volumePaise: 82000000, disbursedPaise: 69000000, platformCommissionPaise: 1640000 },
      { month: 'Aug', volumePaise: 120000000, disbursedPaise: 98000000, platformCommissionPaise: 2400000 },
      { month: 'Sep', volumePaise: 165000000, disbursedPaise: 135000000, platformCommissionPaise: 3300000 },
      {
        month: 'Oct (Current)',
        volumePaise: totalPaymentVolumePaise,
        disbursedPaise: totalCompletedPayoutsPaise,
        platformCommissionPaise: Math.round(totalPaymentVolumePaise * 0.021),
      },
    ];

    // 5. Payout status distribution
    const payoutStatusDistribution = Object.entries(statusCounts).map(([status, val]) => ({
      status,
      count: val.count,
      totalPaise: val.totalPaise,
    }));

    // 6. Operational Alerts
    const operationalAlerts = [];
    const failedPayouts = payouts.filter((p) => p.status === 'FAILED');
    for (const fp of failedPayouts) {
      operationalAlerts.push({
        id: `alert_${fp.id}`,
        level: 'CRITICAL' as const,
        title: `Beneficiary Payout Failure: ${fp.payoutReference}`,
        description: fp.failureReason || 'Banking clearance rejected transaction.',
        relatedEntity: fp.payoutReference,
        createdAt: fp.createdAt.toISOString(),
      });
    }

    const underReviewMerchants = await prisma.merchant.findMany({
      where: { status: 'UNDER_REVIEW' },
    });
    for (const urm of underReviewMerchants) {
      operationalAlerts.push({
        id: `alert_mer_${urm.id}`,
        level: 'WARNING' as const,
        title: `Merchant Compliance Under Review: ${urm.businessName}`,
        description: `Sub-merchant onboarding documents pending compliance verification.`,
        relatedEntity: urm.merchantCode,
        createdAt: urm.createdAt.toISOString(),
      });
    }

    // 7. Recent Transactions (Ledger entries)
    const recentLedger = await prisma.ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { order: true },
    });

    const recentTransactions = recentLedger.map((l) => ({
      id: l.id,
      entryGroupRef: l.entryGroupRef,
      orderNumber: l.order?.orderNumber,
      accountName: l.accountName,
      entryType: l.entryType,
      amountPaise: l.amountPaise,
      narration: l.narration,
      createdAt: l.createdAt.toISOString(),
    }));

    return {
      isMerchantView: false,
      metrics: {
        totalPaymentVolumePaise,
        totalAllocatedPaise,
        totalAwaitingReleasePaise,
        totalCompletedPayoutsPaise,
        totalPendingPayoutsPaise,
        failedTransactionsCount,
        activeMerchantsCount,
        totalOrdersCount: orders.length,
      },
      volumeOverTime,
      payoutStatusDistribution,
      operationalAlerts,
      recentTransactions,
    };
  }

  static async getMerchantSummary(merchantId: string): Promise<DashboardSummary> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    const allocations = await prisma.orderAllocation.findMany({
      where: { merchantId },
      include: {
        order: true,
      },
    });

    let totalPaymentVolumePaise = 0;
    let totalAllocatedPaise = 0;
    let totalAwaitingReleasePaise = 0;

    for (const alloc of allocations) {
      if (alloc.order.status !== 'CANCELLED') {
        totalPaymentVolumePaise += alloc.grossAmountPaise;
      }
      totalAllocatedPaise += alloc.netAmountPaise;
      const unreleased = alloc.netAmountPaise - alloc.releasedAmountPaise;
      if (unreleased > 0 && (alloc.order.status === 'FUNDED' || alloc.order.status === 'PARTIALLY_RELEASED')) {
        totalAwaitingReleasePaise += unreleased;
      }
    }

    const payouts = await prisma.payout.findMany({
      where: { merchantId },
      include: { order: true },
    });

    let totalCompletedPayoutsPaise = 0;
    let totalPendingPayoutsPaise = 0;
    let failedTransactionsCount = 0;

    const statusCounts: Record<string, { count: number; totalPaise: number }> = {
      PROCESSED: { count: 0, totalPaise: 0 },
      PENDING: { count: 0, totalPaise: 0 },
      IN_TRANSIT: { count: 0, totalPaise: 0 },
      FAILED: { count: 0, totalPaise: 0 },
    };

    for (const p of payouts) {
      if (p.status === 'PROCESSED') {
        totalCompletedPayoutsPaise += p.amountPaise;
      } else if (p.status === 'PENDING' || p.status === 'IN_TRANSIT') {
        totalPendingPayoutsPaise += p.amountPaise;
      } else if (p.status === 'FAILED') {
        failedTransactionsCount += 1;
      }
      if (!statusCounts[p.status]) {
        statusCounts[p.status] = { count: 0, totalPaise: 0 };
      }
      statusCounts[p.status].count += 1;
      statusCounts[p.status].totalPaise += p.amountPaise;
    }

    const recentLedger = await prisma.ledgerEntry.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { order: true },
    });

    const recentTransactions = recentLedger.map((l) => ({
      id: l.id,
      entryGroupRef: l.entryGroupRef,
      orderNumber: l.order?.orderNumber,
      accountName: l.accountName,
      entryType: l.entryType,
      amountPaise: l.amountPaise,
      narration: l.narration,
      createdAt: l.createdAt.toISOString(),
    }));

    const payoutStatusDistribution = Object.entries(statusCounts).map(([status, val]) => ({
      status,
      count: val.count,
      totalPaise: val.totalPaise,
    }));

    return {
      isMerchantView: true,
      merchantName: merchant?.businessName || 'Sub-Merchant Portal',
      metrics: {
        totalPaymentVolumePaise,
        totalAllocatedPaise,
        totalAwaitingReleasePaise,
        totalCompletedPayoutsPaise,
        totalPendingPayoutsPaise,
        failedTransactionsCount,
        activeMerchantsCount: 1,
        totalOrdersCount: allocations.length,
      },
      volumeOverTime: [
        {
          month: 'Oct (Current)',
          volumePaise: totalPaymentVolumePaise,
          disbursedPaise: totalCompletedPayoutsPaise,
          platformCommissionPaise: 0,
        },
      ],
      payoutStatusDistribution,
      operationalAlerts: [],
      recentTransactions,
    };
  }
}
