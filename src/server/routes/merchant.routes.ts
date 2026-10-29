import { Router } from 'express';
import { MerchantController } from '../controllers/merchant.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { requireAdmin } from '../middlewares/auth.middleware.js';
import { CreateMerchantSchema, UpdateMerchantSchema } from '../schemas/index.js';

export const merchantRouter = Router();

merchantRouter.get('/', MerchantController.list);
merchantRouter.get('/:id', MerchantController.getById);

// Admin-only mutative operations
merchantRouter.post('/', requireAdmin, validateBody(CreateMerchantSchema), MerchantController.create);
merchantRouter.patch('/:id', requireAdmin, validateBody(UpdateMerchantSchema), MerchantController.update);
