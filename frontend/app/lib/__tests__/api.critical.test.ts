import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateValuation } from '../api';

describe('API Client - Critical', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valuation data from API', async () => {
    const mockResponse = {
      summary: {
        baseWholesale: 25000,
        conditionAdjustment: -2500,
        finalWholesale: 22500,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await calculateValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX',
      mileage: 50000,
      condition: 'good',
      zipCode: '02114',
    });

    expect(result).toEqual(mockResponse);
  });

  it('should throw error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      calculateValuation({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        trim: 'EX',
        mileage: 50000,
        condition: 'good',
        zipCode: '02114',
      })
    ).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      calculateValuation({
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        trim: 'EX',
        mileage: 50000,
        condition: 'good',
        zipCode: '02114',
      })
    ).rejects.toThrow('Network error');
  });

  it('should send correct request payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: {} }),
    });
    global.fetch = mockFetch;

    await calculateValuation({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX',
      mileage: 50000,
      condition: 'good',
      zipCode: '02114',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/valuations/calculate'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      })
    );
  });
});
