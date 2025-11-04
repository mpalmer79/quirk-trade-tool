
import { describe, it, expect } from 'vitest';
import { depreciationCalculator } from '../../services/depreciation-calculator';

describe('DepreciationCalculator - Critical', () => {
  it('should apply correct factors for each condition', () => {
    const testCases = [
      { condition: 5, expectedFactor: 1.0 },   // Excellent
      { condition: 4, expectedFactor: 0.95 },  // Very Good
      { condition: 3, expectedFactor: 0.9 },   // Good
      { condition: 2, expectedFactor: 0.8 },   // Fair
      { condition: 1, expectedFactor: 0.7 },   // Poor
    ];

    testCases.forEach(({ condition, expectedFactor }) => {
      const result = depreciationCalculator.calculateDepreciation(20000, condition);
      
      expect(result.depreciationFactor).toBe(expectedFactor);
      expect(result.finalWholesaleValue).toBe(20000 * expectedFactor);
    });
  });

  it('should handle edge case base values', () => {
    // Zero base value
    let result = depreciationCalculator.calculateDepreciation(0, 3);
    expect(result.finalWholesaleValue).toBe(0);

    // Very high value
    result = depreciationCalculator.calculateDepreciation(1000000, 3);
    expect(result.finalWholesaleValue).toBe(900000);

    // Decimal value
    result = depreciationCalculator.calculateDepreciation(15555.55, 3);
    expect(result.finalWholesaleValue).toBeCloseTo(14000, 0);
  });

  it('should throw for invalid condition ratings', () => {
    expect(() => {
      depreciationCalculator.calculateDepreciation(20000, 0);
    }).toThrow();

    expect(() => {
      depreciationCalculator.calculateDepreciation(20000, 6);
    }).toThrow();
  });
});
