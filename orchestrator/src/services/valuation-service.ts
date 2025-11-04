/**
 * Valuation Service
 * Orchestrates multi-provider valuation with caching and depreciation
 */

import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { BlackBookProvider } from '../providers/black-book.js';
import { ManheimProvider } from '../providers/manheim.js';
import { NADAProvider } from '../providers/nada.js';
import { KBBProvider } from '../providers/kbb.js';
import { QuoteAggregator } from '../aggregators/quote-aggregator.js';
import { depreciationCalculator } from './depreciation-calculator.js';
import type { ValuationRequest, ValuationResult } from '../types/valuation.types.js';

const log = pino();

class ValuationService {
  private providers = [
    new BlackBookProvider(),
    new ManheimProvider(),
    new NADAProvider(),
    new KBBProvider(),
  ];
  
  private aggregator = new QuoteAggregator();

  async calculateValuation(request: ValuationRequest): Promise<ValuationResult> {
    const valuationId = `VAL-${Date.now()}-${uuidv4().slice(0, 8)}`;
    
    log.info({ valuationId, request }, 'Starting valuation calculation');

    // Fetch quotes from all providers
    const quotes = await this.aggregator.fetchFromAllProviders(this.providers, request);
    
    // Calculate base wholesale value
    const baseWholesaleValue = this.aggregator.calculateAggregateValue(quotes);
    
    // Apply depreciation
    const depreciation = depreciationCalculator.calculateDepreciation({
      year: request.year,
      mileage: request.mileage,
      conditionRating: request.conditionRating,
    });
    
    const finalWholesaleValue = Math.round(baseWholesaleValue * depreciation.depreciationFactor);
    
    log.info({ valuationId, baseWholesaleValue, finalWholesaleValue }, 'Valuation complete');

    return {
      id: valuationId,
      baseWholesaleValue,
      depreciation,
      finalWholesaleValue,
      quotes,
      vehicle: {
        year: request.year,
        make: request.make,
        model: request.model,
        trim: request.trim,
        mileage: request.mileage,
        vin: request.vin,
      },
      dealership: {
        id: request.dealershipId,
      },
      timestamp: new Date().toISOString(),
      _cached: false,
    };
  }

  async getValuationHistory(
    vin: string,
    days: number,
    dealershipId: string
  ): Promise<ValuationResult[]> {
    // Mock implementation - replace with actual database query
    log.info({ vin, days, dealershipId }, 'Fetching valuation history');
    return [];
  }

  async getModelStatistics(
    year: number,
    make: string,
    model: string,
    days: number,
    dealershipId: string
  ) {
    // Mock implementation - replace with actual database query
    log.info({ year, make, model, days, dealershipId }, 'Fetching model statistics');
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
