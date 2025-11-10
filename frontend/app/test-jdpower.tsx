/**
 * JD Power Provider
 * Handles vehicle valuation data from JD Power API
 */

interface JDPowerVehicleIdParams {
  modelyear: number;
  make: string;
  model: string;
}

interface JDPowerValuationParams {
  ucgVehicleId: string;
  mileage?: number;
  zip?: string;
  condition?: string;
}

interface JDPowerVehicleResponse {
  ucgVehicleId: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
}

interface JDPowerValuationResponse {
  ucgVehicleId: string;
  rawValues: {
    baseroughtrade?: number;
    baseaveragetrade?: number;
    basecleantrade?: number;
    basecleanretail?: number;
  };
  formatted: {
    roughTrade?: string;
    averageTrade?: string;
    cleanTrade?: string;
    cleanRetail?: string;
  };
}

/**
 * Look up JD Power UCG Vehicle ID
 * @param params - Vehicle identification parameters
 * @returns Promise with vehicle ID and details
 */
export async function jdLookupUcgVehicleId(
  params: JDPowerVehicleIdParams
): Promise<JDPowerVehicleResponse> {
  const { modelyear, make, model } = params;

  // Validate inputs
  if (!modelyear || !make || !model) {
    throw new Error('Missing required parameters: modelyear, make, model');
  }

  const currentYear = new Date().getFullYear();
  if (modelyear < 1990 || modelyear > currentYear + 2) {
    throw new Error(`Invalid model year: ${modelyear}`);
  }

  try {
    // Check if we're in demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                       !process.env.JDPOWER_API_KEY;

    if (isDemoMode) {
      // Return demo data
      return {
        ucgVehicleId: `DEMO_${make}_${model}_${modelyear}`.replace(/\s+/g, '_').toUpperCase(),
        year: modelyear,
        make: make,
        model: model,
        trim: 'Base'
      };
    }

    // Production API call
    const apiKey = process.env.JDPOWER_API_KEY;
    const apiUrl = process.env.JDPOWER_API_URL || 'https://api.jdpower.com/v1';

    const response = await fetch(`${apiUrl}/vehicles/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        modelyear,
        make,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`JD Power API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      ucgVehicleId: data.ucgVehicleId || data.id,
      year: data.year || modelyear,
      make: data.make || make,
      model: data.model || model,
      trim: data.trim,
    };
  } catch (error) {
    console.error('Error looking up JD Power vehicle ID:', error);
    throw new Error(
      `Failed to lookup vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetch valuation values from JD Power
 * @param params - Valuation parameters including vehicle ID
 * @returns Promise with valuation data
 */
export async function jdFetchValues(
  params: JDPowerValuationParams
): Promise<JDPowerValuationResponse> {
  const { ucgVehicleId, mileage = 50000, zip = '02184', condition = 'average' } = params;

  if (!ucgVehicleId) {
    throw new Error('Missing required parameter: ucgVehicleId');
  }

  try {
    // Check if we're in demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                       !process.env.JDPOWER_API_KEY;

    if (isDemoMode) {
      // Generate realistic demo values based on mileage
      const baseValue = 25000;
      const mileageAdjustment = (mileage / 100000) * 0.3;
      const adjustedValue = baseValue * (1 - mileageAdjustment);

      const roughTrade = Math.round(adjustedValue * 0.75);
      const averageTrade = Math.round(adjustedValue * 0.85);
      const cleanTrade = Math.round(adjustedValue * 0.95);
      const cleanRetail = Math.round(adjustedValue * 1.15);

      return {
        ucgVehicleId,
        rawValues: {
          baseroughtrade: roughTrade,
          baseaveragetrade: averageTrade,
          basecleantrade: cleanTrade,
          basecleanretail: cleanRetail,
        },
        formatted: {
          roughTrade: roughTrade > 0 ? `$${roughTrade.toLocaleString()}` : 'N/A',
          averageTrade: averageTrade > 0 ? `$${averageTrade.toLocaleString()}` : 'N/A',
          cleanTrade: cleanTrade > 0 ? `$${cleanTrade.toLocaleString()}` : 'N/A',
          cleanRetail: cleanRetail > 0 ? `$${cleanRetail.toLocaleString()}` : 'N/A',
        },
      };
    }

    // Production API call
    const apiKey = process.env.JDPOWER_API_KEY;
    const apiUrl = process.env.JDPOWER_API_URL || 'https://api.jdpower.com/v1';

    const response = await fetch(`${apiUrl}/valuations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ucgVehicleId,
        mileage,
        zip,
        condition,
      }),
    });

    if (!response.ok) {
      throw new Error(`JD Power API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract and format values
    const rawValues = {
      baseroughtrade: data.values?.roughTrade || data.roughTrade || 0,
      baseaveragetrade: data.values?.averageTrade || data.averageTrade || 0,
      basecleantrade: data.values?.cleanTrade || data.cleanTrade || 0,
      basecleanretail: data.values?.retailValue || data.cleanRetail || 0,
    };

    const formatted = {
      roughTrade: rawValues.baseroughtrade > 0 
        ? `$${rawValues.baseroughtrade.toLocaleString()}` 
        : 'N/A',
      averageTrade: rawValues.baseaveragetrade > 0 
        ? `$${rawValues.baseaveragetrade.toLocaleString()}` 
        : 'N/A',
      cleanTrade: rawValues.basecleantrade > 0 
        ? `$${rawValues.basecleantrade.toLocaleString()}` 
        : 'N/A',
      cleanRetail: rawValues.basecleanretail > 0 
        ? `$${rawValues.basecleanretail.toLocaleString()}` 
        : 'N/A',
    };

    return {
      ucgVehicleId,
      rawValues,
      formatted,
    };
  } catch (error) {
    console.error('Error fetching JD Power values:', error);
    throw new Error(
      `Failed to fetch valuations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Helper function to format currency values
 */
function formatCurrency(value: number | null | undefined): string {
  if (!value || value <= 0) return 'N/A';
  return `$${value.toLocaleString()}`;
}

/**
 * Helper function to validate ZIP code
 */
function isValidZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

// Export types for use in other files
export type {
  JDPowerVehicleIdParams,
  JDPowerValuationParams,
  JDPowerVehicleResponse,
  JDPowerValuationResponse,
};
