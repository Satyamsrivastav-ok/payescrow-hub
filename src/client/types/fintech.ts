export type MerchantStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED';

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'FUNDED'
  | 'PARTIALLY_RELEASED'
  | 'RELEASED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type SplitType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type MilestoneStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED';

export type PayoutStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'PROCESSED'
  | 'FAILED'
  | 'CANCELLED';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Merchant {
  id: string;
  merchantCode: string;
  businessName: string;
  legalName: string;
  contactEmail: string;
  contactPhone?: string | null;
  status: MerchantStatus;
  bankName: string;
  accountNumberLast4: string;
  ifscCode: string;
  defaultCommissionBps: number;
  fixedFeePaise: number;
  totalEscrowHeldPaise: number;
  totalDisbursedPaise: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    allocations: number;
    payouts: number;
  };
}

export interface OrderAllocation {
  id: string;
  orderId: string;
  merchantId: string;
  splitType: SplitType;
  splitValue: number;
  grossAmountPaise: number;
  merchantFeePaise: number;
  netAmountPaise: number;
  releasedAmountPaise: number;
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
}

export interface Milestone {
  id: string;
  milestoneCode: string;
  orderId: string;
  allocationId?: string | null;
  title: string;
  description: string;
  deliverableDue?: string | null;
  amountPaise: number;
  status: MilestoneStatus;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentReference: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  providerReference?: string | null;
  capturedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  payoutReference: string;
  orderId: string;
  merchantId: string;
  allocationId?: string | null;
  milestoneId?: string | null;
  amountPaise: number;
  currency: string;
  status: PayoutStatus;
  payoutMethod: string;
  idempotencyKey: string;
  failureReason?: string | null;
  retryCount: number;
  initiatedAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
  order?: Order;
}

export interface LedgerEntry {
  id: string;
  entryGroupRef: string;
  orderId?: string | null;
  merchantId?: string | null;
  accountName: string;
  entryType: LedgerEntryType;
  amountPaise: number;
  narration: string;
  createdAt: string;
  order?: {
    orderNumber: string;
  };
  merchant?: {
    businessName: string;
    merchantCode: string;
  };
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  details: string;
  metadata?: string | null;
  orderId?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerReference: string;
  customerEmail: string;
  totalAmountPaise: number;
  platformFeePaise: number;
  currency: string;
  status: OrderStatus;
  description: string;
  fundedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  allocations: OrderAllocation[];
  milestones: Milestone[];
  payments: Payment[];
  payouts: Payout[];
  ledgerEntries?: LedgerEntry[];
  auditEvents?: AuditEvent[];
}

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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MERCHANT' | 'OPERATOR';
  merchantId?: string | null;
  merchant?: Merchant | null;
}
