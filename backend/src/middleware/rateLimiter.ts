import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * Limits requests per IP address
 */
export function rateLimiter(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100 // 100 requests per window
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in development mode
    if (config.isDevelopment) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / windowMs)}`;

    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    if (store[key].count > maxRequests) {
      res.status(429).json({
        detail: 'Too many requests, please try again later',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Strict rate limiter for authentication endpoints
 * In development: disabled
 * In production: 5 requests per 15 minutes
 */
export const authRateLimiter = config.isDevelopment 
  ? (req: Request, res: Response, next: NextFunction) => next() // No rate limiting in dev
  : rateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes in production

/**
 * Standard rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

