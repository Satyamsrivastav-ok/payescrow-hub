import request from 'supertest';
import { createTestApp } from './app.factory';

describe('System Health & Architecture Diagnostics', () => {
  const app = createTestApp();

  it('GET /api/system/health should return stack manifest and database status', async () => {
    const res = await request(app).get('/api/system/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stack');
    expect(res.body.stack.backend).toContain('Express.js 4');
    expect(res.body.stack.database).toContain('PostgreSQL 16');
    expect(res.body.stack.database).toContain('Prisma ORM 6');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.provider).toBe('PostgreSQL');
    expect(res.body.database.orm).toBe('Prisma');
    expect(res.body.monetaryConvention).toContain('Integer Paise');
  });

  it('GET /api/system/metrics should return aggregate escrow analytics', async () => {
    const res = await request(app).get('/api/system/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalVolumePaise');
    expect(res.body.data).toHaveProperty('merchantsCount');
    expect(res.body.data).toHaveProperty('ordersCount');
  });
});
