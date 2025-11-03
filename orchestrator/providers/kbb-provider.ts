import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class KBBProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'KBB',
    basePrice: 17500,
    yearAdjustmentRate: 0.085,
    mileageAdjustmentRate: 0.32,
    randomVariance: 400
  };
}
