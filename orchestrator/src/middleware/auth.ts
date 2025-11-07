import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { authService } from '../services/auth-service.js';
import type { JwtPayload } from '../types/user.js';

const log = pino();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
      requestId?: string;
    }
  }
}

/**
 * Authenticate middleware: verify JWT token in Authorization header
 * Expects: Authorization: Bearer <token>
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Missing Authorization header'
    });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid Authorization header format. Use: Bearer <token>'
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  const payload = authService.verifyToken(token);

  if (!payload) {
    log.debug({
      message: 'Token verification failed',
      requestId: req.requestId
    });
    res.status(401).json({
      error: 'invalid_token',
      message: 'Token is invalid or expired'
    });
    return;
  }

  // Attach decoded payload and token to request
  req.user = payload;
  req.token = token;

  log.debug({
    message: 'User authenticated',
    userId: payload.userId,
    requestId: req.requestId
  });

  next();
};

/**
 * Optional authentication middleware
 * Does not fail if token is missing, but verifies if present
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);

    if (payload) {
      req.user = payload;
      req.token = token;
    }
  }

  next();
};

/**
 * Verify token is still valid (for endpoints that need to check expiration)
 */
export const verifyTokenValid = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const payload = authService.verifyToken(req.token);
  if (!payload) {
    res.status(401).json({
      error: 'token_expired',
      message: 'Your session has expired. Please log in again.'
    });
    return;
  }

  next();
};
