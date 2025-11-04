import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import type { Application } from 'express';

let app: Application;
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Provider Failures - Error Scenarios (15 tests)', () => {
  beforeAll(async () => {
    // Import app after all configurations are set
    const module = await import('../../../src/app');
    app = module.default;
  });

  describe('Malformed Request Handling', () => {
    it('should reject invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .set('Content-Type', 'application/json')
        .send('{ invalid json ]');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid JSON');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186'
          // missing year, make, model
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should reject invalid VIN format', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'INVALID',
          year: 2020,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('VIN');
    });

    it('should reject invalid year format', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 'twenty-twenty',
          make: 'BMW',
          model: '3 Series',
          mileage: 50000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject year beyond current year', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2030,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject negative mileage', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: -5000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('mileage');
    });
  });

  describe('Provider API Failures', () => {
    it('should handle provider timeout gracefully', async () => {
      // Mock a timeout scenario
      jest.setTimeout(15000);

      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000,
          timeout: 100 // Simulate timeout
        });

      expect([408, 503, 504]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    }, 20000);

    it('should handle provider 500 error', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000,
          simulateProviderError: 500
        });

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle provider 503 Service Unavailable', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000,
          simulateProviderError: 503
        });

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('unavailable');
    });

    it('should handle malformed provider response', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000,
          simulateMalformedResponse: true
        });

      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('response');
    });

    it('should handle missing provider API key', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 50000,
          simulateAuthError: true
        });

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely old vehicle (1900)', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 1900,
          make: 'Oldsmobile',
          model: 'Classic',
          mileage: 999999
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle excessive mileage (beyond realistic)', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW',
          model: '3 Series',
          mileage: 999999999
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle special characters in make/model', async () => {
      const response = await request(app)
        .post('/api/valuation')
        .send({
          vin: 'WBADT43452G297186',
          year: 2015,
          make: 'BMW<script>alert("xss")</script>',
          model: '3 Series"><!--',
          mileage: 50000
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle concurrent duplicate requests gracefully', async () => {
      const requests = [
        request(app)
          .post('/api/valuation')
          .send({
            vin: 'WBADT43452G297186',
            year: 2015,
            make: 'BMW',
            model: '3 Series',
            mileage: 50000
          }),
        request(app)
          .post('/api/valuation')
          .send({
            vin: 'WBADT43452G297186',
            year: 2015,
            make: 'BMW',
            model: '3 Series',
            mileage: 50000
          })
      ];

      const responses = await Promise.all(requests);

      // Both should complete successfully
      expect(responses.every(r => r.status < 500)).toBe(true);
      // Should have consistent responses
      expect(responses[0].body).toEqual(responses[1].body);
    });
  });

  afterAll(async () => {
    // Cleanup
    jest.clearAllMocks();
  });
});
