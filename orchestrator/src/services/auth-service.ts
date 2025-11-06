import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pino from 'pino';
import type { User, JwtPayload } from '../types/user.js';

const log = pino();

export class AuthService {
  private jwtSecret: string;
  private jwtExpiry = process.env.JWT_EXPIRY || '24h';
  private refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    this.jwtSecret = process.env.JWT_SECRET;
    
    // Validate JWT secret strength
    if (this.jwtSecret.length < 32) {
      log.error('JWT_SECRET is too short. Must be at least 32 characters for security.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
    }
    
    // Check for common weak secrets
    const weakSecrets = [
      'change-me-in-production',
      'my-super-secret-key',
      'secret',
      'password',
      '12345'
    ];
    
    const secretLower = this.jwtSecret.toLowerCase();
    if (weakSecrets.some(weak => secretLower.includes(weak))) {
      log.error('JWT_SECRET contains weak or default values');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET contains weak or default values. Please use a cryptographically secure random value.');
      }
    }
  }

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

    // Sign tokens - casting to any to work around strict type checking in @types/jsonwebtoken
    // The jwt library actually accepts string expiry formats like '24h' or '7d'
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry as any,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      {
        expiresIn: this.refreshExpiry as any,
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
      // Explicitly type the verify options
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['HS256']
      };

      const payload = jwt.verify(token, this.jwtSecret, verifyOptions);
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
    // Check for weak or default secrets
    const weakPatterns = [
      'change-me-in-production',
      'my-super-secret-key',
      'secret',
      'password',
      '12345',
      'test',
      'demo',
      'example'
    ];
    
    const secretLower = this.jwtSecret.toLowerCase();
    const hasWeakPattern = weakPatterns.some(pattern => secretLower.includes(pattern));
    
    if (hasWeakPattern) {
      log.error('❌ JWT_SECRET contains weak or default values!');
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
    }
    
    if (this.jwtSecret.length < 32) {
      log.error('❌ JWT_SECRET is too short (minimum 32 characters)!');
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
    }
    
    // Additional entropy check for production
    if (process.env.NODE_ENV === 'production') {
      // Check if secret has enough character variety
      const hasUpperCase = /[A-Z]/.test(this.jwtSecret);
      const hasLowerCase = /[a-z]/.test(this.jwtSecret);
      const hasNumbers = /\d/.test(this.jwtSecret);
      const hasSpecialChars = /[^A-Za-z0-9]/.test(this.jwtSecret);
      
      const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
      
      if (varietyCount < 3) {
        log.error('❌ JWT_SECRET lacks character variety (use mix of uppercase, lowercase, numbers, and special characters)');
        return false;
      }
    }
    
    return true;
  }
}

export const authService = new AuthService();
