import { useState, useCallback } from 'react';

export type PricingAnalysis = {
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  averageMileage: number;
  listingCount: number;
  wholesaleEstimate: number;
  tradeInEstimate: number;
};

export type VehicleListing = {
  id: string;
  title: string;
  price: number;
  mileage: number;
  condition: string;
  dealerType: 'physical' | 'online';
  dealerName: string;
  dealerLocation: string;
  url?: string;
  postedDate?: string;
};

export type ListingsData = {
  status: 'success' | 'error';
  make: string;
  model: string;
  year: number;
  trim?: string;
  listings?: VehicleListing[];
  pricing?: PricingAnalysis;
  errors?: string[];
};

interface UseListingsResult {
  data: ListingsData | null;
  loading: boolean;
  error: string | null;
  fetchListings: (make: string, model: string, year: number, trim?: string, mileage?: number) => Promise<void>;
}

/**
 * Hook for fetching vehicle listings and wholesale pricing
 * 
 * Usage:
 * const { data, loading, error, fetchListings } = useVehicleListings();
 * 
 * await fetchListings('Chevrolet', 'Silverado', 2020, 'LT', 45000);
 * 
 * if (data?.pricing) {
 *   console.log('Wholesale Value:', data.pricing.wholesaleEstimate);
 *   console.log('Trade-In Value:', data.pricing.tradeInEstimate);
 * }
 */
export function useVehicleListings(apiBase: string): UseListingsResult {
  const [data, setData] = useState<ListingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (
      make: string,
      model: string,
      year: number,
      trim?: string,
      mileage?: number
    ) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          make,
          model,
          year: year.toString(),
        });

        if (trim) {
          params.append('trim', trim);
        }

        if (mileage) {
          params.append('mileage', mileage.toString());
        }

        const res = await fetch(
          `${apiBase}/api/listings?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // JWT token will be sent automatically by fetch interceptor
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || `Failed to fetch listings (${res.status})`
          );
        }

        const result: ListingsData = await res.json();
        setData(result);

        if (result.status === 'error') {
          setError(
            result.errors?.join(', ') || 'Failed to retrieve listings'
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Listings fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  return { data, loading, error, fetchListings };
}
