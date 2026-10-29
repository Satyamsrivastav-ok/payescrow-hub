import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

export const systemRouter = Router();

systemRouter.get('/health', SystemController.health);
systemRouter.get('/metrics', SystemController.metrics);

// Administrative operations
systemRouter.post('/reset', authenticate, requireAdmin, SystemController.reset);
systemRouter.post('/seed', authenticate, requireAdmin, SystemController.seed);
