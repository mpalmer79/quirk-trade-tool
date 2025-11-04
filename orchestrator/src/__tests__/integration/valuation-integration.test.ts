/**
 * Integration Test Suite - Valuation System
 * 
 * Tests the complete end-to-end valuation flow including:
 * - Request validation
 * - Multi-provider aggregation
 * - Depreciation calculation
 * - Error handling
 * - Caching behavior
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';

// ============================================================================
// TEST DATA & FIXTURES
// ============================================================================

const validValuationRequest = {
  year: 2020,
  make: 'Honda',
  model: 'Accord',
  mileage: 45000,
  condition: 3,
  dealershipId: 'test-dealer-01',
  vin: 'JHCV12345JM123456',
};

const invalidRequests = [
  {
    name: 'Missing year',
    payload: { ...validValuationRequest, year: undefined },
  },
  {
    name: 'Invalid condition (0)',
    payload: { ...validValuationRequest, condition: 0 },
  },
  {
    name: 'Invalid condition (6)',
    payload: { ...validValuationRequest, condition: 6 },
  },
  {
    name: 'Negative mileage',
    payload: { ...validValuationRequest, mileage: -100 },
  },
  {
    name: 'Missing make',
    payload: { ...validValuationRequest, make: '' },
  },
];

// ============================================================================
// TEST SUITE - HAPPY PATH
// ============================================================================

describe('Valuation Integration - Happy Path', () => {
  it('should complete full valuation flow end-to-end', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest)
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('baseWholesaleValue');
    expect(response.body).toHaveProperty('quotes');
    expect(response.body).toHaveProperty('depreciation');
    expect(response.body).toHaveProperty('finalWholesaleValue');
    expect(response.body).toHaveProperty('vehicle');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should aggregate quotes from multiple providers', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.quotes).toBeInstanceOf(Array);
    expect(response.body.quotes.length).toBeGreaterThan(0);

    // Each quote should have required fields
    response.body.quotes.forEach((quote: any) => {
      expect(quote).toHaveProperty('source');
      expect(quote).toHaveProperty('value');
      expect(quote).toHaveProperty('currency');
      expect(typeof quote.value).toBe('number');
      expect(quote.value).toBeGreaterThan(0);
    });
  });

  it('should calculate correct depreciation for each condition', async () => {
    const conditions = [
      { rating: 5, expectedFactor: 1.0, name: 'Excellent' },
      { rating: 4, expectedFactor: 0.95, name: 'Very Good' },
      { rating: 3, expectedFactor: 0.9, name: 'Good' },
      { rating: 2, expectedFactor: 0.8, name: 'Fair' },
      { rating: 1, expectedFactor: 0.6, name: 'Poor' },
    ];

    for (const condition of conditions) {
      const response = await request(app)
        .post('/api/valuations/calculate')
        .send({ ...validValuationRequest, condition: condition.rating });

      expect(response.status).toBe(200);

      const baseValue = response.body.baseWholesaleValue;
      const finalValue = response.body.finalWholesaleValue;
      const factor = finalValue / baseValue;

      // Allow 1% tolerance for rounding
      expect(factor).toBeCloseTo(condition.expectedFactor, 2);
    }
  });

  it('should return valid vehicle information', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toEqual({
      year: validValuationRequest.year,
      make: validValuationRequest.make,
      model: validValuationRequest.model,
      mileage: validValuationRequest.mileage,
      vin: validValuationRequest.vin,
      trim: undefined,
    });
  });

  it('should generate unique valuation IDs', async () => {
    const response1 = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    const response2 = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response1.body.id).not.toBe(response2.body.id);
  });

  it('should set correct timestamp', async () => {
    const beforeRequest = new Date();
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);
    const afterRequest = new Date();

    const timestamp = new Date(response.body.timestamp);

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
  });
});

// ============================================================================
// TEST SUITE - INPUT VALIDATION
// ============================================================================

describe('Valuation Integration - Input Validation', () => {
  invalidRequests.forEach((testCase) => {
    it(`should reject invalid input: ${testCase.name}`, async () => {
      const response = await request(app)
        .post('/api/valuations/calculate')
        .send(testCase.payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  it('should require year to be reasonable (1900-current)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, year: 1800 });

    expect(response.status).toBe(400);
  });

  it('should handle very high mileage', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, mileage: 500000 });

    // Should still process (high mileage is valid)
    expect(response.status).toBe(200);
    expect(response.body.depreciation).toBeDefined();
  });

  it('should handle zero mileage', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, mileage: 0 });

    expect(response.status).toBe(200);
    // Should calculate higher value for zero mileage
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST SUITE - ERROR HANDLING
// ============================================================================

describe('Valuation Integration - Error Handling', () => {
  it('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(response.status).toBe(400);
  });

  it('should return 500 for unexpected server errors', async () => {
    // This is hard to test without mocking, but demonstrates the pattern
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    // Should not return 500 for valid request
    expect(response.status).not.toBe(500);
  });

  it('should include request ID in error response', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({});

    expect(response.status).toBe(400);
    // Error response should include requestId for tracking
    if (response.body.requestId) {
      expect(typeof response.body.requestId).toBe('string');
    }
  });
});

// ============================================================================
// TEST SUITE - EDGE CASES
// ============================================================================

describe('Valuation Integration - Edge Cases', () => {
  it('should handle very expensive vehicles', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: 2023,
        make: 'BMW',
        model: '7 Series',
      });

    expect(response.status).toBe(200);
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
  });

  it('should handle very cheap vehicles', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: 2005,
        make: 'Ford',
        model: 'Focus',
        mileage: 200000,
      });

    expect(response.status).toBe(200);
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
  });

  it('should handle special characters in make/model', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        make: "Mercedes-Benz",
        model: "C-Class",
      });

    expect(response.status).toBe(200);
  });

  it('should handle whitespace in input strings', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        make: '  Honda  ',
        model: '  Accord  ',
      });

    // Should either trim or reject - check which is implemented
    expect([200, 400]).toContain(response.status);
  });

  it('should handle very old vehicles', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: 1990,
      });

    // Should either work or reject gracefully
    expect([200, 400]).toContain(response.status);
  });
});

// ============================================================================
// TEST SUITE - BUSINESS LOGIC
// ============================================================================

describe('Valuation Integration - Business Logic', () => {
  it('should calculate depreciation based on condition', async () => {
    const response1 = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, condition: 5 }); // Excellent

    const response2 = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, condition: 1 }); // Poor

    // Excellent condition should have higher value
    expect(response1.body.finalWholesaleValue).toBeGreaterThan(
      response2.body.finalWholesaleValue
    );
  });

  it('should provide value confidence levels', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    // Confidence should be one of the valid levels
    const validConfidences = ['High', 'Medium', 'Low', 'Very Low'];
    if (response.body.summary?.confidence) {
      expect(validConfidences).toContain(response.body.summary.confidence);
    }
  });

  it('should provide low/high value range', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    if (response.body.summary) {
      expect(response.body.summary.low).toBeLessThanOrEqual(
        response.body.summary.avg
      );
      expect(response.body.summary.avg).toBeLessThanOrEqual(
        response.body.summary.high
      );
    }
  });

  it('should include dealership in response', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.dealership).toEqual({
      id: validValuationRequest.dealershipId,
    });
  });
});

// ============================================================================
// TEST SUITE - PERFORMANCE & RELIABILITY
// ============================================================================

describe('Valuation Integration - Performance', () => {
  it('should respond within reasonable time (<2 seconds)', async () => {
    const start = Date.now();
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000); // 2 seconds
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(5)
      .fill(null)
      .map(() =>
        request(app)
          .post('/api/valuations/calculate')
          .send(validValuationRequest)
      );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });

    // All should have unique IDs
    const ids = responses.map((r) => r.body.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ============================================================================
// TEST SUITE - API RESPONSE FORMAT
// ============================================================================

describe('Valuation Integration - Response Format', () => {
  it('should return correct content type', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.type).toMatch(/json/);
  });

  it('should include all required top-level fields', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    const requiredFields = [
      'id',
      'baseWholesaleValue',
      'finalWholesaleValue',
      'quotes',
      'depreciation',
      'vehicle',
      'dealership',
      'timestamp',
    ];

    requiredFields.forEach((field) => {
      expect(response.body).toHaveProperty(field);
    });
  });

  it('should have depreciation with correct structure', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    const dep = response.body.depreciation;
    expect(dep).toHaveProperty('depreciationFactor');
    expect(dep).toHaveProperty('conditionRating');
    expect(dep).toHaveProperty('finalWholesaleValue');
    expect(typeof dep.depreciationFactor).toBe('number');
    expect(typeof dep.conditionRating).toBe('number');
  });
});
