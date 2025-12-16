import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { getUserById } from '../services/userService';
import { User } from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        detail: 'Authentication required',
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.sub) {
      res.status(401).json({
        detail: 'Invalid or expired token',
      });
      return;
    }

    // Get user from database
    const user = await getUserById(payload.sub);
    if (!user) {
      res.status(401).json({
        detail: 'User not found',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      detail: 'Authentication failed',
    });
  }
}

