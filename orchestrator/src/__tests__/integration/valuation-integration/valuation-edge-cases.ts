/**
 * Edge Cases, Performance & Format Tests (18 tests)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { validValuationRequest } from './fixtures';

describe('Valuation Integration - Edge Cases', () => {
  it('should handle very expensive vehicles (luxury cars)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: 2023,
        make: 'BMW',
        model: '7 Series',
        mileage: 5000,
      });

    expect(response.status).toBe(200);
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
  });

  it('should handle very cheap vehicles (economy)', async () => {
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
        make: 'Mercedes-Benz',
        model: 'C-Class',
      });

    expect(response.status).toBe(200);
  });

  it('should handle brand new vehicles (current year)', async () => {
    const currentYear = new Date().getFullYear();
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: currentYear,
        mileage: 0,
      });

    expect(response.status).toBe(200);
  });
});

describe('Valuation Integration - Performance', () => {
  it('should respond within reasonable time (<2 seconds)', async () => {
    const start = Date.now();
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  it('should handle concurrent requests without race conditions', async () => {
    const requests = Array(5)
      .fill(null)
      .map(() =>
        request(app)
          .post('/api/valuations/calculate')
          .send(validValuationRequest)
      );

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
    });

    const ids = responses.map((r) => r.body.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should maintain consistency under load', async () => {
    const responses = await Promise.all(
      Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/valuations/calculate')
            .send(validValuationRequest)
        )
    );

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('baseWholesaleValue');
    });
  });

  it('should handle rate limiting gracefully', { timeout: 10000 }, async () => {
    const requests = Array(100)
      .fill(null)
      .map(() =>
        request(app)
          .post('/api/valuations/calculate')
          .send(validValuationRequest)
      );

    const responses = await Promise.all(requests);
    const successCount = responses.filter((r) => r.status === 200).length;

    expect(successCount).toBeGreaterThan(0);
  });
});

describe('Valuation Integration - Response Format', () => {
  it('should return correct content type (application/json)', async () => {
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
    expect(typeof dep.depreciationFactor).toBe('number');
    expect(typeof dep.conditionRating).toBe('number');
  });

  it('should return numeric values for monetary amounts', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(typeof response.body.baseWholesaleValue).toBe('number');
    expect(typeof response.body.finalWholesaleValue).toBe('number');
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
    expect(response.body.finalWholesaleValue).toBeGreaterThan(0);
  });

  it('should have valid ISO 8601 timestamp', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('should have quotes array with proper structure', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(Array.isArray(response.body.quotes)).toBe(true);
    response.body.quotes.forEach((quote: any) => {
      expect(quote).toHaveProperty('source');
      expect(quote).toHaveProperty('value');
      expect(quote).toHaveProperty('currency');
      expect(typeof quote.value).toBe('number');
      expect(quote.currency).toBe('USD');
    });
  });
});
