import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class ManheimProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Manheim',
    basePrice: 17300,
    yearAdjustmentRate: 0.088,
    mileageAdjustmentRate: 0.34,
    randomVariance: 500
  };
}
