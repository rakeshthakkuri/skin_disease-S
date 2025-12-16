import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string; // User ID
  exp?: number;
}

/**
 * Create a JWT access token
 */
export function createAccessToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
  };

  return jwt.sign(payload, config.secretKey, {
    algorithm: config.algorithm as jwt.Algorithm,
    expiresIn: config.accessTokenExpireMinutes * 60, // Convert minutes to seconds
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.secretKey, {
      algorithms: [config.algorithm as jwt.Algorithm],
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

