import { Request, Response, NextFunction } from 'express';
import { PayoutService } from '../services/payout.service.js';

export class PayoutController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const merchantId = req.user?.role === 'MERCHANT'
        ? (req.user.merchantId || '__NONE__')
        : (req.query.merchantId as string | undefined);

      const payouts = await PayoutService.getAllPayouts({ status, merchantId });
      res.json({ success: true, data: payouts });
    } catch (error) {
      next(error);
    }
  }

  static async createForOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PayoutService.createPayout(req.params.id, req.body);
      res.status(result.isDuplicate ? 200 : 201).json({
        success: true,
        isIdempotentReplay: result.isDuplicate,
        data: result.payout,
      });
    } catch (error) {
      next(error);
    }
  }

  static async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const retried = await PayoutService.retryPayout(req.params.id);
      res.json({ success: true, data: retried });
    } catch (error) {
      next(error);
    }
  }
}
