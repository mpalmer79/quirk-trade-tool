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
      expect.stringContaining('/api/valuations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    expect(result).toEqual(mockResponse);
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
    
    expect(url).toContain('/api/receipt/VAL-123/pdf');
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
