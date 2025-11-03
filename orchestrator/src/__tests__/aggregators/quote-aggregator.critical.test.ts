import { describe, it, expect } from 'vitest';
import { QuoteAggregator } from '../../aggregators/quote-aggregator';

describe('QuoteAggregator - Critical', () => {
  const aggregator = new QuoteAggregator();

  it('should calculate average of quotes', () => {
    const quotes = [
      { source: 'A', value: 20000, currency: 'USD' },
      { source: 'B', value: 21000, currency: 'USD' },
      { source: 'C', value: 22000, currency: 'USD' },
    ];

    const result = aggregator.calculateAggregateValue(quotes);

    expect(result).toBeCloseTo(21000, 0);
  });

  it('should exclude outliers', () => {
    const quotes = [
      { source: 'A', value: 20000, currency: 'USD' },
      { source: 'B', value: 21000, currency: 'USD' },
      { source: 'C', value: 22000, currency: 'USD' },
      { source: 'D', value: 50000, currency: 'USD' }, // Outlier
    ];

    const result = aggregator.calculateAggregateValue(quotes);

    // Should be close to 21000, not affected by 50000
    expect(result).toBeGreaterThan(19000);
    expect(result).toBeLessThan(23000);
  });

  it('should handle single quote', () => {
    const quotes = [{ source: 'A', value: 15000, currency: 'USD' }];
    const result = aggregator.calculateAggregateValue(quotes);
    expect(result).toBe(15000);
  });

  it('should handle empty array', () => {
    const quotes: any[] = [];
    const result = aggregator.calculateAggregateValue(quotes);
    expect(result).toBe(0);
  });
});
