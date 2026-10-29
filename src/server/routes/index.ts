import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { merchantRouter } from './merchant.routes.js';
import { orderRouter } from './order.routes.js';
import { payoutRouter } from './payout.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { transactionRouter } from './transaction.routes.js';
import { auditRouter } from './audit.routes.js';
import { systemRouter } from './system.routes.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const apiRouter = Router();

// Public Authentication endpoints
apiRouter.use('/auth', authRouter);

// Health & System Information
apiRouter.use('/system', systemRouter);
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sub-Merchant Payment Escrow Hub',
    timestamp: new Date().toISOString(),
    monetaryConvention: 'Integer Paise (100 paise = 1 INR)',
  });
});

// Authenticated Domain Routes
apiRouter.use('/dashboard', authenticate, dashboardRouter);
apiRouter.use('/merchants', authenticate, merchantRouter);
apiRouter.use('/orders', authenticate, orderRouter);
apiRouter.use('/payouts', authenticate, payoutRouter);
apiRouter.use('/transactions', authenticate, transactionRouter);
apiRouter.use('/audit-logs', authenticate, auditRouter);
