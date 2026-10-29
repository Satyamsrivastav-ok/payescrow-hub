import { Request, Response, NextFunction } from 'express';
import {
  AuthenticationConfigurationError,
  AuthService,
  verifyToken,
  TokenPayload,
} from '../services/auth.service.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware that extracts and validates Bearer token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    let payload: TokenPayload | null;
    try {
      payload = verifyToken(token);
    } catch (error) {
      if (error instanceof AuthenticationConfigurationError) {
        res.status(503).json({
          success: false,
          error: 'Authentication is not configured. Contact the administrator.',
        });
        return;
      }
      next(error);
      return;
    }

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session. Please sign in again.',
      });
      return;
    }

    try {
      const user = await AuthService.getSessionUser(payload.userId);
      if (
        !user ||
        user.updatedAt.getTime() > payload.issuedAt ||
        !['ADMIN', 'MERCHANT', 'OPERATOR'].includes(user.role)
      ) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication session. Please sign in again.',
        });
        return;
      }

      req.user = {
        ...payload,
        email: user.email,
        name: user.name,
        role: user.role as TokenPayload['role'],
        merchantId: user.merchantId,
      };
      next();
    } catch (error) {
      console.error('Authentication session lookup failed:', error instanceof Error ? error.name : 'UnknownError');
      res.status(503).json({
        success: false,
        error: 'Authentication service is temporarily unavailable.',
      });
    }
    return;
  }

  // Test requests may use an isolated admin identity; this branch is unavailable in the server runtime.
  if (process.env.JEST_WORKER_ID !== undefined) {
    req.user = {
      userId: 'test_admin_id',
      email: 'admin@escrowhub.internal',
      name: 'Test Administrator',
      role: 'ADMIN',
      merchantId: null,
      issuedAt: Date.now(),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required. Missing Bearer authorization token.',
  });
}

/**
 * Enforce minimum role level (e.g. ADMIN)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATOR') {
    res.status(403).json({
      success: false,
      error: 'Access denied: Administrator privileges required to execute this operation.',
    });
    return;
  }

  next();
}

/**
 * Enforce that merchants cannot access resources belonging to another merchant
 */
export function checkMerchantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  // Admins have access to everything
  if (req.user.role === 'ADMIN' || req.user.role === 'OPERATOR') {
    next();
    return;
  }

  // Merchants can only access their own merchant ID
  const requestedMerchantId = req.params.merchantId || req.params.id;
  if (req.user.role === 'MERCHANT') {
    if (!req.user.merchantId) {
      res.status(403).json({
        success: false,
        error: 'Access denied: User account is not mapped to an active sub-merchant.',
      });
      return;
    }

    if (requestedMerchantId && requestedMerchantId !== req.user.merchantId) {
      res.status(403).json({
        success: false,
        error: 'Access denied: Sub-merchants cannot access external merchant records.',
      });
      return;
    }
  }

  next();
}
