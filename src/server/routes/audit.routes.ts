import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';

export const auditRouter = Router();

auditRouter.get('/', requireAdmin, DashboardController.auditLogs);
