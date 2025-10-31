import type { VinDecodeResult } from '../vin/types.js';

export type VehicleListingResult = {
  status: 'success' | 'error';
  make: string;
  model: string;
  year: number;
  trim?: string;
  listings?: VehicleListing[];
  pricing?: PricingAnalysis;
  errors?: string[];
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
  wholesaleEstimate: number; // Average - 15% dealer markup
  tradeInEstimate: number;   // Average - 20% dealer markup
};

/**
 * Get vehicle listings from auto.dev for comparable vehicles
 * Used for wholesale pricing and market value analysis
 */
export async function getVehicleListings(
  make: string,
  model: string,
  year: number,
  trim?: string,
  condition?: string,
  mileage?: number
): Promise<VehicleListingResult> {
  const apiKey = process.env.AUTODEV_API_KEY;

  if (!apiKey) {
    return {
      status: 'error',
      make,
      model,
      year,
      trim,
      errors: ['autodev_api_key_missing']
    };
  }

  try {
    // Build query parameters
    let endpoint = `https://api.auto.dev/listings`;
    const params = new URLSearchParams({
      make: make.trim(),
      model: model.trim(),
      year: year.toString(),
      limit: '50' // Get up to 50 listings for better pricing analysis
    });

    if (trim) {
      params.append('trim', trim.trim());
    }

    const url = `${endpoint}?${params.toString()}`;

    console.log(`Auto.dev listings: fetching from ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`Auto.dev listings HTTP error: ${res.status}`);
      return {
        status: 'error',
        make,
        model,
        year,
        trim,
        errors: [`autodev_listings_http_${res.status}`]
      };
    }

    const data = await res.json();

    // Parse listings from response
    const listings: VehicleListing[] = (data.listings || data.results || [])
      .slice(0, 50)
      .map((listing: any) => ({
        id: listing.id || listing.vin || 'unknown',
        title: listing.title || `${year} ${make} ${model}`,
        price: Number(listing.price || listing.listPrice || 0),
        mileage: Number(listing.mileage || listing.odometer || 0),
        condition: listing.condition || 'Unknown',
        dealerType: listing.dealerType === 'online' ? 'online' : 'physical',
        dealerName: listing.dealerName || listing.dealer || 'Unknown Dealer',
        dealerLocation: listing.dealerLocation || listing.location || '',
        url: listing.url || listing.listingUrl || undefined,
        postedDate: listing.postedDate || listing.listedDate || undefined
      }));

    // Calculate pricing analysis
    const validListings = listings.filter(l => l.price > 0);

    if (validListings.length === 0) {
      return {
        status: 'error',
        make,
        model,
        year,
        trim,
        listings: [],
        errors: ['no_listings_found']
      };
    }

    const prices = validListings.map(l => l.price);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const mileages = validListings.map(l => l.mileage).filter(m => m > 0);
    const averageMileage = mileages.length > 0 
      ? mileages.reduce((a, b) => a + b, 0) / mileages.length 
      : 0;

    // Adjust for mileage if provided
    let adjustedPrice = averagePrice;
    if (mileage && averageMileage > 0) {
      const mileageDiff = mileage - averageMileage;
      const pricePerMile = 0.10; // Roughly $0.10 per mile depreciation
      adjustedPrice = averagePrice - (mileageDiff * pricePerMile);
    }

    const pricing: PricingAnalysis = {
      averagePrice: Math.round(averagePrice),
      lowestPrice: Math.round(Math.min(...prices)),
      highestPrice: Math.round(Math.max(...prices)),
      priceRange: {
        min: Math.round(Math.min(...prices)),
        max: Math.round(Math.max(...prices))
      },
      averageMileage: Math.round(averageMileage),
      listingCount: validListings.length,
      wholesaleEstimate: Math.round(adjustedPrice * 0.85), // 15% dealer markup
      tradeInEstimate: Math.round(adjustedPrice * 0.80)     // 20% dealer markup
    };

    console.log(`Auto.dev listings success: ${validListings.length} listings found`, {
      make,
      model,
      year,
      averagePrice: pricing.averagePrice,
      wholesaleEstimate: pricing.wholesaleEstimate
    });

    return {
      status: 'success',
      make,
      model,
      year,
      trim,
      listings: validListings,
      pricing
    };
  } catch (error) {
    console.error('Auto.dev listings error:', error);
    return {
      status: 'error',
      make,
      model,
      year,
      trim,
      errors: ['listings_error', error instanceof Error ? error.message : 'unknown_error']
    };
  }
}

/**
 * Get listings for a specific VIN
 * Useful for comparing specific vehicle trades
 */
export async function getListingsForVin(
  vin: string,
  decodedVehicle?: VinDecodeResult
): Promise<VehicleListingResult> {
  if (!decodedVehicle?.make || !decodedVehicle?.model || !decodedVehicle?.year) {
    return {
      status: 'error',
      make: 'unknown',
      model: 'unknown',
      year: 0,
      errors: ['incomplete_vehicle_data']
    };
  }

  return getVehicleListings(
    decodedVehicle.make,
    decodedVehicle.model,
    decodedVehicle.year,
    decodedVehicle.trim
  );
}
