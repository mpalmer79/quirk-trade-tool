import type { ProviderAdapter } from './types.js';
import { demoHeuristic } from '../valuation/heuristic.js';

const adapter: ProviderAdapter = {
  name: 'NADA',
  async quote(input) {
    return { source: 'NADA', value: Math.round(demoHeuristic(input) * 0.99), currency: 'USD' };
  }
};

export default adapter;
