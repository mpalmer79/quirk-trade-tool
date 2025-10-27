import type { SourceQuote } from '../adapters/types.js';

export function aggregate(quotes: SourceQuote[]) {
  const values = quotes.map(q => q.value).sort((a, b) => a - b);
  if (values.length === 0) return null;

  const k = Math.floor(values.length * 0.2); // 20% trimmed mean
  const trimmed = values.slice(k, values.length - k || 1);
  const avg = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);

  // Confidence from stdev
  const mean = avg;
  const variance = trimmed.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / trimmed.length;
  const stdev = Math.sqrt(variance);
  const confidence = stdev < 400 ? 'high' : stdev < 900 ? 'medium' : 'low';

  const low = Math.round(avg - 500);
  const high = Math.round(avg + 500);

  return { low, high, avg, confidence };
}
