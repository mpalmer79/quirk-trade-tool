import type { ProviderAdapter } from './types.js';
import { demoHeuristic } from '../valuation/heuristic.js';

const adapter: ProviderAdapter = {
  name: 'BlackBook',
  async quote(input) {
    return { source: 'BlackBook', value: Math.round(demoHeuristic(input) * 0.97), currency: 'USD' };
  }
};

export default adapter;
