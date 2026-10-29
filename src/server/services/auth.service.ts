import crypto from 'crypto';
import { prisma } from '../db/prisma.js';

const TOKEN_LIFETIME_SECONDS = 60 * 60;

export class AuthenticationError extends Error {}

export class InvalidCredentialsError extends AuthenticationError {}

export class DuplicateAccountError extends AuthenticationError {}

export class AuthenticationConfigurationError extends Error {}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MERCHANT' | 'OPERATOR';
  merchantId?: string | null;
  issuedAt: number;
  exp: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new AuthenticationConfigurationError(
      'JWT_SECRET must be configured with at least 32 characters.'
    );
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `pbkdf2$210000$${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    if (!combinedHash || !combinedHash.includes(':')) return false;
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const iterations = salt.startsWith('pbkdf2$') ? Number(salt.split('$')[1]) : 10000;
    const actualSalt = salt.startsWith('pbkdf2$') ? salt.split('$').slice(2).join('$') : salt;
    if (!Number.isSafeInteger(iterations) || iterations < 1 || !actualSalt) return false;
    const computed = crypto.pbkdf2Sync(password, actualSalt, iterations, 64, 'sha512');
    const expected = Buffer.from(originalHash, 'hex');
    return expected.length === computed.length && crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

export function createToken(
  payload: Omit<TokenPayload, 'exp' | 'issuedAt'>
): string {
  const issuedAt = Date.now();
  const fullPayload: TokenPayload = {
    ...payload,
    issuedAt,
    exp: Math.floor(issuedAt / 1000) + TOKEN_LIFETIME_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = getJwtSecret();
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest();
    const suppliedSig = Buffer.from(signature, 'base64url');
    if (
      suppliedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(suppliedSig, expectedSig)
    ) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;
    if (
      typeof payload.userId !== 'string' ||
      !Number.isSafeInteger(payload.issuedAt) ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      !['ADMIN', 'MERCHANT', 'OPERATOR'].includes(payload.role)
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export class AuthService {
  static async register(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    try {
      const user = await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash: hashPassword(input.password),
          role: 'MERCHANT',
        },
        select: { id: true, name: true, email: true, role: true, merchantId: true },
      });
      return user;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new DuplicateAccountError('An account with this email already exists.');
      }
      throw error;
    }
  }

  static async login(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { merchant: true },
    });

    if (!user) {
      throw new InvalidCredentialsError('Invalid email or password.');
    }

    // Verify password
    const valid = verifyPassword(pass, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError('Invalid email or password.');
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'MERCHANT' | 'OPERATOR',
      merchantId: user.merchantId,
    });

    // Record login audit
    await prisma.auditEvent.create({
      data: {
        entityType: 'USER',
        entityId: user.id,
        action: 'USER_LOGIN',
        actor: `user:${user.name} (${user.email})`,
        details: `Successful authenticated login session established for role ${user.role}.`,
        userId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
        merchant: user.merchant,
      },
      token,
    };
  }

  static async getSessionUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        merchantId: true,
        updatedAt: true,
        merchant: true,
      },
    });
  }

  static async logout(userId: string, issuedAt: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date(Math.max(Date.now(), issuedAt + 1)) },
    });
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { merchant: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      merchantId: user.merchantId,
      merchant: user.merchant,
    };
  }
}
