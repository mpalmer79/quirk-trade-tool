# Complete Testing Implementation Guide
## Quirk Trade Tool - From 10% to 80% Coverage

**Target:** Increase test coverage from ~10% to 80%+  
**Estimated Effort:** 40-60 hours  
**Priority Order:** Critical business logic → API routes → Components → Utils

---

## 📋 Testing Strategy Overview

### Coverage Goals by Area

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| Backend Services | ~20% | 90% | **CRITICAL** |
| Backend Routes | ~10% | 85% | **CRITICAL** |
| Backend Middleware | 0% | 80% | HIGH |
| Frontend Components | ~15% | 75% | MEDIUM |
| Frontend Hooks | 0% | 80% | MEDIUM |
| Frontend Utils | 0% | 85% | HIGH |

---

## 🎯 Part 1: Backend Testing Strategy

### Step 1: Test Infrastructure Setup

#### Create Test Utilities

**File:** `orchestrator/src/__tests__/helpers/test-utils.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Create a mock Express request
 */
export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  ...overrides,
});

/**
 * Create a mock Express response
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create a mock Next function
 */
export const mockNext = (): NextFunction => vi.fn();

/**
 * Create a valid JWT token for testing
 */
export const createTestToken = (payload: any = {}): string => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@quirkcars.com',
    role: 'admin',
    dealerships: ['quirk-chevy-manchester'],
    ...payload,
  };
  
  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

/**
 * Create mock authenticated request
 */
export const mockAuthRequest = (
  overrides: Partial<Request> = {},
  userOverrides: any = {}
): Partial<Request> => {
  const token = createTestToken(userOverrides);
  return mockRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
    user: {
      userId: 'test-user-id',
      email: 'test@quirkcars.com',
      role: 'admin',
      dealerships: ['quirk-chevy-manchester'],
      ...userOverrides,
    },
    token,
    ...overrides,
  });
};

/**
 * Mock vehicle data for testing
 */
export const mockVehicleData = {
  base: {
    vin: '1HGCV41JXMN109186',
    year: 2020,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX',
    mileage: 45000,
  },
  highMileage: {
    vin: '2T1BURHE0JC123456',
    year: 2018,
    make: 'Toyota',
    model: 'Corolla',
    mileage: 125000,
  },
  newCar: {
    vin: '3VWDB7AJ0EM123456',
    year: 2024,
    make: 'Volkswagen',
    model: 'Jetta',
    mileage: 500,
  },
};

/**
 * Mock provider quotes for testing
 */
export const mockProviderQuotes = [
  { source: 'KBB', value: 22500, currency: 'USD' },
  { source: 'BlackBook', value: 22000, currency: 'USD' },
  { source: 'NADA', value: 22800, currency: 'USD' },
  { source: 'Manheim', value: 21500, currency: 'USD' },
];

/**
 * Wait for async operations to complete
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
```

---

### Step 2: Service Layer Tests (Critical Priority)

#### Example 1: Complete Valuation Service Tests

**File:** `orchestrator/src/__tests__/services/valuation-service.complete.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { valuationService } from '../../services/valuation-service';
import { depreciationCalculator } from '../../services/depreciation-calculator';
import * as cache from '../../lib/cache';
import { providers } from '../../providers';
import { mockVehicleData, mockProviderQuotes } from '../helpers/test-utils';

// Mock dependencies
vi.mock('../../lib/cache');
vi.mock('../../providers');

describe('ValuationService - Complete Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performValuation', () => {
    it('should return cached valuation when available', async () => {
      // Arrange
      const cachedResult = {
        id: 'VAL-123',
        baseWholesaleValue: 22000,
        finalWholesaleValue: 19800,
        _cached: true,
      };
      
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(cachedResult);

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      const result = await valuationService.performValuation(request);

      // Assert
      expect(cache.getValuationFromCache).toHaveBeenCalledWith(
        mockVehicleData.base.vin,
        3,
        45000
      );
      expect(result._cached).toBe(true);
      expect(result.id).toBe('VAL-123');
    });

    it('should fetch from providers when cache misses', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);
      vi.mocked(cache.cacheValuationResult).mockResolvedValue();

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      const result = await valuationService.performValuation(request);

      // Assert
      expect(result.quotes).toBeDefined();
      expect(result.quotes.length).toBeGreaterThan(0);
      expect(result.baseWholesaleValue).toBeGreaterThan(0);
      expect(result.finalWholesaleValue).toBeLessThanOrEqual(result.baseWholesaleValue);
    });

    it('should apply depreciation correctly based on condition', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);

      const requests = [
        { conditionRating: 5, expectedFactor: 1.0 },  // Excellent
        { conditionRating: 4, expectedFactor: 0.95 }, // Very Good
        { conditionRating: 3, expectedFactor: 0.9 },  // Good
        { conditionRating: 2, expectedFactor: 0.8 },  // Fair
        { conditionRating: 1, expectedFactor: 0.7 },  // Poor
      ];

      for (const { conditionRating, expectedFactor } of requests) {
        const request = {
          ...mockVehicleData.base,
          conditionRating,
          dealershipId: 'quirk-chevy-manchester',
        };

        // Act
        const result = await valuationService.performValuation(request);

        // Assert
        expect(result.depreciation.depreciationFactor).toBeCloseTo(expectedFactor, 2);
        expect(result.finalWholesaleValue).toBe(
          Math.round(result.baseWholesaleValue * expectedFactor)
        );
      }
    });

    it('should cache the result after calculation', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);
      vi.mocked(cache.cacheValuationResult).mockResolvedValue();

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      await valuationService.performValuation(request);

      // Assert
      expect(cache.cacheValuationResult).toHaveBeenCalledWith(
        mockVehicleData.base.vin,
        3,
        45000,
        expect.objectContaining({
          baseWholesaleValue: expect.any(Number),
          finalWholesaleValue: expect.any(Number),
        })
      );
    });

    it('should handle high mileage vehicles correctly', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);

      const request = {
        ...mockVehicleData.highMileage,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      const result = await valuationService.performValuation(request);

      // Assert
      expect(result.vehicle.mileage).toBe(125000);
      expect(result.baseWholesaleValue).toBeGreaterThan(0);
      // High mileage should result in lower values
      expect(result.baseWholesaleValue).toBeLessThan(25000);
    });

    it('should include all required fields in result', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      const result = await valuationService.performValuation(request);

      // Assert - Verify complete result structure
      expect(result).toMatchObject({
        id: expect.stringMatching(/^VAL-/),
        baseWholesaleValue: expect.any(Number),
        finalWholesaleValue: expect.any(Number),
        vehicle: {
          vin: mockVehicleData.base.vin,
          year: mockVehicleData.base.year,
          make: mockVehicleData.base.make,
          model: mockVehicleData.base.model,
          mileage: mockVehicleData.base.mileage,
        },
        dealership: {
          id: 'quirk-chevy-manchester',
        },
        timestamp: expect.any(String),
        depreciation: expect.objectContaining({
          depreciationFactor: expect.any(Number),
          finalWholesaleValue: expect.any(Number),
        }),
        quotes: expect.arrayContaining([
          expect.objectContaining({
            source: expect.any(String),
            value: expect.any(Number),
            currency: 'USD',
          }),
        ]),
      });
    });

    it('should handle cache errors gracefully', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockRejectedValue(
        new Error('Redis connection failed')
      );
      vi.mocked(cache.cacheValuationResult).mockRejectedValue(
        new Error('Redis connection failed')
      );

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act - Should not throw, should continue without cache
      const result = await valuationService.performValuation(request);

      // Assert
      expect(result.baseWholesaleValue).toBeGreaterThan(0);
      expect(result.finalWholesaleValue).toBeGreaterThan(0);
    });

    it('should generate unique valuation IDs', async () => {
      // Arrange
      vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);

      const request = {
        ...mockVehicleData.base,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester',
      };

      // Act
      const result1 = await valuationService.performValuation(request);
      const result2 = await valuationService.performValuation(request);

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^VAL-/);
      expect(result2.id).toMatch(/^VAL-/);
    });
  });

  describe('getValuationHistory', () => {
    it('should return valuation history for a VIN', async () => {
      // TODO: Implement once the method is complete
      const history = await valuationService.getValuationHistory(
        mockVehicleData.base.vin,
        30
      );
      
      expect(Array.isArray(history)).toBe(true);
      // Add more assertions when implemented
    });
  });

  describe('getModelStatistics', () => {
    it('should return statistics for a vehicle model', async () => {
      // TODO: Implement once the method is complete
      const stats = await valuationService.getModelStatistics(
        2020,
        'Honda',
        'Accord',
        30
      );

      expect(stats).toHaveProperty('totalAppraisals');
      expect(stats).toHaveProperty('averageValue');
      // Add more assertions when implemented
    });
  });
});
```

#### Example 2: Quote Aggregator Tests

**File:** `orchestrator/src/__tests__/aggregators/quote-aggregator.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { QuoteAggregator } from '../../aggregators/quote-aggregator';
import { mockProviderQuotes } from '../helpers/test-utils';

describe('QuoteAggregator', () => {
  let aggregator: QuoteAggregator;

  beforeEach(() => {
    aggregator = new QuoteAggregator();
  });

  describe('calculateAggregateValue', () => {
    it('should calculate trimmed mean correctly', () => {
      const quotes = [
        { source: 'A', value: 10000, currency: 'USD' },
        { source: 'B', value: 11000, currency: 'USD' },
        { source: 'C', value: 12000, currency: 'USD' },
        { source: 'D', value: 13000, currency: 'USD' },
        { source: 'E', value: 50000, currency: 'USD' }, // Outlier
      ];

      const result = aggregator.calculateAggregateValue(quotes);

      // Should exclude outlier and average the rest
      expect(result).toBeGreaterThan(10000);
      expect(result).toBeLessThan(15000);
    });

    it('should handle single quote', () => {
      const quotes = [{ source: 'A', value: 15000, currency: 'USD' }];
      const result = aggregator.calculateAggregateValue(quotes);
      expect(result).toBe(15000);
    });

    it('should handle empty quotes array', () => {
      const quotes: any[] = [];
      const result = aggregator.calculateAggregateValue(quotes);
      expect(result).toBe(0);
    });

    it('should handle all identical values', () => {
      const quotes = [
        { source: 'A', value: 20000, currency: 'USD' },
        { source: 'B', value: 20000, currency: 'USD' },
        { source: 'C', value: 20000, currency: 'USD' },
      ];

      const result = aggregator.calculateAggregateValue(quotes);
      expect(result).toBe(20000);
    });

    it('should exclude extreme outliers on both ends', () => {
      const quotes = [
        { source: 'A', value: 1000, currency: 'USD' },   // Low outlier
        { source: 'B', value: 20000, currency: 'USD' },
        { source: 'C', value: 21000, currency: 'USD' },
        { source: 'D', value: 22000, currency: 'USD' },
        { source: 'E', value: 100000, currency: 'USD' }, // High outlier
      ];

      const result = aggregator.calculateAggregateValue(quotes);

      // Should be close to 21000 (average of middle values)
      expect(result).toBeGreaterThan(19000);
      expect(result).toBeLessThan(23000);
    });

    it('should round result to nearest dollar', () => {
      const quotes = [
        { source: 'A', value: 20001, currency: 'USD' },
        { source: 'B', value: 20002, currency: 'USD' },
        { source: 'C', value: 20003, currency: 'USD' },
      ];

      const result = aggregator.calculateAggregateValue(quotes);
      expect(result).toBe(Math.round(result)); // Should be integer
    });
  });

  describe('fetchFromAllProviders', () => {
    it('should fetch quotes from multiple providers', async () => {
      const mockProviders = [
        {
          name: 'Provider1',
          quote: vi.fn().mockResolvedValue({ source: 'Provider1', value: 20000, currency: 'USD' }),
        },
        {
          name: 'Provider2',
          quote: vi.fn().mockResolvedValue({ source: 'Provider2', value: 21000, currency: 'USD' }),
        },
      ];

      const request = {
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        conditionRating: 3,
      };

      const quotes = await aggregator.fetchFromAllProviders(mockProviders, request);

      expect(quotes).toHaveLength(2);
      expect(mockProviders[0].quote).toHaveBeenCalledWith(request);
      expect(mockProviders[1].quote).toHaveBeenCalledWith(request);
    });

    it('should handle provider failures gracefully', async () => {
      const mockProviders = [
        {
          name: 'WorkingProvider',
          quote: vi.fn().mockResolvedValue({ source: 'Working', value: 20000, currency: 'USD' }),
        },
        {
          name: 'FailingProvider',
          quote: vi.fn().mockRejectedValue(new Error('API Error')),
        },
      ];

      const request = {
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        conditionRating: 3,
      };

      const quotes = await aggregator.fetchFromAllProviders(mockProviders, request);

      // Should return quote from working provider only
      expect(quotes).toHaveLength(1);
      expect(quotes[0].source).toBe('Working');
    });

    it('should fetch quotes in parallel for performance', async () => {
      const startTimes: number[] = [];
      const mockProviders = Array(5).fill(null).map((_, i) => ({
        name: `Provider${i}`,
        quote: vi.fn().mockImplementation(async () => {
          startTimes.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 100));
          return { source: `Provider${i}`, value: 20000, currency: 'USD' };
        }),
      }));

      const request = {
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        conditionRating: 3,
      };

      const startTime = Date.now();
      await aggregator.fetchFromAllProviders(mockProviders, request);
      const totalTime = Date.now() - startTime;

      // If parallel, should take ~100ms, not 500ms
      expect(totalTime).toBeLessThan(300);
    });
  });
});
```

---

### Step 3: API Route Tests

**File:** `orchestrator/src/__tests__/routes/auth.complete.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/auth';
import { authService } from '../../services/auth-service';

// Mock the auth service
vi.mock('../../services/auth-service');

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const mockToken = 'mock-jwt-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@quirkcars.com',
        role: 'admin',
        dealerships: ['quirk-chevy-manchester'],
      };

      vi.mocked(authService.login).mockResolvedValue({
        token: mockToken,
        user: mockUser,
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quirkcars.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: mockToken,
        user: mockUser,
      });
      expect(authService.login).toHaveBeenCalledWith(
        'test@quirkcars.com',
        'password123'
      );
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      vi.mocked(authService.login).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quirkcars.com',
          password: 'wrongpassword',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });

    it('should return 400 for missing password', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quirkcars.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('password');
    });

    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quirkcars.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Arrange
      const newToken = 'new-jwt-token';
      vi.mocked(authService.refreshToken).mockResolvedValue(newToken);

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: newToken,
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      vi.mocked(authService.refreshToken).mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('success');
    });
  });
});
```

---

### Step 4: Middleware Tests

**File:** `orchestrator/src/__tests__/middleware/auth.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { authService } from '../../services/auth-service';
import { mockRequest, mockResponse, mockNext, createTestToken } from '../helpers/test-utils';

vi.mock('../../services/auth-service');

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', () => {
      // Arrange
      const token = createTestToken();
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@quirkcars.com',
        role: 'admin',
      };

      vi.mocked(authService.verifyToken).mockReturnValue(mockPayload);

      // Act
      authenticate(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockPayload);
      expect(req.token).toBe(token);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      // Arrange
      const req = mockRequest({
        headers: {},
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      // Act
      authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'unauthorized',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'InvalidFormat token',
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      // Act
      authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'unauthorized',
        })
      );
    });

    it('should reject expired token', () => {
      // Arrange
      const token = createTestToken();
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      vi.mocked(authService.verifyToken).mockReturnValue(null);

      // Act
      authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'invalid_token',
        })
      );
    });

    it('should reject tampered token', () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'Bearer tampered.token.here',
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      vi.mocked(authService.verifyToken).mockReturnValue(null);

      // Act
      authenticate(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuthenticate', () => {
    it('should attach user if valid token provided', () => {
      // Arrange
      const token = createTestToken();
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@quirkcars.com',
        role: 'admin',
      };

      vi.mocked(authService.verifyToken).mockReturnValue(mockPayload);

      // Act
      optionalAuthenticate(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockPayload);
    });

    it('should continue without user if no token provided', () => {
      // Arrange
      const req = mockRequest({
        headers: {},
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      // Act
      optionalAuthenticate(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user if invalid token provided', () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      }) as any;
      const res = mockResponse() as any;
      const next = mockNext();

      vi.mocked(authService.verifyToken).mockReturnValue(null);

      // Act
      optionalAuthenticate(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
```

---

## 🎨 Part 2: Frontend Testing Strategy

### Step 1: Component Testing with React Testing Library

**File:** `frontend/app/components/__tests__/ValuationForm.complete.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationForm } from '../ValuationForm';
import { useForm } from 'react-hook-form';

// Mock NHTSA API
global.fetch = vi.fn();

describe('ValuationForm - Complete Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    const TestWrapper = () => {
      const methods = useForm({
        defaultValues: {
          storeId: 'quirk-chevy-manchester',
          condition: 3,
          options: [],
        },
      });

      return (
        <ValuationForm
          register={methods.register}
          errors={methods.formState.errors}
          isSubmitting={false}
          watch={methods.watch}
          setValue={methods.setValue}
          summary={null}
          {...props}
        />
      );
    };

    return render(<TestWrapper />);
  };

  describe('Form Rendering', () => {
    it('should render all required fields', () => {
      renderForm();

      expect(screen.getByLabelText(/Dealership Location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Make/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mileage/i)).toBeInTheDocument();
    });

    it('should render VIN decoder section', () => {
      renderForm();

      expect(screen.getByPlaceholderText(/1G1ZT62812F113456/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument();
    });

    it('should render condition slider with correct range', () => {
      renderForm();

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '5');
      expect(slider).toHaveAttribute('value', '3');
    });

    it('should render all vehicle options checkboxes', () => {
      renderForm();

      expect(screen.getByLabelText(/Navigation System/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sunroof/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Leather Seats/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Premium Sound/i)).toBeInTheDocument();
    });
  });

  describe('VIN Decoder', () => {
    it('should enable decode button when VIN is 17 characters', async () => {
      const user = userEvent.setup();
      renderForm();

      const vinInput = screen.getByPlaceholderText(/1G1ZT62812F113456/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // Initially disabled
      expect(decodeButton).toBeDisabled();

      // Type valid VIN
      await user.type(vinInput, '1HGCV41JXMN109186');

      // Should be enabled
      expect(decodeButton).not.toBeDisabled();
    });

    it('should decode VIN and populate fields on success', async () => {
      const user = userEvent.setup();
      
      // Mock successful NHTSA response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Results: [{
            ModelYear: '2020',
            Make: 'Honda',
            Model: 'Accord',
            Trim: 'EX',
          }],
        }),
      });

      renderForm();

      const vinInput = screen.getByPlaceholderText(/1G1ZT62812F113456/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      await user.type(vinInput, '1HGCV41JXMN109186');
      await user.click(decodeButton);

      // Wait for fields to populate
      await waitFor(() => {
        expect(screen.getByDisplayValue('2020')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Honda')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Accord')).toBeInTheDocument();
      });
    });

    it('should show error message on VIN decode failure', async () => {
      const user = userEvent.setup();
      
      // Mock failed NHTSA response
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      renderForm();

      const vinInput = screen.getByPlaceholderText(/1G1ZT62812F113456/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      await user.type(vinInput, '1HGCV41JXMN109186');
      await user.click(decodeButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/unable to decode/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid VIN format', async () => {
      const user = userEvent.setup();
      renderForm();

      const vinInput = screen.getByPlaceholderText(/1G1ZT62812F113456/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      await user.type(vinInput, 'INVALID-VIN');

      // Decode button should remain disabled for invalid length
      expect(decodeButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      
      const TestWrapperWithValidation = () => {
        const methods = useForm({
          mode: 'onBlur',
          defaultValues: {
            storeId: '',
            year: '',
            make: '',
            model: '',
            mileage: '',
            condition: 3,
          },
        });

        return (
          <form onSubmit={methods.handleSubmit(() => {})}>
            <ValuationForm
              register={methods.register}
              errors={methods.formState.errors}
              isSubmitting={false}
              watch={methods.watch}
              setValue={methods.setValue}
              summary={null}
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestWrapperWithValidation />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/year is required/i)).toBeInTheDocument();
        expect(screen.getByText(/make is required/i)).toBeInTheDocument();
        expect(screen.getByText(/model is required/i)).toBeInTheDocument();
      });
    });

    it('should validate year is within acceptable range', async () => {
      const user = userEvent.setup();
      renderForm();

      const yearInput = screen.getByLabelText(/year/i);

      // Test year too old
      await user.clear(yearInput);
      await user.type(yearInput, '1899');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid year/i)).toBeInTheDocument();
      });

      // Test year in future
      await user.clear(yearInput);
      await user.type(yearInput, '2030');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid year/i)).toBeInTheDocument();
      });
    });

    it('should validate mileage is positive', async () => {
      const user = userEvent.setup();
      renderForm();

      const mileageInput = screen.getByLabelText(/mileage/i);

      await user.clear(mileageInput);
      await user.type(mileageInput, '-1000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid mileage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Condition Slider', () => {
    it('should update condition description when slider moves', async () => {
      const user = userEvent.setup();
      renderForm();

      const slider = screen.getByRole('slider');

      // Initial state (Good)
      expect(screen.getByText(/Good - Normal wear/i)).toBeInTheDocument();

      // Move to Excellent
      await user.clear(slider);
      await user.type(slider, '5');

      await waitFor(() => {
        expect(screen.getByText(/Excellent - Like new/i)).toBeInTheDocument();
      });

      // Move to Poor
      await user.clear(slider);
      await user.type(slider, '1');

      await waitFor(() => {
        expect(screen.getByText(/Poor - Significant damage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Options Selection', () => {
    it('should toggle options checkboxes', async () => {
      const user = userEvent.setup();
      renderForm();

      const navCheckbox = screen.getByLabelText(/Navigation System/i);
      const leatherCheckbox = screen.getByLabelText(/Leather Seats/i);

      // Initially unchecked
      expect(navCheckbox).not.toBeChecked();
      expect(leatherCheckbox).not.toBeChecked();

      // Check both
      await user.click(navCheckbox);
      await user.click(leatherCheckbox);

      expect(navCheckbox).toBeChecked();
      expect(leatherCheckbox).toBeChecked();

      // Uncheck navigation
      await user.click(navCheckbox);

      expect(navCheckbox).not.toBeChecked();
      expect(leatherCheckbox).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while submitting', () => {
      renderForm({ isSubmitting: true });

      const submitButton = screen.getByRole('button', { name: /Get Wholesale Value/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during submission', () => {
      renderForm({ isSubmitting: true });

      expect(screen.getByText(/calculating/i)).toBeInTheDocument();
    });
  });

  describe('Depreciation Preview', () => {
    it('should show depreciation preview when summary exists', () => {
      const mockSummary = {
        base: 25000,
        low: 24000,
        high: 26000,
        avg: 25000,
        confidence: 'High' as const,
        depreciation: {
          depreciationFactor: 0.9,
          conditionRating: 3,
          finalWholesaleValue: 22500,
        },
      };

      renderForm({ summary: mockSummary });

      expect(screen.getByText(/Estimated Impact on Wholesale Value/i)).toBeInTheDocument();
      expect(screen.getByText(/\$22,500/)).toBeInTheDocument();
    });

    it('should hide depreciation preview when no summary', () => {
      renderForm({ summary: null });

      expect(screen.queryByText(/Estimated Impact on Wholesale Value/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderForm();

      expect(screen.getByRole('textbox', { name: /year/i })).toHaveAccessibleName();
      expect(screen.getByRole('textbox', { name: /make/i })).toHaveAccessibleName();
      expect(screen.getByRole('slider')).toHaveAccessibleName();
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      
      const TestWrapperWithValidation = () => {
        const methods = useForm({ mode: 'onBlur' });
        return (
          <form onSubmit={methods.handleSubmit(() => {})}>
            <ValuationForm
              register={methods.register}
              errors={methods.formState.errors}
              isSubmitting={false}
              watch={methods.watch}
              setValue={methods.setValue}
              summary={null}
            />
          </form>
        );
      };

      render(<TestWrapperWithValidation />);

      const yearInput = screen.getByLabelText(/year/i);
      await user.clear(yearInput);
      await user.tab();

      await waitFor(() => {
        const errorId = yearInput.getAttribute('aria-describedby');
        expect(errorId).toBeTruthy();
        const errorMessage = document.getElementById(errorId!);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
```

---

### Step 2: Custom Hooks Testing

**File:** `frontend/hooks/__tests__/useVehicleData.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVehicleData } from '../useVehicleData';

// Mock fetch
global.fetch = vi.fn();

describe('useVehicleData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch vehicle data successfully', async () => {
    // Arrange
    const mockData = {
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    // Act
    const { result } = renderHook(() => useVehicleData('1HGCV41JXMN109186'));

    // Assert - Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    // Arrange
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // Act
    const { result } = renderHook(() => useVehicleData('INVALID_VIN'));

    // Wait for error state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('Network error');
  });

  it('should cache results for same VIN', async () => {
    // Arrange
    const mockData = { year: 2020, make: 'Honda', model: 'Accord' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    // Act - First call
    const { result: result1 } = renderHook(() => useVehicleData('1HGCV41JXMN109186'));
    await waitFor(() => expect(result1.current.loading).toBe(false));

    // Act - Second call with same VIN
    const { result: result2 } = renderHook(() => useVehicleData('1HGCV41JXMN109186'));
    await waitFor(() => expect(result2.current.loading).toBe(false));

    // Assert - Should only fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(mockData);
  });

  it('should refetch when VIN changes', async () => {
    // Arrange
    const mockData1 = { year: 2020, make: 'Honda', model: 'Accord' };
    const mockData2 = { year: 2019, make: 'Toyota', model: 'Camry' };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockData1 })
      .mockResolvedValueOnce({ ok: true, json: async () => mockData2 });

    // Act
    const { result, rerender } = renderHook(
      ({ vin }) => useVehicleData(vin),
      { initialProps: { vin: '1HGCV41JXMN109186' } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData1);

    // Change VIN
    rerender({ vin: '2T1BURHE0JC123456' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not fetch with empty VIN', async () => {
    // Act
    const { result } = renderHook(() => useVehicleData(''));

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

---

## 📝 Part 3: Integration Tests

**File:** `orchestrator/src/__tests__/integration/valuation-flow.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { createTestToken } from '../helpers/test-utils';

describe('Valuation Flow - Integration Test', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = createTestToken({
      userId: 'test-user',
      role: 'admin',
      dealerships: ['quirk-chevy-manchester'],
    });
  });

  it('should complete full valuation flow', async () => {
    // Step 1: Decode VIN
    const vinResponse = await request(app)
      .post('/api/vin')
      .send({ vin: '1HGCV41JXMN109186' })
      .expect(200);

    expect(vinResponse.body).toHaveProperty('year');
    expect(vinResponse.body).toHaveProperty('make');
    expect(vinResponse.body).toHaveProperty('model');

    // Step 2: Get valuation
    const valuationResponse = await request(app)
      .post('/api/valuations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vin: '1HGCV41JXMN109186',
        year: vinResponse.body.year,
        make: vinResponse.body.make,
        model: vinResponse.body.model,
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      })
      .expect(200);

    expect(valuationResponse.body).toHaveProperty('id');
    expect(valuationResponse.body).toHaveProperty('baseWholesaleValue');
    expect(valuationResponse.body).toHaveProperty('finalWholesaleValue');
    expect(valuationResponse.body.quotes.length).toBeGreaterThan(0);

    const valuationId = valuationResponse.body.id;

    // Step 3: Get valuation history
    const historyResponse = await request(app)
      .get(`/api/valuations/${valuationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(historyResponse.body.id).toBe(valuationId);

    // Step 4: Generate PDF receipt
    const pdfResponse = await request(app)
      .post(`/api/receipt/${valuationId}/pdf`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(pdfResponse.headers['content-type']).toContain('pdf');
  });

  it('should reject unauthorized valuation requests', async () => {
    await request(app)
      .post('/api/valuations')
      .send({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      })
      .expect(401);
  });

  it('should enforce permission-based access', async () => {
    const salesManagerToken = createTestToken({
      userId: 'sales-manager',
      role: 'sales_manager',
      dealerships: ['quirk-ford-salem'],
    });

    // Try to access different dealership's data
    await request(app)
      .post('/api/valuations')
      .set('Authorization', `Bearer ${salesManagerToken}`)
      .send({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester', // Different dealership
      })
      .expect(403);
  });
});
```

---

## 🚀 Implementation Plan

### Week 1: Backend Foundation (16 hours)
- [ ] Set up test utilities and helpers (2 hours)
- [ ] Write service layer tests (6 hours)
  - ValuationService complete tests
  - DepreciationCalculator edge cases
  - AuthService tests
- [ ] Write middleware tests (4 hours)
  - Auth middleware
  - Error handler
  - Validation middleware
- [ ] Write aggregator tests (4 hours)

### Week 2: Backend Routes & Integration (16 hours)
- [ ] Write route tests (8 hours)
  - Auth routes
  - Valuation routes
  - VIN routes
  - Receipt routes
- [ ] Write integration tests (6 hours)
  - End-to-end flows
  - Permission enforcement
- [ ] Set up coverage reporting (2 hours)

### Week 3: Frontend Components (16 hours)
- [ ] Write component tests (10 hours)
  - ValuationForm complete tests
  - ResultsSection tests
  - AdminNav tests
  - UserList tests
- [ ] Write hook tests (4 hours)
  - useVehicleData
  - usedVehicleListings
- [ ] Write utility tests (2 hours)

### Week 4: Refinement & Documentation (12 hours)
- [ ] Increase coverage to 80%+ (6 hours)
- [ ] Add E2E tests with Playwright (4 hours)
- [ ] Update testing documentation (2 hours)

---

## 📈 Coverage Tracking

### Commands to Run

```bash
# Backend coverage
cd orchestrator
pnpm test:coverage

# Frontend coverage
cd frontend
pnpm test:coverage

# View coverage reports
open orchestrator/coverage/index.html
open frontend/coverage/index.html
```

### Target Metrics

**Backend:**
- Statements: 85%+
- Branches: 80%+
- Functions: 90%+
- Lines: 85%+

**Frontend:**
- Statements: 75%+
- Branches: 70%+
- Functions: 75%+
- Lines: 75%+

---

## 🎓 Testing Best Practices

### 1. Follow AAA Pattern
```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = { value: 10 };
  
  // Act - Execute the code
  const result = myFunction(input);
  
  // Assert - Verify the result
  expect(result).toBe(20);
});
```

### 2. Test Behavior, Not Implementation
```typescript
// ❌ BAD - Testing implementation details
it('should call internalMethod', () => {
  expect(component.internalMethod).toHaveBeenCalled();
});

// ✅ GOOD - Testing user-visible behavior
it('should display error message when form is invalid', () => {
  expect(screen.getByText('Error: Required field')).toBeInTheDocument();
});
```

### 3. Use Descriptive Test Names
```typescript
// ❌ BAD
it('test 1', () => { ... });

// ✅ GOOD
it('should return 401 when authentication token is missing', () => { ... });
```

### 4. Keep Tests Independent
```typescript
// ❌ BAD - Tests depend on each other
let sharedState: any;

it('test 1', () => {
  sharedState = { value: 10 };
});

it('test 2', () => {
  expect(sharedState.value).toBe(10); // Depends on test 1
});

// ✅ GOOD - Each test is independent
it('test 1', () => {
  const state = { value: 10 };
  expect(state.value).toBe(10);
});

it('test 2', () => {
  const state = { value: 20 };
  expect(state.value).toBe(20);
});
```

### 5. Test Edge Cases
```typescript
describe('calculateValue', () => {
  it('should handle normal values', () => { ... });
  it('should handle zero', () => { ... });
  it('should handle negative values', () => { ... });
  it('should handle very large values', () => { ... });
  it('should handle null/undefined', () => { ... });
  it('should handle empty arrays', () => { ... });
});
```

---

## 🔧 Tools & Resources

### Vitest Cheat Sheet
```typescript
// Assertions
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).toBeGreaterThan(10)
expect(value).toBeLessThan(10)
expect(value).toContain(item)
expect(value).toHaveProperty('key')
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeTruthy()
expect(value).toBeFalsy()

// Async
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()

// Mocks
vi.fn()
vi.mock('./module')
vi.spyOn(object, 'method')
mockFn.mockReturnValue(value)
mockFn.mockResolvedValue(value)
mockFn.mockRejectedValue(error)

// Cleanup
beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())
```

### React Testing Library Queries
```typescript
// Preferred (most accessible)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')
screen.getByText(/hello world/i)

// Use sparingly
screen.getByTestId('custom-element')

// Async queries
await screen.findByText('Loaded')
await waitFor(() => expect(element).toBeInTheDocument())

// Query variants
getBy... // Throws if not found
queryBy... // Returns null if not found
findBy... // Async, waits for element
```

---

## 🎯 Next Steps

1. **Start with backend services** - These are critical business logic
2. **Add route tests** - Ensure API contracts are correct
3. **Test authentication/authorization** - Security is paramount
4. **Move to frontend components** - User-facing features
5. **Add integration tests** - Ensure everything works together
6. **Set up coverage gates in CI** - Prevent coverage regression

---

**Good luck building comprehensive tests! 🚀**
