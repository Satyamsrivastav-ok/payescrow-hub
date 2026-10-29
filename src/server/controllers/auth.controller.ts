import { Request, Response, NextFunction } from 'express';
import {
  AuthService,
  AuthenticationConfigurationError,
  DuplicateAccountError,
  InvalidCredentialsError,
} from '../services/auth.service.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error instanceof DuplicateAccountError) {
        res.status(409).json({ success: false, error: 'An account with this email already exists.' });
        return;
      }

      console.error('Registration service unavailable:', error instanceof Error ? error.name : 'UnknownError');
      res.status(503).json({
        success: false,
        error: 'Registration is temporarily unavailable. Check the database configuration and try again.',
      });
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ success: false, error: 'Invalid email or password.' });
        return;
      }
      if (error instanceof AuthenticationConfigurationError) {
        res.status(503).json({
          success: false,
          error: 'Authentication is not configured. Contact the administrator.',
        });
        return;
      }

      console.error('Login service unavailable:', error instanceof Error ? error.name : 'UnknownError');
      res.status(503).json({
        success: false,
        error: 'Authentication service is temporarily unavailable. Check the database configuration and try again.',
      });
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const profile = await AuthService.getUserProfile(req.user.userId);
      if (!profile) {
        res.status(404).json({ success: false, error: 'User profile not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          user: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }
      await AuthService.logout(req.user.userId, req.user.issuedAt);
      res.json({
        success: true,
        message: 'All active sessions for this account have been invalidated.',
      });
    } catch (error) {
      next(error);
    }
  }
}
