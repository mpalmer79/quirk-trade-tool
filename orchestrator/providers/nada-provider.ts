import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class NADAProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'NADA',
    basePrice: 17800,
    yearAdjustmentRate: 0.082,
    mileageAdjustmentRate: 0.33,
    randomVariance: 450
  };
}
