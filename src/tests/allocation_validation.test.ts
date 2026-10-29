import request from 'supertest';
import { createTestApp } from './app.factory';

describe('Fintech Split Allocation & Financial Validation Tests', () => {
  const app = createTestApp();

  it('GET /api/health should return system status and paise monetary convention', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.monetaryConvention).toContain('Integer Paise');
  });

  it('GET /api/dashboard/summary should return aggregate metrics in integer paise', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toHaveProperty('totalPaymentVolumePaise');
    expect(res.body.data.metrics).toHaveProperty('totalAllocatedPaise');
    expect(res.body.data.metrics).toHaveProperty('totalAwaitingReleasePaise');
    expect(res.body.data.metrics).toHaveProperty('totalCompletedPayoutsPaise');
    expect(Array.isArray(res.body.data.volumeOverTime)).toBe(true);
  });

  it('POST /api/orders should reject orders where sum(allocations) + platformFee != totalAmount', async () => {
    const invalidOrder = {
      customerReference: 'CUST-TEST-MISMATCH',
      customerEmail: 'buyer@testcorp.com',
      description: 'Mismatched split test order',
      totalAmountPaise: 1000000, // ₹10,000.00
      platformFeePaise: 20000,   // ₹200.00
      allocations: [
        {
          merchantId: 'mer_blr_precision_01',
          splitType: 'PERCENTAGE',
          splitValue: 50,
          grossAmountPaise: 500000, // Only ₹5,000! 5,000 + 200 != 10,000
          merchantFeePaise: 10000,
          netAmountPaise: 490000,
        },
      ],
    };

    const res = await request(app).post('/api/orders').send(invalidOrder);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/orders should accept and fund orders with exact balanced split allocations', async () => {
    // 60,000 + 38,000 + 2,000 = 100,000 paise (₹1,000.00)
    const validOrder = {
      customerReference: `CUST-TEST-${Date.now()}`,
      customerEmail: 'procure@test-aerospace.com',
      description: 'Balanced Multi-Merchant Precision Components Lot',
      totalAmountPaise: 100000, // ₹1,000.00
      platformFeePaise: 2000,   // ₹20.00 (2%)
      allocations: [
        {
          merchantId: 'mer_blr_precision_01',
          splitType: 'PERCENTAGE',
          splitValue: 60,
          grossAmountPaise: 60000, // ₹600.00
          merchantFeePaise: 1225,  // 2% + ₹25 fixed fee
          netAmountPaise: 58775,
        },
        {
          merchantId: 'mer_pune_sensors_02',
          splitType: 'PERCENTAGE',
          splitValue: 38,
          grossAmountPaise: 38000, // ₹380.00
          merchantFeePaise: 790,
          netAmountPaise: 37210,
        },
      ],
    };

    const res = await request(app).post('/api/orders').send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAmountPaise).toBe(100000);
    expect(res.body.data.status).toBe('FUNDED');
  });
});
