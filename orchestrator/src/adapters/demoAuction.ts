import type { ProviderAdapter } from './types.js';
import { demoHeuristic } from '../valuation/heuristic.js';

const adapter: ProviderAdapter = {
  name: 'Auction',
  async quote(input) {
    return { source: 'Auction', value: Math.round(demoHeuristic(input) * 0.93), currency: 'USD' };
  }
};

export default adapter;
