import { Request, Response, NextFunction } from 'express';

/**
 * Request timing middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log when response finishes (don't try to set headers)
  res.on('finish', () => {
    const processTime = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${processTime}s`);
  });

  next();
}

