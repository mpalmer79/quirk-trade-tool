import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { valuationRouter } from '../../routes/valuations';
import { valuationService } from '../../services/valuation-service';
import jwt from 'jsonwebtoken';

vi.mock('../../services/valuation-service');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req: any, res, next) => {
    req.user = {
      userId: 'test-user',
      role: 'admin',
      dealerships: ['quirk-chevy-manchester'],
    };
    next();
  });
  
  app.use('/api/valuations', valuationRouter);
  return app;
};

describe('Valuation Routes - Critical', () => {
  it('should create valuation with valid data', async () => {
    const app = createTestApp();
    
    const mockResult = {
      id: 'VAL-123',
      baseWholesaleValue: 22000,
      finalWholesaleValue: 19800,
      vehicle: {
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
      },
      quotes: [],
    };

    vi.mocked(valuationService.performValuation).mockResolvedValue(mockResult);

    const response = await request(app)
      .post('/api/valuations')
      .send({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('VAL-123');
    expect(response.body.baseWholesaleValue).toBe(22000);
  });

  it('should validate required fields', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/valuations')
      .send({
        year: 2020,
        // Missing required fields
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('validation');
  });

  it('should reject invalid year', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/valuations')
      .send({
        year: 1800, // Invalid year
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      });

    expect(response.status).toBe(400);
  });

  it('should reject negative mileage', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/valuations')
      .send({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: -1000, // Invalid
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      });

    expect(response.status).toBe(400);
  });
});
