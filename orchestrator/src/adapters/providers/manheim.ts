import type { ProviderAdapter } from '../types.js';
import type { AppraiseInput } from '../../schemas/appraise.js';

async function callManheim(_input: AppraiseInput): Promise<number> {
  // TODO: Manheim MMR call (by Year/Make/Model/Trim or by VIN) with region/grade → wholesale
  throw new Error('MANHEIM_NOT_CONFIGURED');
}

const manheim: ProviderAdapter = {
  name: 'Manheim',
  async quote(input) {
    await callManheim(input);
    return { source: 'Manheim', value: 0, currency: 'USD' };
  }
};

export default manheim;
