import type { VinDecodeResult } from './types.js';
import { fetchWithRetry } from '../lib/retry.js';

// Public fallback VIN decoder using NHTSA VPIC.
// Docs: https://vpic.nhtsa.dot.gov/api/
// Endpoint: DecodeVinValuesExtended/{VIN}?format=json
export async function decodeVinWithNhtsa(vin: string): Promise<VinDecodeResult> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;

  try {
    const res = await fetchWithRetry(url, { method: 'GET' }, { maxAttempts: 3, initialDelayMs: 1000 });
    if (!res.ok) {
      return { vin, errors: [`nhtsa_http_${res.status}`] };
    }

    const data = await res.json();
    const row = data?.Results?.[0] ?? {};

    const yearStr = (row.ModelYear ?? '').toString().trim();
    const year = /^\d{4}$/.test(yearStr) ? Number(yearStr) : undefined;

    // Extract model with fallbacks: Model → Series
    // Note: GM/Ford trucks often have model in Series field (e.g., "Silverado 1500", "F-150")
    const model =
      (row.Model ?? '').toString().trim() ||
      (row.Series ?? '').toString().trim() ||
      undefined;

    // Extract trim with fallbacks: Trim → Trim2 → ModelVariantDescription
    // Note: Removed Series from trim fallback since it's now used for model
    const trim =
      (row.Trim ?? '').toString().trim() ||
      (row.Trim2 ?? '').toString().trim() ||
      (row.ModelVariantDescription ?? '').toString().trim() ||
      undefined;

    const result: VinDecodeResult = {
      vin,
      year,
      make: (row.Make ?? '').toString().trim() || undefined,
      model,
      trim,
      bodyClass: (row.BodyClass ?? '').toString().trim() || undefined,
      fuelTypePrimary: (row.FuelTypePrimary ?? '').toString().trim() || undefined,
      driveType: (row.DriveType ?? '').toString().trim() || undefined,
      engine: {
        cylinders: (row.EngineCylinders ?? '').toString().trim() || undefined,
        displacementL: (row.DisplacementL ?? '').toString().trim() || undefined
      },
      raw: data
    };

    // Collate NHTSA error fields if present
    const errFields = ['ErrorCode', 'ErrorText'];
    const errs: string[] = [];
    errFields.forEach(k => {
      const v = (row[k] ?? '').toString().trim();
      if (v && !/^0$/.test(v)) errs.push(`${k}:${v}`);
    });
    if (errs.length) result.errors = errs;

    return result;
  } catch (error) {
    return {
      vin,
      errors: ['nhtsa_error', error instanceof Error ? error.message : 'unknown_error']
    };
  }
}
