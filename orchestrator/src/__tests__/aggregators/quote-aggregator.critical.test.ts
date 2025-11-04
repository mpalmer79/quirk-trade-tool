import { describe, it, expect } from 'vitest';
import { QuoteAggregator } from '../../aggregators/quote-aggregator';

describe('QuoteAggregator - Critical', () => {
  const aggregator = new QuoteAggregator();

  it('should calculate average of quotes', () => {
    const quotes = [
      { provider: 'A', value: 20000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
      { provider: 'B', value: 21000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
      { provider: 'C', value: 22000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
    ];

    const result = aggregator.calculateAggregateValue(quotes);

    expect(result).toBeCloseTo(21000, 0);
  });

  it('should exclude outliers', () => {
    const quotes = [
      { provider: 'A', value: 20000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
      { provider: 'B', value: 21000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
      { provider: 'C', value: 22000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' },
      { provider: 'D', value: 50000, confidence: 'low' as const, timestamp: '2024-01-01T00:00:00Z' }, // Outlier with low confidence
    ];

    const result = aggregator.calculateAggregateValue(quotes);

    // Should be close to 21000, not affected much by 50000 due to low confidence weight
    expect(result).toBeGreaterThan(19000);
    expect(result).toBeLessThan(23000);
  });

  it('should handle single quote', () => {
    const quotes = [
      { provider: 'A', value: 15000, confidence: 'high' as const, timestamp: '2024-01-01T00:00:00Z' }
    ];
    const result = aggregator.calculateAggregateValue(quotes);
    expect(result).toBe(15000);
  });

  it('should handle empty array', () => {
    const quotes: any[] = [];
    const result = aggregator.calculateAggregateValue(quotes);
    expect(result).toBe(0);
  });
});
