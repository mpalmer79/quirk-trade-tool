import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class QuincyAutoProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Quincy Auto',
    basePrice: 17700,
    yearAdjustmentRate: 0.083,
    mileageAdjustmentRate: 0.31,
    randomVariance: 420
  };
}
