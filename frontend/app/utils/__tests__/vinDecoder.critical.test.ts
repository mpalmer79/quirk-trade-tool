import { describe, it, expect } from 'vitest';
import { validateVIN, cleanVIN } from '../vinDecoder';

describe('VIN Decoder Utils - Critical', () => {
  it('should validate correct VIN format', () => {
    expect(validateVIN('1HGCV41JXMN109186')).toBe(true);
    expect(validateVIN('2T1BURHE0JC123456')).toBe(true);
  });

  it('should reject invalid VIN lengths', () => {
    expect(validateVIN('SHORT')).toBe(false);
    expect(validateVIN('TOOLONGFORVINFORMAT123')).toBe(false);
    expect(validateVIN('')).toBe(false);
  });

  it('should reject VINs with invalid characters', () => {
    expect(validateVIN('1HGCV41JXMN10918O')).toBe(false); // O not allowed
    expect(validateVIN('1HGCV41JXMN10918I')).toBe(false); // I not allowed
    expect(validateVIN('1HGCV41JXMN10918Q')).toBe(false); // Q not allowed
  });

  it('should clean VIN by removing spaces and hyphens', () => {
    expect(cleanVIN('1HG CV41-JXM-N109186')).toBe('1HGCV41JXMN109186');
    expect(cleanVIN(' 1HGCV41JXMN109186 ')).toBe('1HGCV41JXMN109186');
  });

  it('should convert VIN to uppercase', () => {
    expect(cleanVIN('1hgcv41jxmn109186')).toBe('1HGCV41JXMN109186');
  });
});
