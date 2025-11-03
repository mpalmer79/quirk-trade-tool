import { BaseProvider } from './base-provider';
import type { ProviderConfig } from '../types/valuation.types';

export class AuctionEdgeProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Auction Edge',
    basePrice: 17600,
    yearAdjustmentRate: 0.085,
    mileageAdjustmentRate: 0.36,
    randomVariance: 350
  };
}
