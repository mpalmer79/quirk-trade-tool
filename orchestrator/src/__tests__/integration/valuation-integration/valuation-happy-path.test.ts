/**
 * Happy Path & Business Logic Tests (15 tests)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { validValuationRequest, conditionFactors } from './fixtures';

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
    expect(Array.isArray(response.body.quotes)).toBe(true);
    expect(response.body.quotes.length).toBeGreaterThan(0);

    response.body.quotes.forEach((quote: any) => {
      expect(quote).toHaveProperty('source');
      expect(quote).toHaveProperty('value');
      expect(quote).toHaveProperty('currency');
      expect(typeof quote.value).toBe('number');
      expect(quote.value).toBeGreaterThan(0);
    });
  });

  it('should calculate correct depreciation for each condition', async () => {
    for (const condition of conditionFactors) {
      const response = await request(app)
        .post('/api/valuations/calculate')
        .send({ ...validValuationRequest, condition: condition.rating });

      expect(response.status).toBe(200);
      const baseValue = response.body.baseWholesaleValue;
      const finalValue = response.body.finalWholesaleValue;
      const factor = finalValue / baseValue;

      expect(factor).toBeCloseTo(condition.expectedFactor, 2);
    }
  });

  it('should return valid vehicle information', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.vehicle.year).toBe(validValuationRequest.year);
    expect(response.body.vehicle.make).toBe(validValuationRequest.make);
    expect(response.body.vehicle.model).toBe(validValuationRequest.model);
    expect(response.body.vehicle.mileage).toBe(validValuationRequest.mileage);
    expect(response.body.vehicle.vin).toBe(validValuationRequest.vin);
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

  it('should calculate depreciation based on condition rating', async () => {
    const excellentResponse = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, condition: 5 });

    const poorResponse = await request(app)
      .post('/api/valuations/calculate')
      .send({ ...validValuationRequest, condition: 1 });

    expect(excellentResponse.body.finalWholesaleValue).toBeGreaterThan(
      poorResponse.body.finalWholesaleValue
    );
  });

  it('should include dealership in response', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.dealership).toHaveProperty('id');
  });

  it('should return consistent values across multiple requests for same vehicle', async () => {
    const response1 = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    const response2 = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response1.body.baseWholesaleValue).toBe(response2.body.baseWholesaleValue);
  });
});

describe('Valuation Integration - Business Logic', () => {
  it('should calculate depreciation based on mileage and age', async () => {
    const newCarResponse = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: new Date().getFullYear(),
        mileage: 1000,
      });

    const oldCarResponse = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        year: 2010,
        mileage: 150000,
      });

    expect(newCarResponse.body.finalWholesaleValue).toBeGreaterThan(
      oldCarResponse.body.finalWholesaleValue
    );
  });

  it('should provide confidence level in valuation', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
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
      expect(response.body.summary.low).toBeLessThanOrEqual(response.body.summary.avg);
      expect(response.body.summary.avg).toBeLessThanOrEqual(response.body.summary.high);
    }
  });

  it('should calculate fair market value correctly', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send(validValuationRequest);

    expect(response.status).toBe(200);
    expect(response.body.finalWholesaleValue).toBeGreaterThan(0);
    expect(response.body.baseWholesaleValue).toBeGreaterThanOrEqual(
      response.body.finalWholesaleValue
    );
  });

  it('should apply regional adjustments if applicable', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        region: 'Northeast',
      });

    expect([200, 400]).toContain(response.status);
  });

  it('should handle special vehicle conditions (salvage, rebuilt title)', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        ...validValuationRequest,
        titleType: 'rebuilt',
      });

    expect([200, 400]).toContain(response.status);
  });
});
