/**
 * Comprehensive Fintech Seed Script for Sub-Merchant Payment Escrow Hub
 * Currency: INR in integer paise (100 paise = ₹1.00)
 * Requirements: >= 8 merchants, >= 20 orders, multi-party splits, balanced ledger, audit events
 */

import {
  PrismaClient,
  MerchantStatus,
  OrderStatus,
  SplitType,
  MilestoneStatus,
  PayoutStatus,
  LedgerEntryType,
  PaymentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Seeding Sub-Merchant Payment Escrow Hub database (INR integer paise)...');

  // Clear existing records in reverse dependency order
  await prisma.auditEvent.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderAllocation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create System Operators / Users
  const adminUser = await prisma.user.create({
    data: {
      id: 'usr_ops_lead_01',
      email: 'chief.compliance@escrowhub.internal',
      name: 'Aditi Sharma',
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      id: 'usr_settlement_ops_02',
      email: 'settlements.desk@escrowhub.internal',
      name: 'Vikram Sengupta',
      role: 'OPERATOR',
    },
  });

  // 2. Create at least 8 Synthetic Sub-Merchants
  const merchantsData = [
    {
      id: 'mer_blr_precision_01',
      merchantCode: 'MER-BLR-01',
      businessName: 'Bangalore Precision Tooling',
      legalName: 'Bangalore Precision Mechanics Pvt Ltd',
      contactEmail: 'accounts@blrprecision.in',
      contactPhone: '+91 98450 12345',
      status: MerchantStatus.ACTIVE,
      bankName: 'HDFC Bank',
      accountNumberLast4: '5541',
      ifscCode: 'HDFC0001234',
      defaultCommissionBps: 200, // 2.00%
      fixedFeePaise: 2500,       // ₹25.00
      totalEscrowHeldPaise: 48500000, // ₹4,85,000.00
      totalDisbursedPaise: 125000000, // ₹12,50,000.00
    },
    {
      id: 'mer_pune_sensors_02',
      merchantCode: 'MER-PUN-02',
      businessName: 'Pune IoT Industrial Sensors',
      legalName: 'Pune Sensor Systems LLP',
      contactEmail: 'finance@punesensors.co.in',
      contactPhone: '+91 98220 54321',
      status: MerchantStatus.ACTIVE,
      bankName: 'ICICI Bank',
      accountNumberLast4: '8820',
      ifscCode: 'ICIC0000456',
      defaultCommissionBps: 250, // 2.50%
      fixedFeePaise: 3000,       // ₹30.00
      totalEscrowHeldPaise: 32000000, // ₹3,20,000.00
      totalDisbursedPaise: 84000000,  // ₹8,40,000.00
    },
    {
      id: 'mer_hyd_robotics_03',
      merchantCode: 'MER-HYD-03',
      businessName: 'Deccan Robotics Solutions',
      legalName: 'Deccan Autonomous Systems Ltd',
      contactEmail: 'billing@deccanrobotics.com',
      contactPhone: '+91 99890 87654',
      status: MerchantStatus.ACTIVE,
      bankName: 'Axis Bank',
      accountNumberLast4: '3109',
      ifscCode: 'UTIB0000789',
      defaultCommissionBps: 180, // 1.80%
      fixedFeePaise: 2000,       // ₹20.00
      totalEscrowHeldPaise: 65000000, // ₹6,50,000.00
      totalDisbursedPaise: 95000000,  // ₹9,50,000.00
    },
    {
      id: 'mer_chn_castings_04',
      merchantCode: 'MER-CHN-04',
      businessName: 'Coromandel Castings & Alloys',
      legalName: 'Coromandel Heavy Metallurgicals Pvt Ltd',
      contactEmail: 'treasury@coromandelalloys.in',
      contactPhone: '+91 94440 99887',
      status: MerchantStatus.ACTIVE,
      bankName: 'State Bank of India',
      accountNumberLast4: '4192',
      ifscCode: 'SBIN0000800',
      defaultCommissionBps: 220, // 2.20%
      fixedFeePaise: 3500,       // ₹35.00
      totalEscrowHeldPaise: 21000000, // ₹2,10,000.00
      totalDisbursedPaise: 55000000,  // ₹5,50,000.00
    },
    {
      id: 'mer_del_circuits_05',
      merchantCode: 'MER-DEL-05',
      businessName: 'NCR Advanced Circuit Boards',
      legalName: 'NCR Microelectronics Fabrication Corp',
      contactEmail: 'settlements@ncrcircuits.in',
      contactPhone: '+91 98110 33445',
      status: MerchantStatus.ACTIVE,
      bankName: 'Kotak Mahindra Bank',
      accountNumberLast4: '7721',
      ifscCode: 'KKBK0000120',
      defaultCommissionBps: 250, // 2.50%
      fixedFeePaise: 3000,
      totalEscrowHeldPaise: 18000000,
      totalDisbursedPaise: 42000000,
    },
    {
      id: 'mer_mum_solar_06',
      merchantCode: 'MER-MUM-06',
      businessName: 'Sahyadri Photovoltaic Assemblies',
      legalName: 'Sahyadri Renewable Energetics LLP',
      contactEmail: 'accounts@sahyadrisolar.com',
      contactPhone: '+91 98200 66778',
      status: MerchantStatus.UNDER_REVIEW,
      bankName: 'Bank of Baroda',
      accountNumberLast4: '9012',
      ifscCode: 'BARB0MUMBAI',
      defaultCommissionBps: 300,
      fixedFeePaise: 5000,
      totalEscrowHeldPaise: 0,
      totalDisbursedPaise: 0,
    },
    {
      id: 'mer_koc_spices_07',
      merchantCode: 'MER-KOC-07',
      businessName: 'Malabar Export Agro Processing',
      legalName: 'Malabar Spices & Extracts Pvt Ltd',
      contactEmail: 'finance@malabaragro.org',
      contactPhone: '+91 98470 55667',
      status: MerchantStatus.ACTIVE,
      bankName: 'Federal Bank',
      accountNumberLast4: '1448',
      ifscCode: 'FDRL0001001',
      defaultCommissionBps: 150,
      fixedFeePaise: 1500,
      totalEscrowHeldPaise: 14000000,
      totalDisbursedPaise: 36000000,
    },
    {
      id: 'mer_jpr_textiles_08',
      merchantCode: 'MER-JPR-08',
      businessName: 'Rajputana Industrial Weaving',
      legalName: 'Rajputana Composite Yarns Ltd',
      contactEmail: 'payouts@rajputanatextiles.in',
      contactPhone: '+91 94140 11223',
      status: MerchantStatus.SUSPENDED,
      bankName: 'Punjab National Bank',
      accountNumberLast4: '6220',
      ifscCode: 'PUNB0024400',
      defaultCommissionBps: 250,
      fixedFeePaise: 3000,
      totalEscrowHeldPaise: 8500000,
      totalDisbursedPaise: 12000000,
    },
  ];

  const merchants = [];
  for (const m of merchantsData) {
    const created = await prisma.merchant.create({ data: m });
    merchants.push(created);
  }
  console.log(`✅ Seeded ${merchants.length} sub-merchants.`);

  // 3. Create at least 20 Realistic Marketplace Orders with Split Allocations
  // Let's create an array of order blueprints
  interface OrderBlueprint {
    orderNumber: string;
    customerReference: string;
    customerEmail: string;
    description: string;
    totalAmountPaise: number;
    platformFeePaise: number;
    status: OrderStatus;
    allocations: {
      merchantIndex: number;
      splitType: SplitType;
      splitValue: number;
      grossAmountPaise: number;
      merchantFeePaise: number;
      netAmountPaise: number;
      releasedAmountPaise: number;
    }[];
    milestones: {
      milestoneCode: string;
      title: string;
      description: string;
      amountPaise: number;
      status: MilestoneStatus;
      dueOffsetDays: number;
    }[];
    payments: {
      paymentReference: string;
      amountPaise: number;
      paymentMethod: string;
      status: PaymentStatus;
    }[];
    payouts?: {
      payoutReference: string;
      merchantIndex: number;
      amountPaise: number;
      status: PayoutStatus;
      payoutMethod: string;
      failureReason?: string;
    }[];
  }

  const orderBlueprints: OrderBlueprint[] = [
    // Order 1: Heavy Industrial Fabrication (Bangalore + Pune)
    {
      orderNumber: 'ORD-2026-1001',
      customerReference: 'CUST-AERO-IND-891',
      customerEmail: 'procurement@tata-aerospace.com',
      description: 'Titanium Hydraulic Flanges & IoT Pressure Sensor Kit',
      totalAmountPaise: 25000000, // ₹2,50,000.00
      platformFeePaise: 500000,   // ₹5,000.00 (2.0%)
      status: OrderStatus.FUNDED,
      allocations: [
        {
          merchantIndex: 0, // BLR Precision
          splitType: SplitType.PERCENTAGE,
          splitValue: 60,
          grossAmountPaise: 15000000, // ₹1,50,000
          merchantFeePaise: 302500,   // 2% + ₹25
          netAmountPaise: 14697500,
          releasedAmountPaise: 0,
        },
        {
          merchantIndex: 1, // Pune Sensors
          splitType: SplitType.PERCENTAGE,
          splitValue: 38,
          grossAmountPaise: 9500000,  // ₹95,000
          merchantFeePaise: 197500,
          netAmountPaise: 9302500,
          releasedAmountPaise: 0,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1001-01',
          title: 'Material Spectrometry & Tolerance Validation',
          description: 'Third-party QA certificate uploaded by Bangalore Precision.',
          amountPaise: 10000000,
          status: MilestoneStatus.APPROVED,
          dueOffsetDays: -2,
        },
        {
          milestoneCode: 'MLS-1001-02',
          title: 'IoT Sensor Calibration & Dispatch',
          description: 'Pune Sensors telemetry verification with serial tracker.',
          amountPaise: 14500000,
          status: MilestoneStatus.PENDING,
          dueOffsetDays: 5,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9001',
          amountPaise: 25000000,
          paymentMethod: 'RTGS_INBOUND',
          status: PaymentStatus.SUCCESS,
        },
      ],
    },
    // Order 2: Automated Assembly Line (Deccan Robotics + Coromandel)
    {
      orderNumber: 'ORD-2026-1002',
      customerReference: 'CUST-MAH-AUTO-410',
      customerEmail: 'supplier.desk@mahindra-heavy.in',
      description: 'Bipedal Robotic Arm & Heavy Cast Bed Assemblies',
      totalAmountPaise: 42000000, // ₹4,20,000.00
      platformFeePaise: 840000,   // ₹8,40,000.00 (2.0%)
      status: OrderStatus.PARTIALLY_RELEASED,
      allocations: [
        {
          merchantIndex: 2, // Deccan Robotics
          splitType: SplitType.PERCENTAGE,
          splitValue: 65,
          grossAmountPaise: 27300000,
          merchantFeePaise: 493400,
          netAmountPaise: 26806600,
          releasedAmountPaise: 13403300,
        },
        {
          merchantIndex: 3, // Coromandel Castings
          splitType: SplitType.PERCENTAGE,
          splitValue: 33,
          grossAmountPaise: 13860000,
          merchantFeePaise: 308420,
          netAmountPaise: 13551580,
          releasedAmountPaise: 0,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1002-01',
          title: 'Phase 1: Arm Kinematic Calibration',
          description: 'Factory acceptance test verified via video signoff.',
          amountPaise: 13403300,
          status: MilestoneStatus.DISBURSED,
          dueOffsetDays: -5,
        },
        {
          milestoneCode: 'MLS-1002-02',
          title: 'Phase 2: Heavy Bed Transit & Docking',
          description: 'Freight arrival at Pune manufacturing facility.',
          amountPaise: 26954880,
          status: MilestoneStatus.SUBMITTED,
          dueOffsetDays: 3,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9002',
          amountPaise: 42000000,
          paymentMethod: 'CORPORATE_NETBANKING',
          status: PaymentStatus.SUCCESS,
        },
      ],
      payouts: [
        {
          payoutReference: 'PO-2026-NEFT-1002A',
          merchantIndex: 2,
          amountPaise: 13403300,
          status: PayoutStatus.PROCESSED,
          payoutMethod: 'NEFT',
        },
      ],
    },
    // Order 3: Multi-Layer PCBs (NCR Circuits + Bangalore)
    {
      orderNumber: 'ORD-2026-1003',
      customerReference: 'CUST-BEL-DEF-091',
      customerEmail: 'orders@bharat-electronics.co.in',
      description: '8-Layer Rigid-Flex PCBs and Mounting Brackets',
      totalAmountPaise: 18000000, // ₹1,80,000.00
      platformFeePaise: 450000,
      status: OrderStatus.RELEASED,
      allocations: [
        {
          merchantIndex: 4, // NCR Circuits
          splitType: SplitType.PERCENTAGE,
          splitValue: 70,
          grossAmountPaise: 12600000,
          merchantFeePaise: 318000,
          netAmountPaise: 12282000,
          releasedAmountPaise: 12282000,
        },
        {
          merchantIndex: 0, // Bangalore Precision
          splitType: SplitType.PERCENTAGE,
          splitValue: 27.5,
          grossAmountPaise: 4950000,
          merchantFeePaise: 101500,
          netAmountPaise: 4848500,
          releasedAmountPaise: 4848500,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1003-01',
          title: 'Final Delivery & Thermal Stress Verification',
          description: 'Full batch cleared incoming inspection.',
          amountPaise: 17130500,
          status: MilestoneStatus.DISBURSED,
          dueOffsetDays: -10,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9003',
          amountPaise: 18000000,
          paymentMethod: 'IMPS',
          status: PaymentStatus.SUCCESS,
        },
      ],
      payouts: [
        {
          payoutReference: 'PO-2026-RTGS-1003A',
          merchantIndex: 4,
          amountPaise: 12282000,
          status: PayoutStatus.PROCESSED,
          payoutMethod: 'RTGS',
        },
        {
          payoutReference: 'PO-2026-NEFT-1003B',
          merchantIndex: 0,
          amountPaise: 4848500,
          status: PayoutStatus.PROCESSED,
          payoutMethod: 'NEFT',
        },
      ],
    },
    // Order 4: Agro Spice Extract Processing Equipment (Malabar Agro + Pune)
    {
      orderNumber: 'ORD-2026-1004',
      customerReference: 'CUST-ITC-FOODS-221',
      customerEmail: 'procure.spices@itc-agri.in',
      description: 'Supercritical Fluid Extraction Unit & Temp Controller',
      totalAmountPaise: 31500000, // ₹3,15,000.00
      platformFeePaise: 630000,
      status: OrderStatus.FUNDED,
      allocations: [
        {
          merchantIndex: 6, // Malabar Agro
          splitType: SplitType.PERCENTAGE,
          splitValue: 60,
          grossAmountPaise: 18900000,
          merchantFeePaise: 285000,
          netAmountPaise: 18615000,
          releasedAmountPaise: 0,
        },
        {
          merchantIndex: 1, // Pune Sensors
          splitType: SplitType.PERCENTAGE,
          splitValue: 38,
          grossAmountPaise: 11970000,
          merchantFeePaise: 302250,
          netAmountPaise: 11667750,
          releasedAmountPaise: 0,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1004-01',
          title: 'Extraction Vessel Hydrostatic Testing',
          description: 'Factory pressure test signoff at Kochi docks.',
          amountPaise: 15000000,
          status: MilestoneStatus.APPROVED,
          dueOffsetDays: 1,
        },
        {
          milestoneCode: 'MLS-1004-02',
          title: 'Installation and Trial Run at Guntur Facility',
          description: '72-hour continuous spice extraction run.',
          amountPaise: 15282750,
          status: MilestoneStatus.PENDING,
          dueOffsetDays: 14,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9004',
          amountPaise: 31500000,
          paymentMethod: 'RTGS_INBOUND',
          status: PaymentStatus.SUCCESS,
        },
      ],
      payouts: [
        {
          payoutReference: 'PO-2026-NEFT-1004A',
          merchantIndex: 6,
          amountPaise: 9000000,
          status: PayoutStatus.PENDING,
          payoutMethod: 'NEFT',
        },
      ],
    },
    // Order 5: High-Precision CNC Gearbox (Bangalore + Coromandel)
    {
      orderNumber: 'ORD-2026-1005',
      customerReference: 'CUST-LNT-HVY-551',
      customerEmail: 'gearbox.ops@larsen-toubro.com',
      description: 'Planetary Reduction Gearbox with Cast Iron Housing',
      totalAmountPaise: 54000000, // ₹5,40,000.00
      platformFeePaise: 1080000,
      status: OrderStatus.FUNDED,
      allocations: [
        {
          merchantIndex: 0,
          splitType: SplitType.PERCENTAGE,
          splitValue: 55,
          grossAmountPaise: 29700000,
          merchantFeePaise: 596500,
          netAmountPaise: 29103500,
          releasedAmountPaise: 0,
        },
        {
          merchantIndex: 3,
          splitType: SplitType.PERCENTAGE,
          splitValue: 43,
          grossAmountPaise: 23220000,
          merchantFeePaise: 514340,
          netAmountPaise: 22705660,
          releasedAmountPaise: 0,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1005-01',
          title: 'Gear Tooth Profile Metrology Verification',
          description: 'CMM inspection report with <5 micron tolerance.',
          amountPaise: 20000000,
          status: MilestoneStatus.PENDING,
          dueOffsetDays: 7,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9005',
          amountPaise: 54000000,
          paymentMethod: 'CORPORATE_NETBANKING',
          status: PaymentStatus.SUCCESS,
        },
      ],
    },
    // Order 6: Suspended Order with Payment Failure
    {
      orderNumber: 'ORD-2026-1006',
      customerReference: 'CUST-RELIANCE-PETRO-12',
      customerEmail: 'finance@reliance-petrochem.in',
      description: 'Explosion-Proof Telemetry Hub & Sensors',
      totalAmountPaise: 16500000,
      platformFeePaise: 330000,
      status: OrderStatus.PAYMENT_PENDING,
      allocations: [
        {
          merchantIndex: 1, // Pune Sensors
          splitType: SplitType.PERCENTAGE,
          splitValue: 98,
          grossAmountPaise: 16170000,
          merchantFeePaise: 407250,
          netAmountPaise: 15762750,
          releasedAmountPaise: 0,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1006-01',
          title: 'ATEX Zone 1 Certificate Verification',
          description: 'Bureau of Indian Standards verification.',
          amountPaise: 15762750,
          status: MilestoneStatus.PENDING,
          dueOffsetDays: 10,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9006',
          amountPaise: 16500000,
          paymentMethod: 'UPI_AUTOPAY',
          status: PaymentStatus.PENDING,
        },
      ],
    },
    // Order 7: Failed Payout Simulation for Retry Verification
    {
      orderNumber: 'ORD-2026-1007',
      customerReference: 'CUST-HERO-MOTO-77',
      customerEmail: 'ancillary@heromotocorp.in',
      description: 'High Tensile Engine Gaskets & Thermal Sensors',
      totalAmountPaise: 21000000,
      platformFeePaise: 420000,
      status: OrderStatus.PARTIALLY_RELEASED,
      allocations: [
        {
          merchantIndex: 7, // Rajputana (Suspended KYC)
          splitType: SplitType.PERCENTAGE,
          splitValue: 50,
          grossAmountPaise: 10500000,
          merchantFeePaise: 265500,
          netAmountPaise: 10234500,
          releasedAmountPaise: 0,
        },
        {
          merchantIndex: 1, // Pune
          splitType: SplitType.PERCENTAGE,
          splitValue: 48,
          grossAmountPaise: 10080000,
          merchantFeePaise: 255000,
          netAmountPaise: 9825000,
          releasedAmountPaise: 9825000,
        },
      ],
      milestones: [
        {
          milestoneCode: 'MLS-1007-01',
          title: 'Milestone 1: Batch 1 QC Clear',
          description: 'QC approved by Hero Moto QA officer.',
          amountPaise: 9825000,
          status: MilestoneStatus.DISBURSED,
          dueOffsetDays: -3,
        },
      ],
      payments: [
        {
          paymentReference: 'PAY-2026-9007',
          amountPaise: 21000000,
          paymentMethod: 'IMPS',
          status: PaymentStatus.SUCCESS,
        },
      ],
      payouts: [
        {
          payoutReference: 'PO-2026-IMPS-1007F',
          merchantIndex: 7,
          amountPaise: 10234500,
          status: PayoutStatus.FAILED,
          payoutMethod: 'IMPS',
          failureReason: 'BENEFICIARY_BANK_OFFLINE_ERR_504: Rajputana IFSC bank account temporarily frozen.',
        },
      ],
    },
    // Orders 8 to 20: Generating realistic diverse marketplace transactions
    ...Array.from({ length: 13 }, (_, i) => {
      const idx = i + 8;
      const m1Idx = (idx * 2) % merchantsData.length;
      const m2Idx = (idx * 2 + 1) % merchantsData.length;
      const total = (120000 + (idx * 24500)) * 100; // in paise
      const fee = Math.round(total * 0.022);
      const gross1 = Math.round((total - fee) * 0.55);
      const gross2 = (total - fee) - gross1;

      const isCompleted = idx % 3 === 0;
      const isFunded = !isCompleted && idx % 2 === 0;

      return {
        orderNumber: `ORD-2026-10${idx.toString().padStart(2, '0')}`,
        customerReference: `CUST-IND-B2B-${800 + idx}`,
        customerEmail: `procurement.dept${idx}@bharat-enterprises.org`,
        description: `B2B Lot #${idx}: Industrial Assembly Components & Tooling Modules`,
        totalAmountPaise: total,
        platformFeePaise: fee,
        status: isCompleted
          ? OrderStatus.RELEASED
          : isFunded
          ? OrderStatus.FUNDED
          : OrderStatus.CREATED,
        allocations: [
          {
            merchantIndex: m1Idx,
            splitType: SplitType.PERCENTAGE,
            splitValue: 55,
            grossAmountPaise: gross1,
            merchantFeePaise: Math.round(gross1 * 0.02),
            netAmountPaise: Math.round(gross1 * 0.98),
            releasedAmountPaise: isCompleted ? Math.round(gross1 * 0.98) : 0,
          },
          {
            merchantIndex: m2Idx,
            splitType: SplitType.PERCENTAGE,
            splitValue: 42.8,
            grossAmountPaise: gross2,
            merchantFeePaise: Math.round(gross2 * 0.02),
            netAmountPaise: Math.round(gross2 * 0.98),
            releasedAmountPaise: isCompleted ? Math.round(gross2 * 0.98) : 0,
          },
        ],
        milestones: [
          {
            milestoneCode: `MLS-10${idx}-01`,
            title: `Milestone 1: Stage A Factory Proof for Lot #${idx}`,
            description: 'Material certificates verified by independent lab.',
            amountPaise: Math.round(total * 0.5),
            status: isCompleted ? MilestoneStatus.DISBURSED : MilestoneStatus.PENDING,
            dueOffsetDays: isCompleted ? -4 : 6,
          },
        ],
        payments: [
          {
            paymentReference: `PAY-2026-90${idx}`,
            amountPaise: total,
            paymentMethod: 'RTGS_INBOUND',
            status: isCompleted || isFunded ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
          },
        ],
        payouts: isCompleted
          ? [
              {
                payoutReference: `PO-2026-NEFT-${idx}A`,
                merchantIndex: m1Idx,
                amountPaise: Math.round(gross1 * 0.98),
                status: PayoutStatus.PROCESSED,
                payoutMethod: 'NEFT',
              },
            ]
          : undefined,
      };
    }),
  ];

  let orderCount = 0;
  for (const b of orderBlueprints) {
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: b.orderNumber,
        customerReference: b.customerReference,
        customerEmail: b.customerEmail,
        description: b.description,
        totalAmountPaise: b.totalAmountPaise,
        platformFeePaise: b.platformFeePaise,
        currency: 'INR',
        status: b.status,
        fundedAt: b.status === OrderStatus.FUNDED || b.status === OrderStatus.RELEASED || b.status === OrderStatus.PARTIALLY_RELEASED ? new Date() : null,
        completedAt: b.status === OrderStatus.RELEASED ? new Date() : null,
      },
    });

    // Create Allocations
    for (const alloc of b.allocations) {
      const merchant = merchants[alloc.merchantIndex];
      const createdAlloc = await prisma.orderAllocation.create({
        data: {
          orderId: createdOrder.id,
          merchantId: merchant.id,
          splitType: alloc.splitType,
          splitValue: alloc.splitValue,
          grossAmountPaise: alloc.grossAmountPaise,
          merchantFeePaise: alloc.merchantFeePaise,
          netAmountPaise: alloc.netAmountPaise,
          releasedAmountPaise: alloc.releasedAmountPaise,
        },
      });

      // Create Milestones linked to order and allocation
      for (const ms of b.milestones) {
        await prisma.milestone.create({
          data: {
            milestoneCode: `${ms.milestoneCode}-${merchant.merchantCode}`,
            orderId: createdOrder.id,
            allocationId: createdAlloc.id,
            title: ms.title,
            description: ms.description,
            amountPaise: Math.round(alloc.netAmountPaise / b.milestones.length),
            status: ms.status,
            approvedAt: ms.status === MilestoneStatus.APPROVED || ms.status === MilestoneStatus.DISBURSED ? new Date() : null,
            approvedBy: ms.status === MilestoneStatus.APPROVED || ms.status === MilestoneStatus.DISBURSED ? adminUser.email : null,
            approvalReason: ms.status === MilestoneStatus.APPROVED || ms.status === MilestoneStatus.DISBURSED ? 'QC acceptance certificate verified by compliance officer.' : null,
          },
        });
      }
    }

    // Create Payment
    for (const p of b.payments) {
      await prisma.payment.create({
        data: {
          paymentReference: p.paymentReference,
          orderId: createdOrder.id,
          amountPaise: p.amountPaise,
          paymentMethod: p.paymentMethod,
          status: p.status,
          capturedAt: p.status === PaymentStatus.SUCCESS ? new Date() : null,
        },
      });
    }

    // Create Payouts if specified
    if (b.payouts) {
      for (const po of b.payouts) {
        const merchant = merchants[po.merchantIndex];
        await prisma.payout.create({
          data: {
            payoutReference: po.payoutReference,
            orderId: createdOrder.id,
            merchantId: merchant.id,
            amountPaise: po.amountPaise,
            status: po.status,
            payoutMethod: po.payoutMethod,
            idempotencyKey: `idemp_${po.payoutReference.toLowerCase()}`,
            failureReason: po.failureReason || null,
            processedAt: po.status === PayoutStatus.PROCESSED ? new Date() : null,
          },
        });
      }
    }

    // 4. Double-Entry Ledger Posting for Order Funds and Releases
    // If Order is FUNDED or RELEASED:
    // Debit: GATEWAY_SETTLEMENT_RECEIVABLE (totalAmountPaise)
    // Credit: PLATFORM_ESCROW_CUSTODY (netMerchantPaise)
    // Credit: PLATFORM_COMMISSION_REVENUE (platformFeePaise)
    if (b.status === OrderStatus.FUNDED || b.status === OrderStatus.PARTIALLY_RELEASED || b.status === OrderStatus.RELEASED) {
      const groupRef = `TXG-${b.orderNumber}`;
      const netMerchantTotal = b.totalAmountPaise - b.platformFeePaise;

      // Leg 1: Debit Gateway Clearing
      await prisma.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: createdOrder.id,
          accountName: 'GATEWAY_CLEARING_ACCOUNT',
          entryType: LedgerEntryType.DEBIT,
          amountPaise: b.totalAmountPaise,
          narration: `Buyer payment capture for ${b.orderNumber} via Inbound RTGS/UPI`,
        },
      });

      // Leg 2: Credit Escrow Custody
      await prisma.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: createdOrder.id,
          accountName: 'PLATFORM_ESCROW_CUSTODY_WALLET',
          entryType: LedgerEntryType.CREDIT,
          amountPaise: netMerchantTotal,
          narration: `Custodial hold for multi-merchant allocations on ${b.orderNumber}`,
        },
      });

      // Leg 3: Credit Platform Revenue
      await prisma.ledgerEntry.create({
        data: {
          entryGroupRef: groupRef,
          orderId: createdOrder.id,
          accountName: 'PLATFORM_COMMISSION_REVENUE',
          entryType: LedgerEntryType.CREDIT,
          amountPaise: b.platformFeePaise,
          narration: `Marketplace facilitation commission on order ${b.orderNumber}`,
        },
      });

      // If Released, post the payout liquidation:
      if (b.status === OrderStatus.RELEASED) {
        const releaseGroupRef = `TXG-${b.orderNumber}-REL`;
        await prisma.ledgerEntry.create({
          data: {
            entryGroupRef: releaseGroupRef,
            orderId: createdOrder.id,
            accountName: 'PLATFORM_ESCROW_CUSTODY_WALLET',
            entryType: LedgerEntryType.DEBIT,
            amountPaise: netMerchantTotal,
            narration: `Release of custodial hold upon final milestone acceptance for ${b.orderNumber}`,
          },
        });

        await prisma.ledgerEntry.create({
          data: {
            entryGroupRef: releaseGroupRef,
            orderId: createdOrder.id,
            accountName: 'BANK_DISBURSEMENT_CLEARING',
            entryType: LedgerEntryType.CREDIT,
            amountPaise: netMerchantTotal,
            narration: `Outbound NEFT/RTGS settlement to sub-merchants for ${b.orderNumber}`,
          },
        });
      }
    }

    // 5. Audit Log Event
    await prisma.auditEvent.create({
      data: {
        entityType: 'ORDER',
        entityId: createdOrder.id,
        action: 'ORDER_INITIALIZED_WITH_SPLITS',
        actor: adminUser.email,
        details: `Order ${b.orderNumber} initialized with ₹${(b.totalAmountPaise / 100).toFixed(2)} and ${b.allocations.length} merchant split allocations.`,
        orderId: createdOrder.id,
        userId: adminUser.id,
      },
    });

    orderCount++;
  }

  console.log(`✅ Seeded ${orderCount} orders with multi-party splits, milestones, payments, payouts, and balanced ledger entries.`);
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
