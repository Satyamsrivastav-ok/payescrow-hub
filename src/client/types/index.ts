export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type EscrowStatus =
  | 'INITIATED'
  | 'FUNDED_HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'CANCELLED';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_MERCHANT'
  | 'RESOLVED_BUYER'
  | 'RESOLVED_SPLIT';

export type DisbursementStatus = 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';

export interface SubMerchant {
  id: string;
  businessName: string;
  legalName: string;
  email: string;
  phone?: string | null;
  kycStatus: KycStatus;
  payoutBank: string;
  accountNumberLast4: string;
  routingNumber: string;
  feePercentage: number;
  fixedFeeCents: number;
  totalEscrowHeldCents: number;
  totalDisbursedCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowTransaction {
  id: string;
  referenceCode: string;
  merchantId: string;
  buyerEmail: string;
  buyerName: string;
  description: string;
  grossAmountCents: number;
  platformFeeCents: number;
  netMerchantCents: number;
  currency: string;
  status: EscrowStatus;
  holdUntil?: string | null;
  milestoneTitle?: string | null;
  deliveryTrackingNumber?: string | null;
  fundedAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  merchant?: SubMerchant | null;
  disputes?: Dispute[];
  auditLogs?: AuditLog[];
}

export interface Dispute {
  id: string;
  escrowId: string;
  reason: string;
  evidenceText?: string | null;
  disputedAmountCents: number;
  status: DisputeStatus;
  buyerClaimNotes?: string | null;
  merchantResponseNotes?: string | null;
  arbitrationNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  escrow?: EscrowTransaction;
}

export interface DisbursementBatch {
  id: string;
  batchReference: string;
  merchantId: string;
  totalAmountCents: number;
  payoutMethod: 'ACH' | 'WIRE' | 'INSTANT';
  status: DisbursementStatus;
  settledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  merchant?: SubMerchant | null;
}

export interface AuditLog {
  id: string;
  escrowId?: string | null;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export interface PlatformMetrics {
  totalGrossEscrowVolumeCents: number;
  totalHeldInCustodyCents: number;
  totalDisbursedToMerchantsCents: number;
  totalPlatformFeesCollectedCents: number;
  activeEscrowsCount: number;
  activeDisputesCount: number;
  verifiedMerchantsCount: number;
  totalMerchantsCount: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  timestamp: string;
  stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    testing: string[];
    deployment: string[];
  };
  database: {
    connected: boolean;
    provider: 'PostgreSQL';
    orm: 'Prisma';
    databaseUrlConfigured: boolean;
    latencyMs?: number;
    message: string;
  };
}
