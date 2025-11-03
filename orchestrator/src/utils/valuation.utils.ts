/**
 * Valuation Utility Functions
 */

import type { SourceValuation } from '../types/valuation.types';

export function generateValuationId(): string {
  return `VAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateConfidenceLevel(
  sourceCount: number, 
  quotes: SourceValuation[]
): string {
  const highConfidenceCount = quotes.filter(q => q.confidence === 'high').length;

  if (sourceCount >= 5 && highConfidenceCount >= 3) return 'Very High';
  if (sourceCount >= 4 && highConfidenceCount >= 2) return 'High';
  if (sourceCount >= 3) return 'Medium';
  if (sourceCount >= 2) return 'Fair';
  return 'Low';
}
