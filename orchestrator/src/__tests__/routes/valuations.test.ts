import request from 'supertest';
import { app } from '../../app';
import { valuationService } from '../../services/valuation-service';

// Mock the entire service
vi.mock('../../services/valuation-service');

describe('POST /api/valuations/calculate', () => {
  it('returns 200 and valuation data for valid request', async () => {
    // MOCK: Service returns fake data
    valuationService.calculateValuation.mockResolvedValue({
      id: 'val-123',
      baseWholesaleValue: 18000,
      finalWholesaleValue: 16200,
      quotes: [/* ... */]
    });

    // ACT: Make fake HTTP request
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        conditionRating: 3,
        dealershipId: 'quirk-chevy-manchester'
      });

    // ASSERT: Check HTTP response
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('val-123');
    expect(response.body.baseWholesaleValue).toBe(18000);
  });

  it('returns 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/valuations/calculate')
      .send({ year: 1980 }); // Missing fields

    expect(response.status).toBe(400);
  });
});
