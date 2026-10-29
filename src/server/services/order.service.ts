import { prisma } from '../db/prisma.js';
import {
  CreateOrderInput,
  CreateMilestoneInput,
  ApproveMilestoneInput,
} from '../schemas/index.js';
import {
  OrderStatus,
  MilestoneStatus,
  LedgerEntryType,
  PaymentStatus,
} from '@prisma/client';

export class OrderService {
  static async getAllOrders(filter?: { status?: string; search?: string; merchantId?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as OrderStatus;
    }
    if (filter?.merchantId) {
      where.allocations = {
        some: { merchantId: filter.merchantId },
      };
    }
    if (filter?.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { customerReference: { contains: filter.search, mode: 'insensitive' } },
        { customerEmail: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        allocations: {
          include: { merchant: true },
        },
        milestones: true,
        payments: true,
        payouts: true,
      },
    });
  }

  static async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        allocations: {
          include: { merchant: true },
        },
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          include: { merchant: true },
          orderBy: { createdAt: 'desc' },
        },
        ledgerEntries: {
          orderBy: { createdAt: 'asc' },
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async createOrder(input: CreateOrderInput) {
    // 1. Financial validation: sum(allocations.grossAmountPaise) + platformFeePaise === totalAmountPaise
    const sumGrossAllocations = input.allocations.reduce(
      (sum, a) => sum + a.grossAmountPaise,
      0
    );

    if (sumGrossAllocations + input.platformFeePaise !== input.totalAmountPaise) {
      throw new Error(
        `Financial validation failed: Gross allocations (₹${(sumGrossAllocations / 100).toFixed(2)}) + Platform Commission (₹${(input.platformFeePaise / 100).toFixed(2)}) must exactly equal Order Total (₹${(input.totalAmountPaise / 100).toFixed(2)}).`
      );
    }

    // 2. Verify all merchants exist and are ACTIVE
    for (const alloc of input.allocations) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: alloc.merchantId },
      });
      if (!merchant) {
        throw new Error(`Merchant ID ${alloc.merchantId} does not exist.`);
      }
      if (merchant.status !== 'ACTIVE') {
        throw new Error(
          `Merchant ${merchant.businessName} (${merchant.merchantCode}) is ${merchant.status} and cannot receive new allocations.`
        );
      }
    }

    // Generate Order Number
    const count = await prisma.order.count();
    const orderNumber = `ORD-2026-${String(count + 1001)}`;
    const groupRef = `TXG-${orderNumber}`;

    // Execute in Prisma database transaction
    return await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerReference: input.customerReference,
          customerEmail: input.customerEmail,
          description: input.description,
          totalAmountPaise: input.totalAmountPaise,
          platformFeePaise: input.platformFeePaise,
          currency: 'INR',
          status: OrderStatus.FUNDED, // Simulated instant buyer payment confirmation
          fundedAt: new Date(),
        },
      });

      // Create Allocations & Milestones
      for (let i = 0; i < input.allocations.length; i++) {
        const alloc = input.allocations[i];
        const createdAlloc = await tx.orderAllocation.create({
          data: {
            orderId: order.id,
            merchantId: alloc.merchantId,
            splitType: alloc.splitType,
            splitValue: alloc.splitValue,
            grossAmountPaise: alloc.grossAmountPaise,
            merchantFeePaise: alloc.merchantFeePaise,
            netAmountPaise: alloc.netAmountPaise,
            releasedAmountPaise: 0,
          },
        });

        // Create default milestone for this merchant's allocation
        await tx.milestone.create({
          data: {
            milestoneCode: `MLS-${orderNumber.split('-')[2]}-0${i + 1}`,
            orderId: order.id,
            allocationId: createdAlloc.id,
            title: `Deliverable Verification for Allocation #${i + 1}`,
            description: `Quality signoff and physical dispatch verification for ${alloc.grossAmountPaise / 100} INR item lot.`,
            amountPaise: alloc.netAmountPaise,
            status: MilestoneStatus.PENDING,
          },
        });

        // Update merchant held balance
        await tx.merchant.update({
          where: { id: alloc.merchantId },
          data: {
            totalEscrowHeldPaise: {
              increment: alloc.netAmountPaise,
            },
          },
        });
      }

      // Record Inbound Payment
      await tx.payment.create({
        data: {
          paymentReference: `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          orderId: order.id,
          amountPaise: input.totalAmountPaise,
          currency: 'INR',
          paymentMethod: 'UPI_AUTOPAY',
          status: PaymentStatus.SUCCESS,
          capturedAt: new Date(),
        },
      });

      // Balanced Double-Entry Ledger Postings
      const netMerchantTotal = input.totalAmountPaise - input.platformFeePaise;

      // Leg 1: Debit Gateway Clearing Account (Asset)
      await tx.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: order.id,
          accountName: 'GATEWAY_CLEARING_ACCOUNT',
          entryType: LedgerEntryType.DEBIT,
          amountPaise: input.totalAmountPaise,
          narration: `Inbound customer settlement for ${order.orderNumber} via UPI AutoPay`,
        },
      });

      // Leg 2: Credit Escrow Custody Wallet (Liability to sub-merchants)
      await tx.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: order.id,
          accountName: 'PLATFORM_ESCROW_CUSTODY_WALLET',
          entryType: LedgerEntryType.CREDIT,
          amountPaise: netMerchantTotal,
          narration: `Custodial escrow lock for ${input.allocations.length} sub-merchant allocations on ${order.orderNumber}`,
        },
      });

      // Leg 3: Credit Platform Revenue (Marketplace Commission)
      await tx.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: order.id,
          accountName: 'PLATFORM_COMMISSION_REVENUE',
          entryType: LedgerEntryType.CREDIT,
          amountPaise: input.platformFeePaise,
          narration: `Platform routing & escrow fee for ${order.orderNumber}`,
        },
      });

      // Audit Log
      await tx.auditEvent.create({
        data: {
          entityType: 'ORDER',
          entityId: order.id,
          action: 'ORDER_CREATED_AND_FUNDED',
          actor: input.customerEmail,
          details: `Order ${order.orderNumber} created with total ₹${(input.totalAmountPaise / 100).toFixed(2)}, platform fee ₹${(input.platformFeePaise / 100).toFixed(2)}, and ${input.allocations.length} sub-merchant splits. Double-entry ledger balanced.`,
          orderId: order.id,
        },
      });

      return order;
    });
  }

  static async createMilestone(orderId: string, input: CreateMilestoneInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { milestones: true },
    });
    if (!order) throw new Error('Order not found');

    const milestoneCode = `MLS-${order.orderNumber.split('-')[2]}-0${order.milestones.length + 1}`;

    const milestone = await prisma.milestone.create({
      data: {
        milestoneCode,
        orderId,
        allocationId: input.allocationId || null,
        title: input.title,
        description: input.description,
        amountPaise: input.amountPaise,
        deliverableDue: input.deliverableDue ? new Date(input.deliverableDue) : null,
        status: MilestoneStatus.PENDING,
      },
    });

    await prisma.auditEvent.create({
      data: {
        entityType: 'MILESTONE',
        entityId: milestone.id,
        action: 'MILESTONE_CREATED',
        actor: 'user:compliance',
        details: `Milestone ${milestone.milestoneCode} added to order ${order.orderNumber} for ₹${(input.amountPaise / 100).toFixed(2)}.`,
        orderId,
      },
    });

    return milestone;
  }

  static async approveMilestone(
    orderId: string,
    milestoneId: string,
    input: ApproveMilestoneInput
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { milestones: true, allocations: true },
      });
      if (!order) throw new Error('Order not found');

      if (order.status !== OrderStatus.FUNDED && order.status !== OrderStatus.PARTIALLY_RELEASED) {
        throw new Error(
          `Invalid state transition: Cannot approve milestone on order with status ${order.status}. Order must be FUNDED or PARTIALLY_RELEASED.`
        );
      }

      const milestone = await tx.milestone.findUnique({
        where: { id: milestoneId },
      });
      if (!milestone) throw new Error('Milestone not found');

      if (milestone.status === MilestoneStatus.APPROVED || milestone.status === MilestoneStatus.DISBURSED) {
        throw new Error(`Milestone is already in status: ${milestone.status}. Duplicate approval prevented.`);
      }

      // Update milestone
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: input.approvedBy,
          approvalReason: input.approvalReason,
        },
      });

      // Check if all milestones are now approved/disbursed
      const allMilestones = await tx.milestone.findMany({ where: { orderId } });
      const areAllApproved = allMilestones.every(
        (m) => m.id === milestoneId || m.status === MilestoneStatus.APPROVED || m.status === MilestoneStatus.DISBURSED
      );

      const nextOrderStatus = areAllApproved
        ? OrderStatus.RELEASED
        : OrderStatus.PARTIALLY_RELEASED;

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextOrderStatus,
          ...(areAllApproved && { completedAt: new Date() }),
        },
      });

      // Audit event
      await tx.auditEvent.create({
        data: {
          entityType: 'MILESTONE',
          entityId: milestone.id,
          action: 'MILESTONE_APPROVED',
          actor: input.approvedBy,
          details: `Milestone ${milestone.milestoneCode} approved: ₹${(milestone.amountPaise / 100).toFixed(2)} unlocked for payout. Order status updated to ${nextOrderStatus}. Reason: ${input.approvalReason}`,
          orderId,
        },
      });

      return updatedMilestone;
    });
  }
}
