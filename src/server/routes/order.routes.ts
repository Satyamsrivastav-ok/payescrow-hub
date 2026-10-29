import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { PayoutController } from '../controllers/payout.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import {
  CreateOrderSchema,
  CreateMilestoneSchema,
  ApproveMilestoneSchema,
  CreatePayoutSchema,
} from '../schemas/index.js';

export const orderRouter = Router();

orderRouter.get('/', OrderController.list);
orderRouter.get('/:id', OrderController.getById);

// Admin-only mutative operations
orderRouter.post('/', requireAdmin, validateBody(CreateOrderSchema), OrderController.create);
orderRouter.post('/:id/milestones', requireAdmin, validateBody(CreateMilestoneSchema), OrderController.createMilestone);
orderRouter.post('/:id/milestones/:milestoneId/approve', requireAdmin, validateBody(ApproveMilestoneSchema), OrderController.approveMilestone);
orderRouter.post('/:id/payouts', requireAdmin, validateBody(CreatePayoutSchema), PayoutController.createForOrder);
