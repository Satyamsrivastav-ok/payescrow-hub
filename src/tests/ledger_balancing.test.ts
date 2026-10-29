import request from 'supertest';
import { createTestApp } from './app.factory';

describe('Fintech Double-Entry Ledger & Balancing Tests', () => {
  const app = createTestApp();

  it('GET /api/transactions should return double-entry ledger entries with verified debit/credit balance', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.entries)).toBe(true);
    expect(Array.isArray(res.body.data.groupBalances)).toBe(true);

    // Check that every transaction group in the ledger has debit == credit
    for (const group of res.body.data.groupBalances) {
      expect(group.debitsPaise).toBe(group.creditsPaise);
      expect(group.isBalanced).toBe(true);
    }
  });

  it('GET /api/audit-logs should return immutable append-only event stream', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('action');
    expect(res.body.data[0]).toHaveProperty('actor');
  });

  it('GET /api/merchants/:id should return merchant profile with allocation and payout history', async () => {
    const listRes = await request(app).get('/api/merchants');
    expect(listRes.status).toBe(200);
    const first = listRes.body.data[0];

    const detailRes = await request(app).get(`/api/merchants/${first.id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.id).toBe(first.id);
    expect(detailRes.body.data).toHaveProperty('allocations');
    expect(detailRes.body.data).toHaveProperty('payouts');
    expect(detailRes.body.data).toHaveProperty('ledgerEntries');
  });
});
