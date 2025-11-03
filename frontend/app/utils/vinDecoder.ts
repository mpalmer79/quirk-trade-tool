import type { DecodedVin } from '../lib/types';

/**
 * Decode VIN using NHTSA API
 * Returns vehicle year, make, model, and trim
 */
export async function decodeVinWithNhtsa(vin: string): Promise<DecodedVin | null> {
  const cleaned = (vin || '').trim().toUpperCase();
  if (cleaned.length < 11) return null;

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(cleaned)}?format=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const row = data?.Results?.[0];
    if (!row) return null;

    // Debug: Log the raw response
    console.log('NHTSA Response:', row);

    // Parse year - handle both numeric and string formats
    let year = undefined;
    if (row.ModelYear) {
      const yearNum = parseInt(row.ModelYear.toString());
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        year = yearNum;
      }
    }

    // Parse make - clean up formatting
    let make = row.Make || undefined;
    if (make && make !== '' && make !== 'Not Applicable') {
      make = make
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else {
      make = undefined;
    }

    // Parse model - handle empty/invalid values
    let model = row.Model || undefined;
    if (model && model !== '' && model !== 'Not Applicable') {
      model = model
        .split('-')
        .map((part: string) => 
          part
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        )
        .join('-');
    } else {
      model = undefined;
    }

    // Parse trim
    let trim = row.Trim || undefined;
    if (trim && trim !== '' && trim !== 'Not Applicable') {
      // Keep trim as-is
    } else {
      trim = undefined;
    }

    console.log('Decoded VIN:', { year, make, model, trim });

    return { year, make, model, trim };
  } catch (e) {
    console.error('VIN decode failed:', e);
    return null;
  }
}
