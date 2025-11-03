import { valuationService } from '../../services/valuation-service';

describe('ValuationService', () => {
  it('aggregates multiple provider quotes correctly', async () => {
    // MOCK: Intercept API calls and return fake data
    vi.spyOn(valuationService as any, 'getBlackBookValue')
      .mockResolvedValue(18000);  // ← Instead of calling real API
    
    vi.spyOn(valuationService as any, 'getKBBValue')
      .mockResolvedValue(18500);
    
    vi.spyOn(valuationService as any, 'getNADAValue')
      .mockResolvedValue(17800);

    // ACT: Call the function
    const result = await valuationService.calculateValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      conditionRating: 3,
      dealershipId: 'quirk-chevy-manchester'
    });

    // ASSERT: Check your aggregation logic worked
    expect(result.quotes).toHaveLength(3);
    expect(result.baseWholesaleValue).toBeCloseTo(18100, -2); // Average
  });
});
