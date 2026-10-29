import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';

export const transactionRouter = Router();

transactionRouter.get('/', DashboardController.transactions);
