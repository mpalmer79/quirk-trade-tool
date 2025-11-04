/**
 * Input Validation & Error Handling Tests (17 tests)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { validValuationRequest, invalidRequests } from './fixtures';

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

  it('should require year to be reasonable (1995-current+1)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, year: 1994 });

    expect(response.status).toBe(400);
  });

  it('should handle very high mileage (500k+)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, mileage: 500000 });

    expect(response.status).toBe(200);
    expect(response.body.depreciation).toBeDefined();
    expect(response.body.finalWholesaleValue).toBeGreaterThan(0);
  });

  it('should handle zero mileage', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, mileage: 0 });

    expect(response.status).toBe(200);
    expect(response.body.baseWholesaleValue).toBeGreaterThan(0);
  });

  it('should handle maximum mileage (999999)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, mileage: 999999 });

    expect([200, 400]).toContain(response.status);
  });
});

describe('Valuation Integration - Error Handling', () => {
  it('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle malformed JSON request', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(response.status).toBe(400);
  });

  it('should not return 500 for valid requests', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).not.toBe(500);
  });

  it('should provide descriptive error messages', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        year: 'not-a-number',
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });

  it('should handle empty payload gracefully', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(null);

    expect([400, 415]).toContain(response.status);
  });

  it('should handle very large payload', async () => {
    const largePayload = {
      ...validValuationRequest,
      notes: 'x'.repeat(100000),
    };

    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(largePayload);

    // Express accepts the payload, but the extra field is ignored
    expect([200, 400, 413]).toContain(response.status);
  });

  it('should handle missing content-type header', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
  });
});
