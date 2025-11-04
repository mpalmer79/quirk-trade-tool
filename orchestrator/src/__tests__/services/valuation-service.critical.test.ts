import { describe, it, expect, vi, beforeEach } from 'vitest';
import { valuationService } from '../../services/valuation-service';
import * as cache from '../../lib/cache';

vi.mock('../../lib/cache');

describe('ValuationService - Critical Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cache.getValuationFromCache).mockResolvedValue(null);
    vi.mocked(cache.cacheValuationResult).mockResolvedValue();
  });

  it('should calculate valuation for standard vehicle', async () => {
    const result = await valuationService.calculateValuation({
      vin: '1HGCV41JXMN109186',
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      conditionRating: 3,
      dealershipId: 'quirk-chevy-manchester',
    });

    // Verify structure
    expect(result).toMatchObject({
      id: expect.stringMatching(/^VAL-/),
      baseWholesaleValue: expect.any(Number),
      finalWholesaleValue: expect.any(Number),
      quotes: expect.any(Array),
    });

    // Verify values make sense
    expect(result.baseWholesaleValue).toBeGreaterThan(0);
    expect(result.finalWholesaleValue).toBeLessThanOrEqual(result.baseWholesaleValue);
    expect(result.quotes.length).toBeGreaterThan(0);
  });

  it('should apply correct depreciation per condition', async () => {
    const testCases = [
      { condition: 5, factor: 1.0 },
      { condition: 3, factor: 0.9 },
      { condition: 1, factor: 0.7 },
    ];

    for (const { condition, factor } of testCases) {
      const result = await valuationService.calculateValuation({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        conditionRating: condition,
        dealershipId: 'quirk-chevy-manchester',
      });

      const expectedValue = Math.round(result.baseWholesaleValue * factor);
      expect(result.finalWholesaleValue).toBe(expectedValue);
    }
  });

  it('should use cache when available', async () => {
    const cached = {
      id: 'VAL-CACHED',
      baseWholesaleValue: 20000,
      finalWholesaleValue: 18000,
    };
    
    vi.mocked(cache.getValuationFromCache).mockResolvedValue(cached);

    const result = await valuationService.calculateValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      conditionRating: 3,
      dealershipId: 'quirk-chevy-manchester',
    });

    expect(result.id).toBe('VAL-CACHED');
    expect(cache.cacheValuationResult).not.toHaveBeenCalled();
  });
});
