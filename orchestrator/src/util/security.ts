// Placeholder for key sealing/KMS integration later.
// For now, keep PII out of analytics; any VINs should be hashed here when added.
export const hashVin = (vin?: string) => (vin ? `hash:${Buffer.from(vin).toString('base64url')}` : undefined);
