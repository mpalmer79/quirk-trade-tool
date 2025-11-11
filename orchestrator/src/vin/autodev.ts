import type { VinDecodeResult } from './types.js';
import { fetchWithRetry } from '../lib/retry.js';

// Auto.dev VIN decoder
// Docs: https://auto.dev/docs
// Endpoint: https://api.auto.dev/vin/{vin}
export async function decodeVinWithAutoDev(vin: string): Promise<VinDecodeResult> {
  const apiKey = process.env.AUTODEV_API_KEY;

  if (!apiKey) {
    return { vin, errors: ['autodev_api_key_missing'] };
  }

  try {
    const url = `https://api.auto.dev/vin/${encodeURIComponent(vin)}`;
    const res = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      { maxAttempts: 3, initialDelayMs: 1000 }
    );

    if (!res.ok) {
      return { vin, errors: [`autodev_http_${res.status}`] };
    }

    const data = await res.json();

    // Parse auto.dev response structure
    // Adjust field mapping based on actual auto.dev API response format
    const result: VinDecodeResult = {
      vin,
      year: data.year ? Number(data.year) : undefined,
      make: data.make ? String(data.make).trim() : undefined,
      model: data.model ? String(data.model).trim() : undefined,
      trim: data.trim ? String(data.trim).trim() : undefined,
      bodyClass: data.body ? String(data.body).trim() : undefined,
      fuelTypePrimary: data.fuelType ? String(data.fuelType).trim() : undefined,
      driveType: data.drivetrain ? String(data.drivetrain).trim() : undefined,
      engine: {
        cylinders: data.engine?.cylinders ? String(data.engine.cylinders).trim() : undefined,
        displacementL: data.engine?.displacement ? String(data.engine.displacement).trim() : undefined
      },
      raw: data
    };

    return result;
  } catch (error) {
    console.error('Auto.dev VIN decode error:', error);
    return { vin, errors: ['autodev_error', error instanceof Error ? error.message : 'unknown_error'] };
  }
}
