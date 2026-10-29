import request from 'supertest';
import { createTestApp } from './app.factory';

describe('Fintech Payouts, Idempotency & State Transition Tests', () => {
  const app = createTestApp();

  it('POST /api/orders/:id/payouts should reject payout amounts exceeding eligible allocation', async () => {
    // Find an active order
    const ordersRes = await request(app).get('/api/orders');
    expect(ordersRes.status).toBe(200);
    const order = ordersRes.body.data[0];

    const payload = {
      merchantId: order.allocations[0].merchantId,
      allocationId: order.allocations[0].id,
      amountPaise: 9999999999, // Exceeds allocation!
      payoutMethod: 'NEFT',
      idempotencyKey: `idemp_excess_${Date.now()}`,
    };

    const res = await request(app).post(`/api/orders/${order.id}/payouts`).send(payload);
    expect(res.status).toBe(500);
    expect(res.body.message).toContain('exceeds remaining eligible allocation');
  });

  it('POST /api/orders/:id/payouts should enforce idempotency and prevent duplicate payouts', async () => {
    // Fetch order with funded allocation
    const ordersRes = await request(app).get('/api/orders');
    const order = ordersRes.body.data.find(
      (o: { status: string; allocations: { netAmountPaise: number; releasedAmountPaise: number }[] }) =>
        o.status === 'FUNDED' && o.allocations[0].netAmountPaise > o.allocations[0].releasedAmountPaise
    );

    expect(order).toBeDefined();

    const uniqueIdempotencyKey = `idemp_test_safe_${Date.now()}`;
    const payload = {
      merchantId: order.allocations[0].merchantId,
      allocationId: order.allocations[0].id,
      amountPaise: 10000, // ₹100.00
      payoutMethod: 'NEFT',
      idempotencyKey: uniqueIdempotencyKey,
    };

    // First request
    const firstRes = await request(app)
      .post(`/api/orders/${order.id}/payouts`)
      .send(payload);
    expect(firstRes.status).toBe(201);
    expect(firstRes.body.isIdempotentReplay).toBe(false);

    // Duplicate request with the identical key
    const duplicateRes = await request(app)
      .post(`/api/orders/${order.id}/payouts`)
      .send(payload);
    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.isIdempotentReplay).toBe(true);
    expect(duplicateRes.body.data.payoutReference).toBe(firstRes.body.data.payoutReference);
  });

  it('POST /api/orders/:id/milestones/:milestoneId/approve should prevent duplicate milestone approval', async () => {
    const ordersRes = await request(app).get('/api/orders');
    const orderWithApproved = ordersRes.body.data.find(
      (o: { milestones: { status: string }[] }) =>
        o.milestones.some((m) => m.status === 'APPROVED' || m.status === 'DISBURSED')
    );

    if (orderWithApproved) {
      const approvedMilestone = orderWithApproved.milestones.find(
        (m: { status: string }) => m.status === 'APPROVED' || m.status === 'DISBURSED'
      );

      const res = await request(app)
        .post(`/api/orders/${orderWithApproved.id}/milestones/${approvedMilestone.id}/approve`)
        .send({ approvalReason: 'Duplicate attempt' });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/(already in status|Invalid state transition)/);
    }
  });
});
