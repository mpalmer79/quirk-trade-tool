import { describe, it, expect } from 'vitest';
import { valuationService } from '../../services/valuation-service';

describe('ValuationService', () => {
  it('aggregates multiple provider quotes correctly', async () => {
    const result = await valuationService.performValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      conditionRating: 3,
      dealershipId: 'quirk-chevy-manchester'
    });

    expect(result.quotes).toBeDefined();
    expect(result.quotes.length).toBeGreaterThan(0);
    expect(result.baseWholesaleValue).toBeGreaterThan(0);
    expect(result.finalWholesaleValue).toBeGreaterThan(0);
    expect(result.depreciation).toBeDefined();
    expect(result.id).toMatch(/^VAL-/);
    expect(result.vehicle.year).toBe(2020);
    expect(result.vehicle.make).toBe('Honda');
  });
});
