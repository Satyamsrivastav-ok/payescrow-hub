import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.js';
import { loginRateLimit } from '../middlewares/loginRateLimit.js';
import { LoginSchema, RegisterSchema } from '../schemas/index.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(RegisterSchema), AuthController.register);
authRouter.post('/login', loginRateLimit, validateBody(LoginSchema), AuthController.login);
authRouter.get('/me', authenticate, AuthController.me);
authRouter.post('/logout', authenticate, AuthController.logout);
