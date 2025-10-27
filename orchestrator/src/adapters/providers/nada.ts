import type { ProviderAdapter } from '../types.js';
import type { AppraiseInput } from '../../schemas/appraise.js';

async function callNada(_input: AppraiseInput): Promise<number> {
  // TODO: J.D. Power/NADA call + mapping of condition grades to index 1..5
  throw new Error('NADA_NOT_CONFIGURED');
}

const nada: ProviderAdapter = {
  name: 'NADA',
  async quote(input) {
    await callNada(input);
    return { source: 'NADA', value: 0, currency: 'USD' };
  }
};

export default nada;
