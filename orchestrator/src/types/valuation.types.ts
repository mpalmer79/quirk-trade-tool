/**
 * Valuation Type Definitions
 */

import type { DepreciatedValuation } from '../services/depreciation-calculator';

export interface ValuationRequest {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  conditionRating: 1 | 2 | 3 | 4 | 5;
  options?: string[];
  dealershipId: string;
  zip?: string;
}

export interface SourceValuation {
  provider: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ValuationResult {
  id: string;
  baseWholesaleValue: number;
  depreciation: DepreciatedValuation;
  finalWholesaleValue: number;
  quotes: SourceValuation[];
  vehicle: {
    vin?: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage: number;
  };
  dealership: {
    id: string;
  };
  timestamp: string;
  request?: ValuationRequest;
  _cached?: boolean;
}

export interface ProviderConfig {
  name: string;
  basePrice: number;
  yearAdjustmentRate: number;
  mileageAdjustmentRate: number;
  randomVariance: number;
}
