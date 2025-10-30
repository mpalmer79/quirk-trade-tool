import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pino from 'pino';
import type { User, JwtPayload } from '../types/user.js';

const log = pino();

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
  private jwtExpiry = process.env.JWT_EXPIRY || '24h';
  private refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    } catch (error) {
      log.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      log.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      dealershipIds: user.dealershipIds
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      {
        expiresIn: this.refreshExpiry,
        algorithm: 'HS256'
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256']
      });
      return payload as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        log.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        log.debug('Invalid token');
      }
      return null;
    }
  }

  /**
   * Validate JWT secret is configured
   */
  validateConfiguration(): boolean {
    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'change-me-in-production') {
      log.error('❌ JWT_SECRET not configured for production!');
      return false;
    }
    return true;
  }
}

export const authService = new AuthService();
