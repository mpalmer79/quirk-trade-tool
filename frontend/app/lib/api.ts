import type { FormData, SourceQuote, DepreciationData } from './types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000';

export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

export async function calculateValuation(data: FormData) {
  const payload = {
    storeId: data.storeId,
    year: parseInt(data.year.toString()),
    make: data.make,
    model: data.model,
    trim: data.trim || undefined,
    bodyStyle: data.bodyStyle || undefined, // NEW
    mileage: parseInt(data.mileage.toString()),
    condition: parseInt(data.condition.toString()),
    vin: data.vin || undefined,
    options: data.options,
    zip: data.zip || undefined,
  };

  const response = await fetch(`${API_BASE}/api/valuations/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Valuation failed');
  }

  const result = await response.json();
  return {
    quotes: result.quotes as SourceQuote[],
    summary: result.summary,
    baseWholesaleValue: result.baseWholesaleValue,
    depreciation: result.depreciation as DepreciationData,
    id: result.id as string,
  };
}

export function getPdfReceiptUrl(valuationId: string): string {
  return `${API_BASE}/api/receipt/pdf/${valuationId}`;
}
