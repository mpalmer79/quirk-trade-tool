import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class BlackBookProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Black Book',
    basePrice: 18000,
    yearAdjustmentRate: 0.08,
    mileageAdjustmentRate: 0.35,
    randomVariance: 500
  };
}
