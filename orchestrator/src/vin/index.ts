import type { VinDecodeResult } from './types.js';
import { decodeVinWithNhtsa } from './nhtsa.js';
import { decodeVinWithAutoDev } from './autodev.js';

// Pluggable VIN decode pipeline: add commercial decoders here (e.g., Black Book VIN-specific, DataOne, ChromeData).
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  // Basic VIN sanitation
  const cleaned = vin.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length < 11 || cleaned.length > 17) {
    return { vin: cleaned, errors: ['invalid_length'] };
  }

  // Priority order (when you license: commercial → fallback)
  // 1. Try Auto.dev (primary commercial)
  if (process.env.AUTODEV_API_KEY) {
    const autoDev = await decodeVinWithAutoDev(cleaned).catch(() => null);
    if (autoDev && !autoDev.errors?.length) {
      console.log('VIN decode via Auto.dev successful');
      return autoDev;
    }
  }

  // 2. Fallback to NHTSA
  return await decodeVinWithNhtsa(cleaned);
}
