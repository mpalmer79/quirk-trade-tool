import type { ProviderAdapter } from './types.js';
import { demoHeuristic } from '../valuation/heuristic.js';

const adapter: ProviderAdapter = {
  name: 'Manheim',
  async quote(input) {
    return { source: 'Manheim', value: Math.round(demoHeuristic(input) * 0.95), currency: 'USD' };
  }
};

export default adapter;
