-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('INITIATED', 'FUNDED_HELD', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_MERCHANT', 'RESOLVED_BUYER', 'RESOLVED_SPLIT');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'FAILED');

-- CreateTable
CREATE TABLE "sub_merchants" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "payoutBank" TEXT NOT NULL,
    "accountNumberLast4" TEXT NOT NULL,
    "routingNumber" TEXT NOT NULL,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "fixedFeeCents" INTEGER NOT NULL DEFAULT 30,
    "totalEscrowHeldCents" INTEGER NOT NULL DEFAULT 0,
    "totalDisbursedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grossAmountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "netMerchantCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "EscrowStatus" NOT NULL DEFAULT 'INITIATED',
    "holdUntil" TIMESTAMP(3),
    "milestoneTitle" TEXT,
    "deliveryTrackingNumber" TEXT,
    "fundedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceText" TEXT,
    "disputedAmountCents" INTEGER NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "buyerClaimNotes" TEXT,
    "merchantResponseNotes" TEXT,
    "arbitrationNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disbursement_batches" (
    "id" TEXT NOT NULL,
    "batchReference" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "payoutMethod" TEXT NOT NULL DEFAULT 'ACH',
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disbursement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sub_merchants_email_key" ON "sub_merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_referenceCode_key" ON "escrow_transactions"("referenceCode");

-- CreateIndex
CREATE INDEX "escrow_transactions_merchantId_idx" ON "escrow_transactions"("merchantId");

-- CreateIndex
CREATE INDEX "escrow_transactions_status_idx" ON "escrow_transactions"("status");

-- CreateIndex
CREATE INDEX "disputes_escrowId_idx" ON "disputes"("escrowId");

-- CreateIndex
CREATE UNIQUE INDEX "disbursement_batches_batchReference_key" ON "disbursement_batches"("batchReference");

-- CreateIndex
CREATE INDEX "disbursement_batches_merchantId_idx" ON "disbursement_batches"("merchantId");

-- CreateIndex
CREATE INDEX "audit_logs_escrowId_idx" ON "audit_logs"("escrowId");

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "sub_merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "escrow_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursement_batches" ADD CONSTRAINT "disbursement_batches_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "sub_merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "escrow_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
