import { describe, it, expect } from 'vitest';
import { BaseProvider } from '../../providers/base-provider';
import type { ValuationRequest, ProviderConfig } from '../../types/valuation.types';

// Concrete implementation for testing
class TestProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Test Provider',
    basePrice: 20000,
    yearAdjustmentRate: 0.10,
    mileageAdjustmentRate: 0.15,
    randomVariance: 1000,
  };
}

describe('BaseProvider', () => {
  const provider = new TestProvider();
  
  describe('trim multipliers', () => {
    it('applies base trim multiplier (8% discount)', async () => {
      const request: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Base',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const value = await provider.getValue(request);
      expect(value).toBeGreaterThan(0);
      
      // Compare with no-trim request
      const noTrimRequest = { ...request, trim: undefined };
      const noTrimValue = await provider.getValue(noTrimRequest);
      
      // Base trim should be less than no trim (0.92 multiplier)
      expect(value).toBeLessThan(noTrimValue!);
    });

    it('applies premium trim multiplier (12% premium)', async () => {
      const request: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Premium',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const value = await provider.getValue(request);
      expect(value).toBeGreaterThan(0);
      
      // Compare with no-trim request
      const noTrimRequest = { ...request, trim: undefined };
      const noTrimValue = await provider.getValue(noTrimRequest);
      
      // Premium trim should be more than no trim (1.12 multiplier)
      expect(value).toBeGreaterThan(noTrimValue!);
    });

    it('applies platinum trim multiplier (18% premium)', async () => {
      const request: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Platinum',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const value = await provider.getValue(request);
      expect(value).toBeGreaterThan(0);
      
      // Platinum should be highest value
      const baseRequest = { ...request, trim: 'Base' };
      const baseValue = await provider.getValue(baseRequest);
      
      expect(value).toBeGreaterThan(baseValue!);
    });

    it('handles partial trim matches (e.g., "Sport Plus" contains "sport")', async () => {
      const sportPlusRequest: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Sport Plus',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const sportValue = await provider.getValue(sportPlusRequest);
      
      const baseRequest = { ...sportPlusRequest, trim: 'Base' };
      const baseValue = await provider.getValue(baseRequest);
      
      // Sport Plus should apply sport multiplier (1.05)
      expect(sportValue).toBeGreaterThan(baseValue!);
    });

    it('uses default multiplier (1.0) for unknown trims', async () => {
      const unknownTrimRequest: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Unknown Edition',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const unknownValue = await provider.getValue(unknownTrimRequest);
      
      const noTrimRequest = { ...unknownTrimRequest, trim: undefined };
      const noTrimValue = await provider.getValue(noTrimRequest);
      
      // Unknown trim should be similar to no trim (accounting for random variance)
      const difference = Math.abs(unknownValue! - noTrimValue!);
      expect(difference).toBeLessThan(2000); // Within variance range
    });

    it('handles case-insensitive trim matching', async () => {
      const upperCaseRequest: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'SPORT',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const lowerCaseRequest = { ...upperCaseRequest, trim: 'sport' };
      
      const upperValue = await provider.getValue(upperCaseRequest);
      const lowerValue = await provider.getValue(lowerCaseRequest);
      
      // Both should apply same multiplier (accounting for random variance)
      const difference = Math.abs(upperValue! - lowerValue!);
      expect(difference).toBeLessThan(2000); // Within variance range
    });

    it('trim multipliers create significant value differences', async () => {
      const baseTrimRequest: ValuationRequest = {
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'Base',
        mileage: 10000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const platinumRequest = { ...baseTrimRequest, trim: 'Platinum' };
      
      const baseValue = await provider.getValue(baseTrimRequest);
      const platinumValue = await provider.getValue(platinumRequest);
      
      // Platinum (1.18) vs Base (0.92) = 28.3% difference
      // Should see at least 20% difference accounting for variance
      const percentDiff = ((platinumValue! - baseValue!) / baseValue!) * 100;
      expect(percentDiff).toBeGreaterThan(20);
    });
  });

  describe('valuation calculations', () => {
    it('handles edge cases gracefully', async () => {
      const invalidRequest = {
        year: NaN,
        make: '',
        model: '',
        mileage: -1,
        conditionRating: 5 as const,
        dealershipId: '1',
      };
      
      const value = await provider.getValue(invalidRequest);
      // NaN or null are both acceptable for invalid requests
      expect(value === null || (typeof value === 'number' && isNaN(value))).toBe(true);
    });

    it('enforces minimum value of $500', async () => {
      const veryOldHighMileageRequest: ValuationRequest = {
        year: 1990, // Very old
        make: 'Honda',
        model: 'Accord',
        mileage: 500000, // Very high mileage
        conditionRating: 1, // Poor condition
        dealershipId: '1',
      };
      
      const value = await provider.getValue(veryOldHighMileageRequest);
      expect(value).toBeGreaterThanOrEqual(500);
    });

    it('newer vehicles with low mileage get higher values', async () => {
      const newRequest: ValuationRequest = {
        year: 2024,
        make: 'Honda',
        model: 'Accord',
        mileage: 5000,
        conditionRating: 5,
        dealershipId: '1',
      };
      
      const oldRequest: ValuationRequest = {
        year: 2015,
        make: 'Honda',
        model: 'Accord',
        mileage: 100000,
        conditionRating: 3,
        dealershipId: '1',
      };
      
      const newValue = await provider.getValue(newRequest);
      const oldValue = await provider.getValue(oldRequest);
      
      expect(newValue).toBeGreaterThan(oldValue!);
    });
  });

  describe('getName', () => {
    it('returns provider name', () => {
      expect(provider.getName()).toBe('Test Provider');
    });
  });
});
