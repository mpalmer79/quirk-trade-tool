import { BaseProvider } from './base-provider';
import type { ProviderConfig, ValuationRequest } from '../types/valuation.types';
import { db } from '../db/index.js';

export class QuincyAutoProvider extends BaseProvider {
  protected config: ProviderConfig = {
    name: 'Quincy Auto',
    basePrice: 17700,
    yearAdjustmentRate: 0.083,
    mileageAdjustmentRate: 0.31,
    randomVariance: 420
  };

  /**
   * Override getValue to use real auction data when available
   */
  async getValue(request: ValuationRequest): Promise<number | null> {
    try {
      // CRITICAL: Try to get real auction data first
      const auctionValue = await this.getAuctionValue(request);
      
      if (auctionValue !== null) {
        console.log(`✅ Quincy Auto: Using real auction data - $${auctionValue}`);
        return auctionValue;
      }

      // Fallback to base provider calculation if no auction data
      console.log('⚠️  Quincy Auto: No auction data found, using estimation');
      return super.getValue(request);
      
    } catch (error) {
      console.error('Quincy Auto provider error:', error);
      // Fallback to base calculation on error
      return super.getValue(request);
    }
  }

  /**
   * Get weighted average from real QAA auction data
   * 
   * Strategy:
   * 1. Look for exact VIN matches (highest priority)
   * 2. Look for same make/model/year (high priority)
   * 3. Look for same make/model within 2 years (medium priority)
   * 4. Weight recent sales more heavily
   * 5. Return null if insufficient data
   */
  private async getAuctionValue(request: ValuationRequest): Promise<number | null> {
    const { vin, year, make, model } = request;

    // ============================================================================
    // STRATEGY 1: Exact VIN Match (Best Case)
    // ============================================================================
    if (vin) {
      const vinResult = await db.query(
        `SELECT sale_price, sale_date 
         FROM qaa_auction_data 
         WHERE vin = $1 
         ORDER BY sale_date DESC 
         LIMIT 5`,
        [vin]
      );

      if (vinResult.rows.length > 0) {
        return this.calculateWeightedAverage(vinResult.rows, 'exact_vin');
      }
    }

    // ============================================================================
    // STRATEGY 2: Same Make/Model/Year
    // ============================================================================
    const exactMatchResult = await db.query(
      `SELECT sale_price, sale_date 
       FROM qaa_auction_data 
       WHERE LOWER(make) = LOWER($1) 
       AND LOWER(model) = LOWER($2) 
       AND year = $3
       AND sale_date >= NOW() - INTERVAL '1 year'
       ORDER BY sale_date DESC 
       LIMIT 20`,
      [make, model, year]
    );

    if (exactMatchResult.rows.length >= 3) {
      // Need at least 3 data points for reliability
      return this.calculateWeightedAverage(exactMatchResult.rows, 'exact_match');
    }

    // ============================================================================
    // STRATEGY 3: Similar Vehicles (Same Make/Model, ±2 Years)
    // ============================================================================
    const similarResult = await db.query(
      `SELECT sale_price, sale_date, year
       FROM qaa_auction_data 
       WHERE LOWER(make) = LOWER($1) 
       AND LOWER(model) = LOWER($2) 
       AND year BETWEEN $3 AND $4
       AND sale_date >= NOW() - INTERVAL '18 months'
       ORDER BY 
         ABS(year - $5) ASC,  -- Prefer closer years
         sale_date DESC 
       LIMIT 30`,
      [make, model, year - 2, year + 2, year]
    );

    if (similarResult.rows.length >= 5) {
      // Need at least 5 data points for similar matches
      const avgPrice = this.calculateWeightedAverage(similarResult.rows, 'similar');
      
      // Adjust for year difference if needed
      if (avgPrice !== null) {
        return this.adjustForYearDifference(avgPrice, year, similarResult.rows);
      }
    }

    // ============================================================================
    // INSUFFICIENT DATA: Return null to use fallback calculation
    // ============================================================================
    return null;
  }

  /**
   * Calculate weighted average with recency bias
   * More recent sales have higher weight
   */
  private calculateWeightedAverage(
    rows: Array<{ sale_price: number; sale_date: Date }>,
    strategy: 'exact_vin' | 'exact_match' | 'similar'
  ): number | null {
    if (rows.length === 0) return null;

    const now = new Date();
    let totalWeight = 0;
    let weightedSum = 0;

    for (const row of rows) {
      const price = row.sale_price / 100; // Convert from cents to dollars
      const saleDate = new Date(row.sale_date);
      
      // Calculate age in days
      const ageInDays = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Weight calculation: Exponential decay
      // Recent sales have much higher weight
      let weight = 1;
      
      switch (strategy) {
        case 'exact_vin':
          // Very high confidence, decay slower
          weight = Math.exp(-ageInDays / 365);
          break;
        case 'exact_match':
          // High confidence, moderate decay
          weight = Math.exp(-ageInDays / 180);
          break;
        case 'similar':
          // Medium confidence, faster decay
          weight = Math.exp(-ageInDays / 120);
          break;
      }

      weightedSum += price * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return null;

    const weightedAvg = Math.round(weightedSum / totalWeight);
    console.log(`📊 QAA ${strategy}: ${rows.length} sales, weighted avg = $${weightedAvg}`);
    
    return weightedAvg;
  }

  /**
   * Adjust price for year differences in similar vehicle matches
   */
  private adjustForYearDifference(
    avgPrice: number,
    targetYear: number,
    rows: Array<{ year: number; sale_price: number }>
  ): number {
    // Calculate average year of the data
    const avgYear = rows.reduce((sum, row) => sum + row.year, 0) / rows.length;
    const yearDiff = targetYear - avgYear;

    // Apply depreciation adjustment: ~10% per year
    const depreciationRate = 0.10;
    const adjustmentFactor = 1 - (yearDiff * depreciationRate);

    const adjustedPrice = Math.round(avgPrice * adjustmentFactor);
    
    console.log(`📐 Year adjustment: avg year ${avgYear.toFixed(1)} -> ${targetYear}, factor ${adjustmentFactor.toFixed(2)}, $${avgPrice} -> $${adjustedPrice}`);
    
    return adjustedPrice;
  }
}
