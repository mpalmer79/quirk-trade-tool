import type { AppraiseInput } from '../schemas/appraise.js';

export type ValuationSource = 'BlackBook' | 'KBB' | 'NADA' | 'Manheim' | 'Auction';

export interface SourceQuote {
  source: ValuationSource;
  value: number; // normalized wholesale USD
  currency: 'USD';
  meta?: Record<string, unknown>;
}

export interface ProviderAdapter {
  name: ValuationSource;
  quote(input: AppraiseInput): Promise<SourceQuote>;
}
