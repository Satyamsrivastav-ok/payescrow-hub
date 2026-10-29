import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { LedgerService } from '../services/ledger.service.js';
import { AuditService } from '../services/audit.service.js';

export class DashboardController {
  static async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.role === 'MERCHANT' ? req.user.merchantId : undefined;
      if (req.user?.role === 'MERCHANT') {
        if (!merchantId) {
          res.status(403).json({
            success: false,
            error: 'Merchant account is not linked to a merchant profile.',
          });
          return;
        }
        const summary = await DashboardService.getMerchantSummary(merchantId);
        res.json({ success: true, data: summary });
        return;
      }

      const summary = await DashboardService.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async transactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.role === 'MERCHANT' ? req.user.merchantId ?? undefined : undefined;
      if (req.user?.role === 'MERCHANT' && !merchantId) {
        res.status(403).json({
          success: false,
          error: 'Merchant account is not linked to a merchant profile.',
        });
        return;
      }
      const limit = Number(req.query.limit) || 100;
      const accountName = req.query.accountName as string | undefined;
      const ledger = await LedgerService.getAllTransactions(limit, accountName, merchantId);
      res.json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  }

  static async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role === 'MERCHANT') {
        res.status(403).json({
          success: false,
          error: 'Administrator privileges are required to view audit logs.',
        });
        return;
      }
      const entityType = req.query.entityType as string | undefined;
      const search = req.query.search as string | undefined;
      const logs = await AuditService.getAllAuditLogs({ entityType, search });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
