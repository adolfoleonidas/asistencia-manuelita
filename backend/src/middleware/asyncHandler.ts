import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so that any rejected promise
 * is forwarded to the Express error handler via next(err).
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
