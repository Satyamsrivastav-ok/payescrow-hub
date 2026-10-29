import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../services/system.service.js';

export class SystemController {
  static async health(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await SystemService.getHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  }

  static async metrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await SystemService.getPlatformMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  static async reset(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SystemService.resetToEmpty();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async seed(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SystemService.seedDemoData();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
