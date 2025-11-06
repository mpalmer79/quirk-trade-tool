import { describe, it, expect, vi } from 'vitest';
import { decodeVinWithNhtsa } from '../../vin/nhtsa';

// Mock fetch globally
global.fetch = vi.fn();

describe('NHTSA VIN Decoder', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use Series field when Model is empty (Audi e-tron GT case)', async () => {
    // This is the actual response structure from NHTSA for VIN WA1EAAFY8N2059910
    const mockResponse = {
      Count: 1,
      Message: 'Results returned successfully',
      SearchCriteria: 'VIN:WA1EAAFY8N2059910',
      Results: [
        {
          Make: 'AUDI',
          Manufacturer: 'AUDI AG',
          Model: '', // Empty model field
          ModelYear: '2022',
          Series: 'e-tron GT', // Model is in Series field
          Trim: 'quattro',
          Trim2: '',
          BodyClass: 'Sedan/Saloon',
          FuelTypePrimary: 'Electric',
          DriveType: 'AWD/4-Wheel Drive',
          EngineCylinders: '0',
          DisplacementL: '0.0',
          ErrorCode: '0',
          ErrorText: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('WA1EAAFY8N2059910');

    expect(result.make).toBe('AUDI');
    expect(result.model).toBe('e-tron GT'); // Should use Series when Model is empty
    expect(result.year).toBe(2022);
    expect(result.trim).toBe('quattro');
    expect(result.bodyClass).toBe('Sedan/Saloon');
  });

  it('should use Model field when available', async () => {
    const mockResponse = {
      Count: 1,
      Message: 'Results returned successfully',
      Results: [
        {
          Make: 'Honda',
          Model: 'Accord',
          Series: 'Sport', // Should not use this when Model exists
          ModelYear: '2023',
          Trim: 'EX-L',
          ErrorCode: '0',
          ErrorText: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('1HGCV41JXMN109186');

    expect(result.make).toBe('Honda');
    expect(result.model).toBe('Accord'); // Should use Model, not Series
    expect(result.trim).toBe('EX-L');
  });

  it('should handle GM trucks where model is in Series (Silverado)', async () => {
    const mockResponse = {
      Count: 1,
      Message: 'Results returned successfully',
      Results: [
        {
          Make: 'Chevrolet',
          Model: '',
          Series: 'Silverado 1500',
          ModelYear: '2023',
          Trim: 'LT',
          ErrorCode: '0',
          ErrorText: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('1GCUYEED5PZ123456');

    expect(result.make).toBe('Chevrolet');
    expect(result.model).toBe('Silverado 1500');
  });

  it('should handle Ford F-150 where model is in Series', async () => {
    const mockResponse = {
      Count: 1,
      Message: 'Results returned successfully',
      Results: [
        {
          Make: 'Ford',
          Model: '',
          Series: 'F-150',
          ModelYear: '2023',
          Trim: 'XLT',
          ErrorCode: '0',
          ErrorText: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('1FTFW1E59PFC12345');

    expect(result.make).toBe('Ford');
    expect(result.model).toBe('F-150');
  });

  it('should handle HTTP errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await decodeVinWithNhtsa('INVALIDVIN123');

    expect(result.errors).toContain('nhtsa_http_500');
  });

  it('should extract NHTSA error codes if present', async () => {
    const mockResponse = {
      Count: 1,
      Results: [
        {
          Make: '',
          Model: '',
          ErrorCode: '6',
          ErrorText: 'Invalid VIN'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('BADVINFORMAT12345');

    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('ErrorCode:6'))).toBe(true);
  });

  it('should handle trim fallbacks correctly', async () => {
    const mockResponse = {
      Count: 1,
      Results: [
        {
          Make: 'Tesla',
          Model: 'Model 3',
          Series: '',
          ModelYear: '2023',
          Trim: '', // Empty trim
          Trim2: 'Long Range', // Should use this
          ErrorCode: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('5YJ3E1EA1KF123456');

    expect(result.model).toBe('Model 3');
    expect(result.trim).toBe('Long Range');
  });

  it('should parse year correctly', async () => {
    const mockResponse = {
      Count: 1,
      Results: [
        {
          Make: 'BMW',
          Model: '3 Series',
          ModelYear: '2024',
          ErrorCode: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('WBA5R1C09NBK12345');

    expect(result.year).toBe(2024);
    expect(typeof result.year).toBe('number');
  });

  it('should handle missing/invalid year gracefully', async () => {
    const mockResponse = {
      Count: 1,
      Results: [
        {
          Make: 'Toyota',
          Model: 'Camry',
          ModelYear: '', // Empty year
          ErrorCode: '0'
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await decodeVinWithNhtsa('4T1BF1FK8HU123456');

    expect(result.year).toBeUndefined();
  });
});
