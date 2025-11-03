/**
 * VIN Decoder Utilities
 * Validation and formatting for Vehicle Identification Numbers
 */

/**
 * Validate VIN format
 * VINs are exactly 17 characters, alphanumeric, excluding I, O, Q
 */
export function validateVIN(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false;
  }

  // VIN must be exactly 17 characters
  if (vin.length !== 17) {
    return false;
  }

  // VIN uses 0-9, A-Z except I, O, Q
  const validVinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  
  return validVinRegex.test(vin.toUpperCase());
}

/**
 * Clean VIN by removing spaces, hyphens, and converting to uppercase
 */
export function cleanVIN(vin: string): string {
  if (!vin || typeof vin !== 'string') {
    return '';
  }

  return vin
    .replace(/[\s-]/g, '') // Remove spaces and hyphens
    .toUpperCase()         // Convert to uppercase
    .trim();               // Remove leading/trailing whitespace
}

/**
 * Validate and clean VIN in one step
 */
export function normalizeVIN(vin: string): string | null {
  const cleaned = cleanVIN(vin);
  
  if (validateVIN(cleaned)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Format VIN for display (add spaces for readability)
 * Example: 1HGCV41JXMN109186 -> 1HG CV41 JXM N109186
 */
export function formatVINForDisplay(vin: string): string {
  const cleaned = cleanVIN(vin);
  
  if (cleaned.length !== 17) {
    return cleaned;
  }

  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
}
