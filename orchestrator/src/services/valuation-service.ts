/**
 * Valuation Service
 * Orchestrates multi-source vehicle valuation with depreciation
 */

import pino from 'pino';
import { depreciationCalculator } from './depreciation-calculator';
import { cacheValuationResult, getValuationFromCache } from '../lib/cache';
import { providers } from '../providers';
import { QuoteAggregator } from '../aggregators/quote-aggregator';
import { generateValuationId } from '../utils/valuation.utils';
import type { ValuationRequest, ValuationResult } from '../types/valuation.types';

const log = pino();
const aggregator = new QuoteAggregator();

export class ValuationService {
  async calculateValuation(request: ValuationRequest): Promise<ValuationResult> {
    log.info({
      message: 'Starting valuation calculation',
      vehicle: `${request.year} ${request.make} ${request.model}`,
    });

    // Check cache
    const cached = await this.checkCache(request);
    if (cached) return cached;

    // Fetch from providers
    const quotes = await aggregator.fetchFromAllProviders(providers, request);
    
    // Calculate base value
    const baseWholesaleValue = aggregator.calculateAggregateValue(quotes);

    // Apply depreciation
    const depreciation = depreciationCalculator.calculateDepreciation(
      baseWholesaleValue,
      request.conditionRating
    );

    // Build result
    const result = this.buildResult(
      request,
      quotes,
      baseWholesaleValue,
      depreciation
    );

    // Cache and log
    await this.cacheResult(request, result);
    await this.logValuationEvent(result);

    return result;
  }

  private async checkCache(request: ValuationRequest): Promise<ValuationResult | null> {
    try {
      const cached = await getValuationFromCache(
        request.vin || `${request.year}-${request.make}-${request.model}`,
        request.conditionRating,
        request.mileage
      );
      if (cached) {
        log.info('Cache hit');
        return { ...cached, _cached: true };
      }
    } catch (error) {
      log.warn('Cache lookup failed');
    }
    return null;
  }

  private buildResult(
    request: ValuationRequest,
    quotes: any[],
    baseWholesaleValue: number,
    depreciation: any
  ): ValuationResult {
    return {
      id: generateValuationId(),
      baseWholesaleValue,
      depreciation,
      finalWholesaleValue: depreciation.finalWholesaleValue,
      quotes,
      vehicle: {
        vin: request.vin,
        year: request.year,
        make: request.make,
        model: request.model,
        trim: request.trim,
        mileage: request.mileage,
      },
      dealership: { id: request.dealershipId },
      timestamp: new Date().toISOString(),
      request,
    };
  }

  private async cacheResult(request: ValuationRequest, result: ValuationResult): Promise<void> {
    try {
      await cacheValuationResult(
        request.vin || `${request.year}-${request.make}-${request.model}`,
        request.conditionRating,
        request.mileage,
        result
      );
    } catch (error) {
      log.warn('Cache storage failed');
    }
  }

  private async logValuationEvent(result: ValuationResult): Promise<void> {
    try {
      log.info({
        message: 'Valuation complete',
        valuationId: result.id,
        baseValue: result.baseWholesaleValue,
        finalValue: result.finalWholesaleValue,
      });
    } catch (error) {
      log.error('Failed to log event');
    }
  }

  async getValuationHistory(vin: string, days: number = 30, _dealershipId?: string): Promise<ValuationResult[]> {
    return [];
  }

  async getModelStatistics(
    year: number,
    make: string,
    model: string,
    days: number = 30,
    dealershipId?: string
  ): Promise<{
    totalAppraisals: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    avgCondition: number;
    lastUpdated: string;
  }> {
    log.info({
      message: 'Retrieving model statistics',
      year,
      make,
      model,
      days,
      dealershipId,
    });
    
    return {
      totalAppraisals: 0,
      averageValue: 0,
      minValue: 0,
      maxValue: 0,
      avgCondition: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const valuationService = new ValuationService();
