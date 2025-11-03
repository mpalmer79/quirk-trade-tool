/**
 * Quote Aggregation Logic
 * Handles fetching from providers and aggregating results
 */

import pino from 'pino';
import type { ValuationRequest, SourceValuation } from '../types/valuation.types';
import type { BaseProvider } from '../providers/base-provider';

const log = pino();

export class QuoteAggregator {
  /**
   * Fetch valuation from a single provider with timeout
   */
  async fetchFromProvider(
    provider: BaseProvider,
    request: ValuationRequest
  ): Promise<SourceValuation | null> {
    try {
      const startTime = Date.now();
      
      const value = await Promise.race([
        provider.getValue(request),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        ),
      ]);

      const elapsed = Date.now() - startTime;

      if (value === null) return null;

      return {
        provider: provider.getName(),
        value: Math.round(value),
        confidence: this.getConfidenceLevel(provider.getName(), elapsed),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      log.warn({
        message: 'Provider valuation failed',
        provider: provider.getName(),
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Fetch from all providers in parallel
   */
  async fetchFromAllProviders(
    providers: BaseProvider[],
    request: ValuationRequest
  ): Promise<SourceValuation[]> {
    log.info('Fetching valuations from multiple sources');

    const promises = providers.map(provider => 
      this.fetchFromProvider(provider, request)
    );

    const results = await Promise.all(promises);
    const validQuotes = results.filter((q): q is SourceValuation => q !== null);

    if (validQuotes.length === 0) {
      throw new Error('Unable to retrieve valuations - all sources unavailable');
    }

    log.info({
      message: 'Retrieved valuations from multiple sources',
      sourceCount: validQuotes.length,
    });

    return validQuotes;
  }

  /**
   * Calculate aggregate value using weighted average
   */
  calculateAggregateValue(quotes: SourceValuation[]): number {
    if (quotes.length === 0) return 0;

    const weights = { high: 0.35, medium: 0.25, low: 0.10 };
    const totalWeight = quotes.reduce((sum, q) => sum + weights[q.confidence], 0);
    const weighted = quotes.reduce((sum, q) => sum + (q.value * weights[q.confidence]), 0);

    return Math.round(weighted / totalWeight);
  }

  /**
   * Determine confidence level based on provider and response time
   */
  private getConfidenceLevel(
    provider: string, 
    responseTime: number
  ): 'high' | 'medium' | 'low' {
    const highConfidenceProviders = ['Black Book', 'Manheim', 'NADA', 'KBB'];

    if (!highConfidenceProviders.includes(provider)) return 'medium';
    if (responseTime > 5000) return 'medium';

    return 'high';
  }
}
