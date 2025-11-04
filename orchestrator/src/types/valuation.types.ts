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
  request?: any;
}

export interface SourceValuation {
  source: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  currency: string;
}

export interface DepreciationDetails {
  depreciationFactor: number;
  conditionRating: ConditionRating;
  conditionLabel?: string;
  depreciationPercentage?: number;
  depreciationAmount?: number;
  finalWholesaleValue?: number;
  breakdown?: {
    excellent: number;
    veryGood: number;
    good: number;
    fair: number;
    poor: number;
  };
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
  request?: ValuationRequest;
}

export interface ProviderConfig {
  name: string;
  basePrice: number;
  yearAdjustmentRate: number;
  mileageAdjustmentRate: number;
  randomVariance: number;
}
