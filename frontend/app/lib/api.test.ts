import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateValuation, getPdfReceiptUrl, API_BASE } from './api';

global.fetch = vi.fn();

describe('API Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('calculateValuation', () => {
    const mockFormData = {
      storeId: '1',
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      trim: 'LE',
      mileage: 50000,
      condition: 3,
      vin: '1G1ZT62812F113456',
      options: ['Navigation System'],
      zip: '02108'
    };

    it('makes a POST request to the correct endpoint', async () => {
      const mockResponse = {
        quotes: [{ source: 'KBB', value: 25000 }],
        summary: { confidence: 'High' },
        baseWholesaleValue: 25000,
        depreciation: {
          finalWholesaleValue: 22500,
          conditionLabel: 'Good'
        },
        id: 'test-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await calculateValuation(mockFormData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/valuations/calculate`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('returns formatted valuation data', async () => {
      const mockResponse = {
        quotes: [{ source: 'KBB', value: 25000 }],
        summary: { confidence: 'High' },
        baseWholesaleValue: 25000,
        depreciation: {
          finalWholesaleValue: 22500,
          conditionLabel: 'Good'
        },
        id: 'test-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await calculateValuation(mockFormData);

      expect(result).toEqual({
        quotes: [{ source: 'KBB', value: 25000 }],
        summary: { confidence: 'High' },
        baseWholesaleValue: 25000,
        depreciation: {
          finalWholesaleValue: 22500,
          conditionLabel: 'Good'
        },
        id: 'test-123'
      });
    });

    it('throws error when API returns error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid VIN' })
      });

      await expect(calculateValuation(mockFormData)).rejects.toThrow('Invalid VIN');
    });

    it('throws generic error when no message provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(calculateValuation(mockFormData)).rejects.toThrow('Valuation failed');
    });

    it('converts form data to proper types', async () => {
      const mockResponse = {
        quotes: [],
        summary: {},
        baseWholesaleValue: 0,
        depreciation: {},
        id: 'test'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await calculateValuation(mockFormData);

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      
      expect(typeof callBody.year).toBe('number');
      expect(typeof callBody.mileage).toBe('number');
      expect(typeof callBody.condition).toBe('number');
    });
  });

  describe('getPdfReceiptUrl', () => {
    it('returns correct PDF URL', () => {
      const valuationId = 'test-123';
      const expectedUrl = `${API_BASE}/api/receipt/pdf/${valuationId}`;
      
      expect(getPdfReceiptUrl(valuationId)).toBe(expectedUrl);
    });

    it('handles different valuation IDs', () => {
      expect(getPdfReceiptUrl('abc-456')).toBe(`${API_BASE}/api/receipt/pdf/abc-456`);
      expect(getPdfReceiptUrl('xyz-789')).toBe(`${API_BASE}/api/receipt/pdf/xyz-789`);
    });
  });
});
