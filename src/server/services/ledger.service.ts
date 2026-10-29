import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export class LedgerService {
  static async getAllTransactions(limit = 100, accountName?: string, merchantId?: string) {
    const where: Prisma.LedgerEntryWhereInput = {};
    if (accountName && accountName !== 'ALL') {
      where.accountName = accountName;
    }
    if (merchantId) {
      where.merchantId = merchantId;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: true,
        merchant: true,
      },
    });

    // Verify double-entry balance for distinct entry groups
    const groupsMap = new Map<string, { debits: number; credits: number; count: number }>();
    for (const e of entries) {
      if (!groupsMap.has(e.entryGroupRef)) {
        groupsMap.set(e.entryGroupRef, { debits: 0, credits: 0, count: 0 });
      }
      const g = groupsMap.get(e.entryGroupRef)!;
      g.count += 1;
      if (e.entryType === 'DEBIT') g.debits += e.amountPaise;
      if (e.entryType === 'CREDIT') g.credits += e.amountPaise;
    }

    return {
      entries,
      groupBalances: Array.from(groupsMap.entries()).map(([groupRef, data]) => ({
        entryGroupRef: groupRef,
        debitsPaise: data.debits,
        creditsPaise: data.credits,
        isBalanced: data.debits === data.credits,
        entryCount: data.count,
      })),
    };
  }
}
