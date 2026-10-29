import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';

function restrictOrderToMerchant<
  T extends {
    allocations: { id: string; merchantId: string }[];
    milestones: { allocationId: string | null }[];
    payouts: { merchantId: string }[];
    ledgerEntries?: { merchantId: string | null }[];
  },
>(order: T, merchantId: string) {
  const allocations = order.allocations.filter((allocation) => allocation.merchantId === merchantId);
  const allocationIds = new Set(allocations.map((allocation) => allocation.id));

  return {
    ...order,
    allocations,
    milestones: order.milestones.filter(
      (milestone) => milestone.allocationId !== null && allocationIds.has(milestone.allocationId)
    ),
    payments: [],
    payouts: order.payouts.filter((payout) => payout.merchantId === merchantId),
    ledgerEntries: order.ledgerEntries?.filter((entry) => entry.merchantId === merchantId) ?? [],
    auditEvents: [],
  };
}

export class OrderController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const merchantId = req.user?.role === 'MERCHANT'
        ? (req.user.merchantId || '__NONE__')
        : (req.query.merchantId as string | undefined);

      const orders = await OrderService.getAllOrders({ status, search, merchantId });
      const merchantScopeId = req.user?.role === 'MERCHANT' ? req.user.merchantId : undefined;
      const merchantOrders = merchantScopeId
        ? orders.map((order) => restrictOrderToMerchant(order, merchantScopeId))
        : orders;
      res.json({ success: true, data: merchantOrders });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.role === 'MERCHANT' ? req.user.merchantId : undefined;
      if (req.user?.role === 'MERCHANT' && !merchantId) {
        res.status(403).json({
          success: false,
          error: 'Merchant account is not linked to a merchant profile.',
        });
        return;
      }

      const order = await OrderService.getOrderById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      if (merchantId) {
        const hasAllocation = order.allocations.some((a) => a.merchantId === merchantId);
        if (!hasAllocation) {
          res.status(403).json({
            success: false,
            error: 'Access denied: Sub-merchants cannot access external merchant orders.',
          });
          return;
        }
        res.json({
          success: true,
          data: restrictOrderToMerchant(order, merchantId),
        });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await OrderService.createOrder(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const milestone = await OrderService.createMilestone(req.params.id, req.body);
      res.status(201).json({ success: true, data: milestone });
    } catch (error) {
      next(error);
    }
  }

  static async approveMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user ? `${req.user.name} (${req.user.email})` : (req.body.approvedBy || 'admin@escrowhub.internal');
      const updated = await OrderService.approveMilestone(
        req.params.id,
        req.params.milestoneId,
        {
          ...req.body,
          approvedBy: actor,
        }
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
