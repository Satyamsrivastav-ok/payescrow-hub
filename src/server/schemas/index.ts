import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must have at least 2 characters').max(100),
  email: z.string().trim().email('A valid email address is required').max(254),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
}).strict();

export const MerchantStatusEnum = z.enum(['ACTIVE', 'UNDER_REVIEW', 'SUSPENDED']);
export const OrderStatusEnum = z.enum([
  'CREATED',
  'PAYMENT_PENDING',
  'FUNDED',
  'PARTIALLY_RELEASED',
  'RELEASED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
]);
export const SplitTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT']);
export const MilestoneStatusEnum = z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED']);
export const PayoutStatusEnum = z.enum(['PENDING', 'IN_TRANSIT', 'PROCESSED', 'FAILED', 'CANCELLED']);

// Sub-Merchant Schemas
export const CreateMerchantSchema = z.object({
  businessName: z.string().min(2, 'Business name must have at least 2 characters').max(120),
  legalName: z.string().min(2, 'Legal entity name must have at least 2 characters').max(120),
  contactEmail: z.string().email('Valid business email is required'),
  contactPhone: z.string().optional(),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumberLast4: z.string().regex(/^\d{4}$/, 'Account last 4 must be exactly 4 digits'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Valid 11-character Indian IFSC code required (e.g. HDFC0001234)'),
  defaultCommissionBps: z.number().int().min(0).max(1000).default(200), // 2.00%
  fixedFeePaise: z.number().int().min(0).max(50000).default(2500),      // ₹25.00
});

export const UpdateMerchantSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  legalName: z.string().min(2).max(120).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  status: MerchantStatusEnum.optional(),
  bankName: z.string().optional(),
  accountNumberLast4: z.string().regex(/^\d{4}$/).optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  defaultCommissionBps: z.number().int().min(0).max(1000).optional(),
  fixedFeePaise: z.number().int().min(0).max(50000).optional(),
});

// Order Allocation Item Schema
export const AllocationInputSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  splitType: SplitTypeEnum.default('PERCENTAGE'),
  splitValue: z.number().positive('Split value must be positive'), // e.g. 60 (for 60%) or fixed paise
  grossAmountPaise: z.number().int().positive('Gross allocated amount in paise must be positive'),
  merchantFeePaise: z.number().int().nonnegative('Merchant fee in paise must be non-negative'),
  netAmountPaise: z.number().int().positive('Net amount in paise must be positive'),
});

// Order Creation Schema
export const CreateOrderSchema = z
  .object({
    customerReference: z.string().min(2, 'Customer reference is required'),
    customerEmail: z.string().email('Customer email is required'),
    description: z.string().min(3, 'Order description is required'),
    totalAmountPaise: z.number().int().positive('Total order amount must be positive in integer paise'),
    platformFeePaise: z.number().int().nonnegative('Platform fee must be non-negative integer paise'),
    allocations: z.array(AllocationInputSchema).min(1, 'Order must contain at least one sub-merchant allocation'),
  })
  .refine(
    (data) => {
      const sumAllocations = data.allocations.reduce((sum, a) => sum + a.grossAmountPaise, 0);
      return sumAllocations + data.platformFeePaise === data.totalAmountPaise;
    },
    {
      message: 'Financial validation failure: sum(allocations.grossAmountPaise) + platformFeePaise must exactly equal totalAmountPaise',
      path: ['allocations'],
    }
  );

// Milestone Creation Schema
export const CreateMilestoneSchema = z.object({
  allocationId: z.string().optional(),
  title: z.string().min(3, 'Milestone title is required'),
  description: z.string().min(5, 'Milestone description is required'),
  amountPaise: z.number().int().positive('Milestone unlock amount in paise must be positive'),
  deliverableDue: z.string().datetime().optional(),
});

// Milestone Approval Schema
export const ApproveMilestoneSchema = z.object({
  approvalReason: z.string().min(3, 'Detailed approval reason required for audit log').default('Milestone deliverable verified by compliance officer'),
  approvedBy: z.string().email('Approver email is required').default('chief.compliance@escrowhub.internal'),
});

// Payout Request Schema
export const CreatePayoutSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  allocationId: z.string().optional(),
  milestoneId: z.string().optional(),
  amountPaise: z.number().int().positive('Payout amount in paise must be positive'),
  payoutMethod: z.enum(['NEFT', 'RTGS', 'IMPS', 'UPI']).default('NEFT'),
  idempotencyKey: z.string().min(8, 'Idempotency key (minimum 8 characters) is required for duplicate prevention'),
});

export type CreateMerchantInput = z.infer<typeof CreateMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof UpdateMerchantSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type ApproveMilestoneInput = z.infer<typeof ApproveMilestoneSchema>;
export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;
