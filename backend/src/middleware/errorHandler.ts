import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || err.status || 500;
  const message = config.isProduction && statusCode === 500
    ? 'Internal server error'
    : err.message;

  // Log error with context
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    ip: req.ip || req.socket.remoteAddress,
  });

  res.status(statusCode).json({
    detail: message,
    type: err.name || 'Error',
    ...(config.isDevelopment && { stack: err.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    detail: `Route ${req.method} ${req.path} not found`,
  });
}

