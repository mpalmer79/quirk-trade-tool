/**
 * Valuation Utilities
 * Formatting and calculation helpers for vehicle valuations
 */

/**
 * Format number as USD currency
 */
export function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '$0';
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  // Format with commas and 2 decimal places
  const formatted = absoluteValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Calculate depreciation percentage
 */
export function calculateDepreciationPercent(
  originalValue: number,
  currentValue: number
): number {
  if (originalValue === 0) {
    return 0;
  }

  const depreciation = ((originalValue - currentValue) / originalValue) * 100;
  
  // Round to 1 decimal place
  return Math.round(depreciation * 10) / 10;
}

/**
 * Calculate depreciation amount in dollars
 */
export function calculateDepreciationAmount(
  originalValue: number,
  currentValue: number
): number {
  return originalValue - currentValue;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get condition label from rating
 */
export function getConditionLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return labels[rating] || 'Unknown';
}

/**
 * Get condition description
 */
export function getConditionDescription(rating: number): string {
  const descriptions: Record<number, string> = {
    1: 'Significant damage, needs major repairs',
    2: 'Visible wear, minor damage, functional',
    3: 'Normal wear, clean, well-maintained',
    4: 'Minimal wear, excellent condition',
    5: 'Like new, pristine condition',
  };

  return descriptions[rating] || 'Unknown condition';
}

/**
 * Format mileage for display
 */
export function formatMileage(miles: number): string {
  if (typeof miles !== 'number' || isNaN(miles)) {
    return '0 miles';
  }

  return `${miles.toLocaleString()} miles`;
}
