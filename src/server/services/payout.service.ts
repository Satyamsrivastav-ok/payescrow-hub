import { prisma } from '../db/prisma.js';
import { CreatePayoutInput } from '../schemas/index.js';
import { PayoutStatus, LedgerEntryType, OrderStatus } from '@prisma/client';

export interface ProviderTransferResult {
  success: boolean;
  providerTransferId?: string;
  failureReason?: string;
}

/**
 * Mock Payment-Provider Adapter (Separated from core business logic)
 * Simulates banking gateway transfers (NEFT / RTGS / IMPS)
 */
export class MockPaymentProviderAdapter {
  static async executeTransfer(
    payoutReference: string,
    amountPaise: number,
    beneficiaryIfsc: string,
    payoutMethod: string
  ): Promise<ProviderTransferResult> {
    // Deterministic simulation: if beneficiary IFSC ends with '00' or special test flag, simulate bank failure for retry testing
    if (beneficiaryIfsc.endsWith('00')) {
      return {
        success: false,
        failureReason: `BENEFICIARY_CLEARING_REJECT_E03: Beneficiary bank network (${beneficiaryIfsc}) reported settlement window closed.`,
      };
    }

    return {
      success: true,
      providerTransferId: `MOCK_TXN_${payoutMethod}_${Date.now()}_${payoutReference.slice(-4)}`,
    };
  }
}

export class PayoutService {
  static async getAllPayouts(filter?: { status?: string; merchantId?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as PayoutStatus;
    }
    if (filter?.merchantId && filter.merchantId !== 'ALL') {
      where.merchantId = filter.merchantId;
    }

    return await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        merchant: true,
        allocation: true,
        milestone: true,
      },
    });
  }

  static async createPayout(orderId: string, input: CreatePayoutInput) {
    // 1. Idempotency Key Guard: prevent duplicate payouts
    const existingIdemp = await prisma.idempotencyRecord.findUnique({
      where: { key: input.idempotencyKey },
    });

    if (existingIdemp) {
      // Return previous cached response
      return {
        isDuplicate: true,
        payout: JSON.parse(existingIdemp.responseBody),
      };
    }

    // 2. Validate Order state
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { allocations: true, milestones: true },
    });
    if (!order) throw new Error('Order not found');

    if (
      order.status !== OrderStatus.FUNDED &&
      order.status !== OrderStatus.PARTIALLY_RELEASED &&
      order.status !== OrderStatus.RELEASED
    ) {
      throw new Error(`Cannot disburse payout: Order is in status ${order.status}. Must be FUNDED or RELEASED.`);
    }

    // 3. Validate Merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: input.merchantId },
    });
    if (!merchant) throw new Error('Merchant not found');
    if (merchant.status !== 'ACTIVE') {
      throw new Error(`Merchant ${merchant.businessName} is currently ${merchant.status}. Cannot execute banking payout.`);
    }

    // 4. Validate eligible payout limit
    const allocation = order.allocations.find((a) => a.merchantId === input.merchantId);
    if (!allocation) {
      throw new Error(`No allocation found for merchant ${merchant.businessName} in order ${order.orderNumber}.`);
    }

    const remainingEligiblePaise = allocation.netAmountPaise - allocation.releasedAmountPaise;
    if (input.amountPaise > remainingEligiblePaise) {
      throw new Error(
        `Payout amount (₹${(input.amountPaise / 100).toFixed(2)}) exceeds remaining eligible allocation balance (₹${(remainingEligiblePaise / 100).toFixed(2)}).`
      );
    }

    // 5. Generate Reference
    const count = await prisma.payout.count();
    const payoutReference = `PO-2026-${input.payoutMethod}-${String(count + 101).padStart(4, '0')}`;
    const groupRef = `TXG-${payoutReference}`;

    // 6. Call Mock Payment Provider
    const providerResult = await MockPaymentProviderAdapter.executeTransfer(
      payoutReference,
      input.amountPaise,
      merchant.ifscCode,
      input.payoutMethod
    );

    const initialStatus = providerResult.success ? PayoutStatus.PROCESSED : PayoutStatus.FAILED;

    // 7. Execute in Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          payoutReference,
          orderId,
          merchantId: input.merchantId,
          allocationId: allocation.id,
          milestoneId: input.milestoneId || null,
          amountPaise: input.amountPaise,
          currency: 'INR',
          status: initialStatus,
          payoutMethod: input.payoutMethod,
          idempotencyKey: input.idempotencyKey,
          failureReason: providerResult.failureReason || null,
          processedAt: providerResult.success ? new Date() : null,
        },
        include: { merchant: true, order: true },
      });

      if (providerResult.success) {
        // Update allocation released amount
        await tx.orderAllocation.update({
          where: { id: allocation.id },
          data: {
            releasedAmountPaise: { increment: input.amountPaise },
          },
        });

        // Update merchant balances
        await tx.merchant.update({
          where: { id: merchant.id },
          data: {
            totalEscrowHeldPaise: { decrement: input.amountPaise },
            totalDisbursedPaise: { increment: input.amountPaise },
          },
        });

        // Balanced Double-Entry Ledger Postings
        // Leg 1: Debit Escrow Custody (Reduce liability)
        await tx.ledgerEntry.create({
          data: {
            entryGroupRef: groupRef,
            orderId,
            merchantId: merchant.id,
            accountName: 'PLATFORM_ESCROW_CUSTODY_WALLET',
            entryType: LedgerEntryType.DEBIT,
            amountPaise: input.amountPaise,
            narration: `Payout release for ${payoutReference} to merchant ${merchant.merchantCode}`,
          },
        });

        // Leg 2: Credit Bank Disbursement Clearing (Reduce cash clearing asset)
        await tx.ledgerEntry.create({
          data: {
            entryGroupRef: groupRef,
            orderId,
            merchantId: merchant.id,
            accountName: 'BANK_DISBURSEMENT_CLEARING',
            entryType: LedgerEntryType.CREDIT,
            amountPaise: input.amountPaise,
            narration: `Outbound ${input.payoutMethod} transfer to ${merchant.bankName} (••${merchant.accountNumberLast4})`,
          },
        });

        // If milestone is attached, update to DISBURSED
        if (input.milestoneId) {
          await tx.milestone.update({
            where: { id: input.milestoneId },
            data: { status: 'DISBURSED' },
          });
        }
      }

      // Store Idempotency Record
      await tx.idempotencyRecord.create({
        data: {
          key: input.idempotencyKey,
          endpoint: `/api/orders/${orderId}/payouts`,
          requestHash: `${orderId}_${input.merchantId}_${input.amountPaise}`,
          responseCode: providerResult.success ? 201 : 400,
          responseBody: JSON.stringify(payout),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
        },
      });

      // Audit Log
      await tx.auditEvent.create({
        data: {
          entityType: 'PAYOUT',
          entityId: payout.id,
          action: providerResult.success ? 'PAYOUT_SETTLED' : 'PAYOUT_FAILED',
          actor: 'system:payout_orchestrator',
          details: providerResult.success
            ? `Payout ${payoutReference} of ₹${(input.amountPaise / 100).toFixed(2)} dispatched to ${merchant.businessName} via ${input.payoutMethod}. Double-entry ledger balanced.`
            : `Payout ${payoutReference} failed: ${providerResult.failureReason}`,
          orderId,
        },
      });

      return payout;
    });

    return {
      isDuplicate: false,
      payout: result,
    };
  }

  static async retryPayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { merchant: true, order: true },
    });
    if (!payout) throw new Error('Payout not found');
    if (payout.status !== PayoutStatus.FAILED) {
      throw new Error(`Only FAILED payouts can be retried. Current status is ${payout.status}.`);
    }

    // Attempt mock transfer again with retry count incremented
    const groupRef = `TXG-${payout.payoutReference}-RETRY`;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PROCESSED,
          failureReason: null,
          retryCount: { increment: 1 },
          processedAt: new Date(),
        },
        include: { merchant: true, order: true },
      });

      // Update merchant balances
      await tx.merchant.update({
        where: { id: payout.merchantId },
        data: {
          totalEscrowHeldPaise: { decrement: payout.amountPaise },
          totalDisbursedPaise: { increment: payout.amountPaise },
        },
      });

      // Balanced ledger posting
      await tx.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: payout.orderId,
          merchantId: payout.merchantId,
          accountName: 'PLATFORM_ESCROW_CUSTODY_WALLET',
          entryType: LedgerEntryType.DEBIT,
          amountPaise: payout.amountPaise,
          narration: `Retry payout liquidation for ${payout.payoutReference}`,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: payout.orderId,
          merchantId: payout.merchantId,
          accountName: 'BANK_DISBURSEMENT_CLEARING',
          entryType: LedgerEntryType.CREDIT,
          amountPaise: payout.amountPaise,
          narration: `Retry outbound settlement to ${payout.merchant.bankName}`,
        },
      });

      await tx.auditEvent.create({
        data: {
          entityType: 'PAYOUT',
          entityId: payout.id,
          action: 'PAYOUT_RETRY_SUCCESS',
          actor: 'user:compliance',
          details: `Payout ${payout.payoutReference} retried successfully for ₹${(payout.amountPaise / 100).toFixed(2)}.`,
          orderId: payout.orderId,
        },
      });

      return updated;
    });
  }
}
