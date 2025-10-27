import type { ProviderAdapter } from '../types.js';
import type { AppraiseInput } from '../../schemas/appraise.js';

async function callBlackBook(_input: AppraiseInput): Promise<number> {
  // TODO: Implement with Black Book API (requires license & API key)
  // Return normalized wholesale USD for a given condition index.
  throw new Error('BLACKBOOK_NOT_CONFIGURED');
}

const blackbook: ProviderAdapter = {
  name: 'BlackBook',
  async quote(input) {
    // Fallback: throw until configured
    await callBlackBook(input);
    return { source: 'BlackBook', value: 0, currency: 'USD' };
  }
};

export default blackbook;
