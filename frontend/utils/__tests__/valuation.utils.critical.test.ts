import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateDepreciationPercent } from '../valuation.utils';

describe('Valuation Utils - Critical', () => {
  describe('formatCurrency', () => {
    it('should format positive values correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(25000)).toBe('$25,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should handle decimals', () => {
      const result = formatCurrency(1234.56);
      // Accept both with and without cents
      expect(result).toMatch(/\$1,234(\.56)?/);
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000');
    });
  });

  describe('calculateDepreciationPercent', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateDepreciationPercent(100, 90)).toBe(10);
      expect(calculateDepreciationPercent(25000, 22500)).toBe(10);
    });

    it('should round to 1 decimal place', () => {
      expect(calculateDepreciationPercent(100, 93.3)).toBe(6.7);
    });

    it('should handle zero depreciation', () => {
      expect(calculateDepreciationPercent(100, 100)).toBe(0);
    });

    it('should handle full depreciation', () => {
      expect(calculateDepreciationPercent(100, 0)).toBe(100);
    });
  });
});
