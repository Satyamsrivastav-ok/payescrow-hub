import { prisma } from '../db/prisma.js';
import { CreateMerchantInput, UpdateMerchantInput } from '../schemas/index.js';
import { MerchantStatus } from '@prisma/client';

export class MerchantService {
  static async getAllMerchants(filter?: { status?: string; search?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as MerchantStatus;
    }
    if (filter?.search) {
      where.OR = [
        { businessName: { contains: filter.search, mode: 'insensitive' } },
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { merchantCode: { contains: filter.search, mode: 'insensitive' } },
        { contactEmail: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.merchant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { allocations: true, payouts: true },
        },
      },
    });
  }

  static async getMerchantById(id: string) {
    return await prisma.merchant.findUnique({
      where: { id },
      include: {
        allocations: {
          include: { order: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
      },
    });
  }

  static async createMerchant(input: CreateMerchantInput) {
    const count = await prisma.merchant.count();
    const merchantCode = `MER-IND-${String(count + 1).padStart(3, '0')}`;

    const created = await prisma.merchant.create({
      data: {
        merchantCode,
        businessName: input.businessName,
        legalName: input.legalName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        status: MerchantStatus.ACTIVE,
        bankName: input.bankName,
        accountNumberLast4: input.accountNumberLast4,
        ifscCode: input.ifscCode,
        defaultCommissionBps: input.defaultCommissionBps,
        fixedFeePaise: input.fixedFeePaise,
        totalEscrowHeldPaise: 0,
        totalDisbursedPaise: 0,
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: 'MERCHANT',
        entityId: created.id,
        action: 'SUB_MERCHANT_ONBOARDED',
        actor: 'system:onboarding',
        details: `Sub-merchant ${created.businessName} (${created.merchantCode}) onboarded with default commission ${input.defaultCommissionBps / 100}%.`,
      },
    });

    return created;
  }

  static async updateMerchant(id: string, input: UpdateMerchantInput) {
    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        ...(input.businessName && { businessName: input.businessName }),
        ...(input.legalName && { legalName: input.legalName }),
        ...(input.contactEmail && { contactEmail: input.contactEmail }),
        ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
        ...(input.status && { status: input.status as MerchantStatus }),
        ...(input.bankName && { bankName: input.bankName }),
        ...(input.accountNumberLast4 && { accountNumberLast4: input.accountNumberLast4 }),
        ...(input.ifscCode && { ifscCode: input.ifscCode }),
        ...(input.defaultCommissionBps !== undefined && { defaultCommissionBps: input.defaultCommissionBps }),
        ...(input.fixedFeePaise !== undefined && { fixedFeePaise: input.fixedFeePaise }),
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: 'MERCHANT',
        entityId: updated.id,
        action: 'SUB_MERCHANT_UPDATED',
        actor: 'user:admin',
        details: `Merchant ${updated.merchantCode} parameters updated. Current status: ${updated.status}.`,
      },
    });

    return updated;
  }
}
