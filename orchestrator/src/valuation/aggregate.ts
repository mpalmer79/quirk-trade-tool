import type { SourceQuote } from '../adapters/types.js';

// Remove quotes more than 25% away from median, then compute a 20% trimmed mean.
// Also derive a simple confidence score from stdev.
export function aggregate(quotes: SourceQuote[]) {
  if (!quotes.length) return null;

  const values = quotes.map(q => q.value).sort((a, b) => a - b);
  const median = values.length % 2
    ? values[(values.length - 1) / 2]
    : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;

  // Outlier drop: keep values within ±25% of median
  const kept = values.filter(v => {
    const delta = Math.abs(v - median) / median;
    return delta <= 0.25;
  });

  // If we dropped everything (rare), fall back to original values
  const base = kept.length ? kept : values;

  // 20% trimmed mean
  const k = Math.floor(base.length * 0.2);
  const trimmed = base.slice(k, base.length - k || 1);
  const avg = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);

  // Confidence from stdev of trimmed set
  const mean = avg;
  const variance = trimmed.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / trimmed.length;
  const stdev = Math.sqrt(variance);
  const confidence = stdev < 400 ? 'high' : stdev < 900 ? 'medium' : 'low';

  // Present a simple band (can narrow with lower stdev later)
  const low = Math.round(avg - 500);
  const high = Math.round(avg + 500);

  return { low, high, avg, confidence };
}
