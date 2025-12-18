import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request timing middleware with structured logging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const processTime = ((Date.now() - startTime) / 1000).toFixed(3);
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      processTime: `${processTime}s`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Request error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request', logData);
    }
  });

  next();
}

