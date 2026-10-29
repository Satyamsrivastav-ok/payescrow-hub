import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = (err as { status?: number }).status || 500;
  console.error('Unhandled API Error:', err.name || 'UnknownError');
  res.status(status).json({
    success: false,
    error: status >= 500 ? 'InternalServerError' : err.name || 'RequestError',
    message: status >= 500
      ? 'An unexpected server error occurred.'
      : err.message || 'The request could not be processed.',
  });
}
