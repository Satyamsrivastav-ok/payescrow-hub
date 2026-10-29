import { Request, Response, NextFunction } from 'express';
import { MerchantService } from '../services/merchant.service.js';

export class MerchantController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      if (req.user?.role === 'MERCHANT') {
        if (!req.user.merchantId) {
          res.json({ success: true, data: [] });
          return;
        }
        const merchant = await MerchantService.getMerchantById(req.user.merchantId);
        res.json({ success: true, data: merchant ? [merchant] : [] });
        return;
      }

      const merchants = await MerchantService.getAllMerchants({ status, search });
      res.json({ success: true, data: merchants });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'MERCHANT' && req.user.merchantId !== req.params.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Sub-merchants cannot access external merchant records.',
        });
        return;
      }

      const merchant = await MerchantService.getMerchantById(req.params.id);
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      res.json({ success: true, data: merchant });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await MerchantService.createMerchant(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await MerchantService.updateMerchant(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
