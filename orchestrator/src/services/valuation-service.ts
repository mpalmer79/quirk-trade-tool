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
import { db } from '../db/index.js';
import type { 
  ValuationRequest, 
  ValuationResult, 
  SourceValuation,
  DepreciationDetails 
} from '../types/valuation.types';

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

    // Cache, log, and store history
    await this.cacheResult(request, result);
    await this.logValuationEvent(result);
    await this.storeValuationHistory(result);

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
    quotes: SourceValuation[],
    baseWholesaleValue: number,
    depreciation: DepreciationDetails
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

  private async storeValuationHistory(result: ValuationResult): Promise<void> {
    try {
      const query = `
        INSERT INTO valuation_history (
          valuation_id, vin, year, make, model, trim, mileage,
          condition_rating, base_wholesale_value, final_wholesale_value,
          dealership_id, user_id, zip_code, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (valuation_id) DO NOTHING
      `;
      
      await db.query(query, [
        result.id,
        result.vehicle.vin || null,
        result.vehicle.year,
        result.vehicle.make,
        result.vehicle.model,
        result.vehicle.trim || null,
        result.vehicle.mileage,
        result.depreciation.conditionRating,
        result.baseWholesaleValue,
        result.finalWholesaleValue,
        result.dealership.id,
        result.userId || 'anonymous',
        result.request?.zip || null
      ]);
      
      log.info(`Stored valuation ${result.id} in history`);
    } catch (error) {
      log.warn('Failed to store valuation history', error);
      // Don't throw - historical storage is not critical for valuation flow
    }
  }

  async getValuationHistory(vin: string, days: number = 30, dealershipId?: string): Promise<ValuationResult[]> {
    try {
      let query = `
        SELECT 
          valuation_id as id,
          vin,
          year,
          make,
          model,
          trim,
          mileage,
          condition_rating,
          base_wholesale_value,
          final_wholesale_value,
          dealership_id,
          user_id,
          created_at as timestamp
        FROM valuation_history
        WHERE vin = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      
      const params: any[] = [vin];
      
      if (dealershipId) {
        query += ' AND dealership_id = $2';
        params.push(dealershipId);
      }
      
      query += ' ORDER BY created_at DESC LIMIT 50';
      
      const result = await db.query(query, params);
      
      // Transform to ValuationResult format
      return result.rows.map((row: any) => ({
        id: row.id,
        baseWholesaleValue: parseFloat(row.base_wholesale_value),
        finalWholesaleValue: parseFloat(row.final_wholesale_value),
        depreciation: {
          conditionRating: row.condition_rating,
          depreciationFactor: parseFloat(row.final_wholesale_value) / parseFloat(row.base_wholesale_value),
        },
        quotes: [], // Not stored in history
        vehicle: {
          vin: row.vin,
          year: row.year,
          make: row.make,
          model: row.model,
          trim: row.trim,
          mileage: row.mileage,
        },
        dealership: { id: row.dealership_id },
        timestamp: row.timestamp,
        userId: row.user_id,
      }));
      
    } catch (error) {
      log.error('Failed to retrieve valuation history', error);
      return [];
    }
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
    trend?: {
      direction: 'rising' | 'falling' | 'stable';
      percentage: number;
      description: string;
    };
  }> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_appraisals,
          AVG(final_wholesale_value) as avg_value,
          MIN(final_wholesale_value) as min_value,
          MAX(final_wholesale_value) as max_value,
          AVG(condition_rating) as avg_condition,
          MAX(created_at) as last_updated
        FROM valuation_history
        WHERE year = $1
          AND LOWER(make) = LOWER($2)
          AND LOWER(model) = LOWER($3)
          AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      
      const params: any[] = [year, make, model];
      
      if (dealershipId) {
        query += ' AND dealership_id = $4';
        params.push(dealershipId);
      }
      
      const result = await db.query(query, params);
      const row = result.rows[0];
      
      // Calculate trend
      const trend = await this.calculateTrend(year, make, model, days, dealershipId);
      
      return {
        totalAppraisals: parseInt(row.total_appraisals) || 0,
        averageValue: parseFloat(row.avg_value) || 0,
        minValue: parseFloat(row.min_value) || 0,
        maxValue: parseFloat(row.max_value) || 0,
        avgCondition: parseFloat(row.avg_condition) || 0,
        lastUpdated: row.last_updated || new Date().toISOString(),
        trend,
      };
      
    } catch (error) {
      log.error('Failed to retrieve model statistics', error);
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

  private async calculateTrend(
    year: number,
    make: string,
    model: string,
    days: number,
    dealershipId?: string
  ): Promise<{
    direction: 'rising' | 'falling' | 'stable';
    percentage: number;
    description: string;
  } | undefined> {
    try {
      // Split time period in half to compare
      const halfDays = Math.floor(days / 2);
      
      let query = `
        SELECT 
          CASE 
            WHEN created_at >= NOW() - INTERVAL '${halfDays} days' THEN 'recent'
            ELSE 'older'
          END as period,
          AVG(final_wholesale_value) as avg_value
        FROM valuation_history
        WHERE year = $1
          AND LOWER(make) = LOWER($2)
          AND LOWER(model) = LOWER($3)
          AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      
      const params: any[] = [year, make, model];
      
      if (dealershipId) {
        query += ' AND dealership_id = $4';
        params.push(dealershipId);
      }
      
      query += ' GROUP BY period';
      
      const result = await db.query(query, params);
      
      if (result.rows.length < 2) {
        return undefined; // Not enough data
      }
      
      const recentRow = result.rows.find((r: any) => r.period === 'recent');
      const olderRow = result.rows.find((r: any) => r.period === 'older');
      
      if (!recentRow || !olderRow) return undefined;
      
      const recentAvg = parseFloat(recentRow.avg_value);
      const olderAvg = parseFloat(olderRow.avg_value);
      
      const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let direction: 'rising' | 'falling' | 'stable';
      let description: string;
      
      if (Math.abs(percentageChange) < 2) {
        direction = 'stable';
        description = `Market is stable (${percentageChange.toFixed(1)}% change)`;
      } else if (percentageChange > 0) {
        direction = 'rising';
        description = `Market is rising (+${percentageChange.toFixed(1)}%)`;
      } else {
        direction = 'falling';
        description = `Market is falling (${percentageChange.toFixed(1)}%)`;
      }
      
      return {
        direction,
        percentage: parseFloat(percentageChange.toFixed(2)),
        description,
      };
      
    } catch (error) {
      log.warn('Failed to calculate trend', error);
      return undefined;
    }
  }
}

export const valuationService = new ValuationService();
