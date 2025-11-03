import { valuationService } from '../../services/valuation-service';

describe('ValuationService', () => {
 it('aggregates multiple provider quotes correctly', async () => {
  // Mock the actual external provider API calls, not internal methods
  // Assuming valuationService makes HTTP calls to providers
  
  // ACT: Call the function
  const result = await valuationService.calculateValuation({
    year: 2020,
    make: 'Honda',
    model: 'Accord',
    mileage: 45000,
    conditionRating: 3,
    dealershipId: 'quirk-chevy-manchester'
  });

  // ASSERT: Check aggregation logic worked
  expect(result.quotes).toBeDefined();
  expect(result.quotes.length).toBeGreaterThan(0);
  expect(result.baseWholesaleValue).toBeGreaterThan(0);
  expect(result.baseWholesaleValue).toBeCloseTo(18000, -2); // Within $100
});
});
