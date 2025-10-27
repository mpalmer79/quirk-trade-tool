import type { ProviderAdapter } from './types.js';
import { demoHeuristic } from '../valuation/heuristic.js';

const adapter: ProviderAdapter = {
  name: 'KBB',
  async quote(input) {
    return { source: 'KBB', value: Math.round(demoHeuristic(input) * 1.02), currency: 'USD' };
  }
};

export default adapter;
