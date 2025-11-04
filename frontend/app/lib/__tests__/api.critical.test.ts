import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateValuation, getPdfReceiptUrl } from '../api';

global.fetch = vi.fn();

describe('API Client - Critical', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call valuation endpoint with correct data', async () => {
    const mockResponse = {
      id: 'VAL-123',
      baseWholesaleValue: 22000,
      finalWholesaleValue: 19800,
      quotes: [
        { source: 'KBB', value: 22000, currency: 'USD' },
        { source: 'BlackBook', value: 21500, currency: 'USD' },
      ],
      summary: {
        low: 21000,
        high: 23000,
        avg: 22000,
        confidence: 'High' as const,
      },
      depreciation: {
        depreciationFactor: 0.9,
        conditionRating: 3,
        finalWholesaleValue: 19800,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await calculateValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      condition: 3,
      storeId: 'quirk-chevy-manchester',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/valuations/calculate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(result.id).toBe('VAL-123');
    expect(result.baseWholesaleValue).toBe(22000);
    expect(result.quotes).toHaveLength(2);
  });

  it('should throw error on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });

    await expect(
      calculateValuation({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      })
    ).rejects.toThrow();
  });

  it('should generate correct PDF URL', () => {
    const url = getPdfReceiptUrl('VAL-123');
    
    expect(url).toMatch(/\/api\/receipt\/pdf\/VAL-123$/);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      calculateValuation({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
        condition: 3,
        storeId: 'quirk-chevy-manchester',
      })
    ).rejects.toThrow('Network error');
  });
});
