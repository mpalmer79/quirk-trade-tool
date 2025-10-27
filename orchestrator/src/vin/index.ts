import type { VinDecodeResult } from './types.js';
import { decodeVinWithNhtsa } from './nhtsa.js';

// Pluggable VIN decode pipeline: add commercial decoders here (e.g., Black Book VIN-specific, DataOne, ChromeData).
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  // Basic VIN sanitation
  const cleaned = vin.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length < 11 || cleaned.length > 17) {
    return { vin: cleaned, errors: ['invalid_length'] };
  }

  // Priority order (when you license: commercial → fallback)
  // const commercial = await decodeWithCommercial(cleaned).catch(() => null);
  // if (commercial && !commercial.errors?.length) return commercial;

  // Fallback to NHTSA
  return await decodeVinWithNhtsa(cleaned);
}
