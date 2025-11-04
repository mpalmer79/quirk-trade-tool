/**
 * Core valuation type definitions
 */

export type ConditionRating = 1 | 2 | 3 | 4 | 5;

export interface ValuationRequest {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  conditionRating: ConditionRating;
  options?: string[];
  dealershipId: string;
  zip?: string;
}

export interface SourceValuation {
  source: string;  // Changed from 'provider' to 'source'
  value: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  currency: string;  // Added this field
}

export interface DepreciationDetails {
  depreciationFactor: number;
  conditionRating: ConditionRating;
  yearFactor?: number;
  mileageFactor?: number;
  conditionFactor?: number;
}

export interface ValuationResult {
  id: string;
  baseWholesaleValue: number;
  depreciation: DepreciationDetails;
  finalWholesaleValue: number;
  quotes: SourceValuation[];
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage: number;
    vin?: string;
  };
  dealership: {
    id: string;
  };
  timestamp: string;
  userId?: string;
  _cached?: boolean;
}

export interface ProviderConfig {
  name: string;
  basePrice: number;
  yearAdjustmentRate: number;
  mileageAdjustmentRate: number;
  randomVariance: number;
}
