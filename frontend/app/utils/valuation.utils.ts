export function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '$0';
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const formatted = absoluteValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

export function calculateDepreciationPercent(
  originalValue: number,
  currentValue: number
): number {
  if (originalValue === 0) return 0;
  const depreciation = ((originalValue - currentValue) / originalValue) * 100;
  return Math.round(depreciation * 10) / 10;
}
