import { describe, it, expect } from 'vitest';
import {
  QuirkTradeError,
  ProviderAPIError,
  VINDecodeError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  CacheError,
  DatabaseError,
  RateLimitError,
  NotFoundError,
  InsufficientQuotesError,
  isQuirkTradeError,
  formatErrorResponse,
} from '../../lib/errors';

describe('Custom Error Types', () => {
  describe('QuirkTradeError', () => {
    it('creates error with all properties', () => {
      const error = new QuirkTradeError(
        'TEST_ERROR',
        'Internal message',
        'User-friendly message',
        400
      );
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Internal message');
      expect(error.userMessage).toBe('User-friendly message');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('QuirkTradeError');
    });
    
    it('defaults to 500 status code', () => {
      const error = new QuirkTradeError(
        'TEST_ERROR',
        'Internal message',
        'User-friendly message'
      );
      
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ProviderAPIError', () => {
    it('creates provider error with availability info', () => {
      const error = new ProviderAPIError('BlackBook', 'Connection timeout', 5, 6);
      
      expect(error.code).toBe('PROVIDER_API_ERROR');
      expect(error.provider).toBe('BlackBook');
      expect(error.providersAvailable).toBe(5);
      expect(error.providersTotal).toBe(6);
      expect(error.statusCode).toBe(503);
      expect(error.userMessage).toContain('BlackBook');
      expect(error.userMessage).toContain('5 providers');
    });
    
    it('provides appropriate message when no providers available', () => {
      const error = new ProviderAPIError('KBB', 'API key invalid', 0, 6);
      
      expect(error.userMessage).toContain('temporarily unavailable');
      expect(error.userMessage).toContain('try again later');
    });
  });

  describe('VINDecodeError', () => {
    it('creates VIN decode error', () => {
      const error = new VINDecodeError('1HGCM82633A123456', 'Invalid checksum');
      
      expect(error.code).toBe('VIN_DECODE_ERROR');
      expect(error.vin).toBe('1HGCM82633A123456');
      expect(error.statusCode).toBe(400);
      expect(error.userMessage).toContain('1HGCM82633A123456');
      expect(error.userMessage).toContain('17-character VIN');
    });
  });

  describe('ValidationError', () => {
    it('creates validation error with field and value', () => {
      const error = new ValidationError('mileage', -1000, 'Must be non-negative');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('mileage');
      expect(error.value).toBe(-1000);
      expect(error.statusCode).toBe(400);
      expect(error.userMessage).toContain('mileage');
      expect(error.userMessage).toContain('Must be non-negative');
    });
  });

  describe('AuthenticationError', () => {
    it('creates authentication error', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.userMessage).toContain('logged in');
    });
    
    it('uses default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('AuthorizationError', () => {
    it('creates authorization error with required role', () => {
      const error = new AuthorizationError('Insufficient permissions', 'Admin');
      
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.requiredRole).toBe('Admin');
      expect(error.statusCode).toBe(403);
      expect(error.userMessage).toContain('Admin');
    });
    
    it('creates authorization error without role', () => {
      const error = new AuthorizationError();
      
      expect(error.requiredRole).toBeUndefined();
      expect(error.userMessage).toContain("don't have permission");
    });
  });

  describe('CacheError', () => {
    it('creates cache error with operation', () => {
      const error = new CacheError('get', 'Redis connection failed');
      
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.operation).toBe('get');
      expect(error.statusCode).toBe(500);
      expect(error.userMessage).toContain('caching issue');
    });
  });

  describe('DatabaseError', () => {
    it('creates database error', () => {
      const error = new DatabaseError('insert', 'Connection lost');
      
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.operation).toBe('insert');
      expect(error.statusCode).toBe(500);
      expect(error.userMessage).toContain('database error');
    });
  });

  describe('RateLimitError', () => {
    it('creates rate limit error with retry time', () => {
      const error = new RateLimitError(120);
      
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBe(120);
      expect(error.statusCode).toBe(429);
      expect(error.userMessage).toContain('120 seconds');
    });
    
    it('defaults to 60 seconds', () => {
      const error = new RateLimitError();
      
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('NotFoundError', () => {
    it('creates not found error', () => {
      const error = new NotFoundError('Valuation', 'val_123');
      
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.resource).toBe('Valuation');
      expect(error.id).toBe('val_123');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('InsufficientQuotesError', () => {
    it('creates insufficient quotes error', () => {
      const error = new InsufficientQuotesError(1, 3);
      
      expect(error.code).toBe('INSUFFICIENT_QUOTES_ERROR');
      expect(error.quotesReceived).toBe(1);
      expect(error.quotesRequired).toBe(3);
      expect(error.statusCode).toBe(503);
      expect(error.userMessage).toContain('1 provider');
    });
    
    it('handles plural correctly', () => {
      const error = new InsufficientQuotesError(2, 3);
      
      expect(error.userMessage).toContain('2 providers');
    });
    
    it('defaults to requiring 2 quotes', () => {
      const error = new InsufficientQuotesError(0);
      
      expect(error.quotesRequired).toBe(2);
    });
  });

  describe('isQuirkTradeError', () => {
    it('returns true for QuirkTradeError instances', () => {
      const error = new QuirkTradeError('TEST', 'msg', 'user msg');
      
      expect(isQuirkTradeError(error)).toBe(true);
    });
    
    it('returns true for subclass instances', () => {
      const error = new ValidationError('field', 'value', 'msg');
      
      expect(isQuirkTradeError(error)).toBe(true);
    });
    
    it('returns false for standard Error', () => {
      const error = new Error('Standard error');
      
      expect(isQuirkTradeError(error)).toBe(false);
    });
    
    it('returns false for non-error objects', () => {
      expect(isQuirkTradeError({})).toBe(false);
      expect(isQuirkTradeError('string')).toBe(false);
      expect(isQuirkTradeError(null)).toBe(false);
    });
  });

  describe('formatErrorResponse', () => {
    it('formats QuirkTradeError correctly', () => {
      const error = new QuirkTradeError('TEST_ERROR', 'Internal', 'User message', 400);
      const response = formatErrorResponse(error);
      
      expect(response.error).toBe('QuirkTradeError');
      expect(response.code).toBe('TEST_ERROR');
      expect(response.message).toBe('User message');
      expect(response.statusCode).toBe(400);
    });
    
    it('includes provider details for ProviderAPIError', () => {
      const error = new ProviderAPIError('BlackBook', 'timeout', 5, 6);
      const response = formatErrorResponse(error);
      
      expect(response.details?.provider).toBe('BlackBook');
      expect(response.details?.providersAvailable).toBe(5);
      expect(response.details?.providersTotal).toBe(6);
    });
    
    it('includes VIN for VINDecodeError', () => {
      const error = new VINDecodeError('1HGCM82633A123456', 'invalid');
      const response = formatErrorResponse(error);
      
      expect(response.details?.vin).toBe('1HGCM82633A123456');
    });
    
    it('includes field for ValidationError', () => {
      const error = new ValidationError('mileage', -1, 'negative');
      const response = formatErrorResponse(error);
      
      expect(response.details?.field).toBe('mileage');
    });
    
    it('includes retryAfter for RateLimitError', () => {
      const error = new RateLimitError(120);
      const response = formatErrorResponse(error);
      
      expect(response.details?.retryAfter).toBe(120);
    });
    
    it('includes resource and id for NotFoundError', () => {
      const error = new NotFoundError('User', 'user_123');
      const response = formatErrorResponse(error);
      
      expect(response.details?.resource).toBe('User');
      expect(response.details?.id).toBe('user_123');
    });
    
    it('includes quotes info for InsufficientQuotesError', () => {
      const error = new InsufficientQuotesError(1, 3);
      const response = formatErrorResponse(error);
      
      expect(response.details?.quotesReceived).toBe(1);
      expect(response.details?.quotesRequired).toBe(3);
    });
    
    it('handles generic errors with fallback', () => {
      const error = new Error('Generic error');
      const response = formatErrorResponse(error);
      
      expect(response.error).toBe('InternalServerError');
      expect(response.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.statusCode).toBe(500);
      expect(response.message).toContain('unexpected error');
    });
    
    it('handles non-error objects', () => {
      const response = formatErrorResponse('not an error');
      
      expect(response.error).toBe('InternalServerError');
      expect(response.statusCode).toBe(500);
    });
  });
});
