import type { ProviderAdapter } from '../types.js';
import type { AppraiseInput } from '../../schemas/appraise.js';

async function callKbb(_input: AppraiseInput): Promise<number> {
  // TODO: Implement KBB ICO call + normalization to wholesale baseline
  throw new Error('KBB_NOT_CONFIGURED');
}

const kbb: ProviderAdapter = {
  name: 'KBB',
  async quote(input) {
    await callKbb(input);
    return { source: 'KBB', value: 0, currency: 'USD' };
  }
};

export default kbb;
