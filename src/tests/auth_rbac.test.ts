import crypto from 'crypto';
import request from 'supertest';

jest.mock('../server/db/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

import { createTestApp } from './app.factory';
import { prisma } from '../server/db/prisma';
import { createToken, hashPassword } from '../server/services/auth.service';

const app = createTestApp();
const jwtSecret = 'test-only-secret-that-is-long-enough-for-hmac-tests';

function createTestUser(overrides: Partial<{
  role: 'ADMIN' | 'MERCHANT' | 'OPERATOR';
  merchantId: string | null;
  updatedAt: Date;
  passwordHash: string;
}> = {}) {
  return {
    id: 'user-test-1',
    email: 'merchant@example.test',
    name: 'Test Merchant',
    role: overrides.role ?? 'MERCHANT',
    merchantId: overrides.merchantId ?? null,
    passwordHash: overrides.passwordHash ?? hashPassword('Correct-Horse-Battery-123'),
    createdAt: new Date(Date.now() - 10_000),
    updatedAt: overrides.updatedAt ?? new Date(Date.now() - 1_000),
    merchant: null,
  };
}

function expiredToken(): string {
  const body = Buffer.from(JSON.stringify({
    userId: 'user-test-1',
    email: 'merchant@example.test',
    name: 'Test Merchant',
    role: 'MERCHANT',
    merchantId: null,
    issuedAt: Date.now() - 3_600_000,
    exp: Math.floor(Date.now() / 1000) - 1,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', jwtSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

describe('Authentication and role isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  it('registers a least-privileged account, then signs in, restores, and signs out', async () => {
    const user = createTestUser();
    jest.mocked(prisma.user.create).mockResolvedValue({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'MERCHANT',
      merchantId: null,
    } as never);
    jest.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(user as never)
      .mockResolvedValueOnce(user as never)
      .mockResolvedValueOnce(user as never)
      .mockResolvedValueOnce(user as never)
      .mockResolvedValueOnce({ ...user, updatedAt: new Date(Date.now() + 10_000) } as never);
    jest.mocked(prisma.auditEvent.create).mockResolvedValue({} as never);
    jest.mocked(prisma.user.update).mockResolvedValue(user as never);

    const registration = await request(app).post('/api/auth/register').send({
      name: ' Test Merchant ',
      email: ' MERCHANT@EXAMPLE.TEST ',
      password: 'Correct-Horse-Battery-123',
    });

    expect(registration.status).toBe(201);
    expect(registration.body.data.user).toMatchObject({
      email: 'merchant@example.test',
      role: 'MERCHANT',
      merchantId: null,
    });
    expect(registration.body.data.user).not.toHaveProperty('passwordHash');
    expect(jest.mocked(prisma.user.create)).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'merchant@example.test',
        role: 'MERCHANT',
      }),
    }));

    const login = await request(app).post('/api/auth/login').send({
      email: 'merchant@example.test',
      password: 'Correct-Horse-Battery-123',
    });
    expect(login.status).toBe(200);
    const token = login.body.data.token as string;
    expect(typeof token).toBe('string');

    const restored = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(restored.status).toBe(200);
    expect(restored.body.data.user.email).toBe('merchant@example.test');

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);
    expect(jest.mocked(prisma.user.update)).toHaveBeenCalled();

    const revoked = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(401);
  });

  it('rejects attempts to register a privileged role', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Attempted Admin',
      email: 'admin@example.test',
      password: 'Correct-Horse-Battery-123',
      role: 'ADMIN',
    });

    expect(response.status).toBe(400);
    expect(jest.mocked(prisma.user.create)).not.toHaveBeenCalled();
  });

  it('returns a safe conflict response for duplicate email registrations', async () => {
    jest.mocked(prisma.user.create).mockRejectedValue({ code: 'P2002' });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Merchant',
      email: 'merchant@example.test',
      password: 'Correct-Horse-Battery-123',
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  it('returns 401 only for invalid credentials and 503 for database failures', async () => {
    jest.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('database connection unavailable'));

    const invalidCredentials = await request(app).post('/api/auth/login').send({
      email: 'missing@example.test',
      password: 'wrong-password',
    });
    expect(invalidCredentials.status).toBe(401);
    expect(invalidCredentials.body.error).toBe('Invalid email or password.');

    const databaseFailure = await request(app).post('/api/auth/login').send({
      email: 'merchant@example.test',
      password: 'Correct-Horse-Battery-123',
    });
    expect(databaseFailure.status).toBe(503);
    expect(databaseFailure.body.error).not.toBe('Invalid email or password.');
    expect(JSON.stringify(databaseFailure.body)).not.toContain('database connection unavailable');
  });

  it('rejects expired tokens and does not query the user record', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken()}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('expired');
    expect(jest.mocked(prisma.user.findUnique)).not.toHaveBeenCalled();
  });

  it('does not grant platform metrics, ledger, or audit access to an unlinked merchant', async () => {
    const user = createTestUser();
    jest.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'MERCHANT',
      merchantId: null,
    });

    for (const path of ['/api/dashboard/summary', '/api/transactions', '/api/audit-logs']) {
      const response = await request(app)
        .get(path)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(403);
    }
  });
});
