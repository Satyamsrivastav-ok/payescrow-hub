import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes/index.js';
import { errorHandler } from '../server/middlewares/errorHandler.js';

export function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use(errorHandler);
  return app;
}
