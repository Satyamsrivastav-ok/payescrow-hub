import { Router } from 'express';
import { PayoutController } from '../controllers/payout.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

export const payoutRouter = Router();

payoutRouter.get('/', PayoutController.list);
payoutRouter.post('/:id/retry', requireAdmin, PayoutController.retry);
