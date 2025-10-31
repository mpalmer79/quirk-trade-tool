/**
 * Valuation Service
 * Orchestrates multi-source vehicle valuation with depreciation factor application
 * 
 * Flow:
 * 1. Fetch from multiple providers (Black Book, KBB, NADA, Manheim, etc.)
 * 2. Aggregate into base wholesale value
 * 3. Apply depreciation factor based on condition
 * 4. Return comprehensive valuation result
 */

import { depreciationCalculator, type DepreciatedValuation } from './depreciation-calculator';
import { cacheValuationResult, getValuationFromCache } from '../lib/cache';
import { getRegionalAdjustment } from '../valuation/regional-adjustment.js';

// Types
export interface ValuationRequest {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  conditionRating: 1 | 2 | 3 | 4 | 5;
  options?: string[];
  dealershipId: string;
  zip?: string;  // ZIP code for regional pricing adjustments
}

export interface SourceValuation {
  provider: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface ValuationResult {
  id: string;
  baseWholesaleValue: number;
  depreciation: DepreciatedValuation;
  finalWholesaleValue: number;
  quotes: SourceValuation[];
  vehicle: {
    vin?: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage: number;
  };
  dealership: {
    id: string;
  };
  timestamp: string;
  request?: ValuationRequest;
  _cached?: boolean;
}

// ✅ UPDATED: Mock provider implementations with realistic data
async function getBlackBookValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 22000,
      'Audi': 28000,
      'BMW': 30000,
      'Cadillac': 26000,
      'Chevrolet': 18000,
      'Chrysler': 16000,
      'Dodge': 17000,
      'Ford': 19000,
      'GMC': 22000,
      'Honda': 18000,
      'Hyundai': 15000,
      'Jeep': 19000,
      'Kia': 15000,
      'Lexus': 32000,
      'Mazda': 16000,
      'Mercedes-Benz': 38000,
      'Nissan': 16000,
      'Ram': 21000,
      'Subaru': 18000,
      'Tesla': 35000,
      'Toyota': 20000,
      'Volkswagen': 17000,
      'Volvo': 24000,
    };

    const basePrice = basePrices[request.make] || 18000;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.08; // 8% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.35; // 35% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment based on ZIP code
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 500 - 250)); // ±$250 variance
  } catch (error) {
    console.error('Black Book valuation failed:', error);
    return null;
  }
}

async function getKBBValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 21500,
      'Audi': 27500,
      'BMW': 29500,
      'Cadillac': 25500,
      'Chevrolet': 17500,
      'Chrysler': 15500,
      'Dodge': 16500,
      'Ford': 18500,
      'GMC': 21500,
      'Honda': 17500,
      'Hyundai': 14500,
      'Jeep': 18500,
      'Kia': 14500,
      'Lexus': 31500,
      'Mazda': 15500,
      'Mercedes-Benz': 37500,
      'Nissan': 15500,
      'Ram': 20500,
      'Subaru': 17500,
      'Tesla': 34500,
      'Toyota': 19500,
      'Volkswagen': 16500,
      'Volvo': 23500,
    };

    const basePrice = basePrices[request.make] || 17500;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.085; // 8.5% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.32; // 32% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 400 - 200)); // ±$200 variance
  } catch (error) {
    console.error('KBB valuation failed:', error);
    return null;
  }
}

async function getNADAValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 21800,
      'Audi': 27800,
      'BMW': 29800,
      'Cadillac': 25800,
      'Chevrolet': 17800,
      'Chrysler': 15800,
      'Dodge': 16800,
      'Ford': 18800,
      'GMC': 21800,
      'Honda': 17800,
      'Hyundai': 14800,
      'Jeep': 18800,
      'Kia': 14800,
      'Lexus': 31800,
      'Mazda': 15800,
      'Mercedes-Benz': 37800,
      'Nissan': 15800,
      'Ram': 20800,
      'Subaru': 17800,
      'Tesla': 34800,
      'Toyota': 19800,
      'Volkswagen': 16800,
      'Volvo': 23800,
    };

    const basePrice = basePrices[request.make] || 17800;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.082; // 8.2% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.33; // 33% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 450 - 225)); // ±$225 variance
  } catch (error) {
    console.error('NADA valuation failed:', error);
    return null;
  }
}

async function getManheimValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 21300,
      'Audi': 27300,
      'BMW': 29300,
      'Cadillac': 25300,
      'Chevrolet': 17300,
      'Chrysler': 15300,
      'Dodge': 16300,
      'Ford': 18300,
      'GMC': 21300,
      'Honda': 17300,
      'Hyundai': 14300,
      'Jeep': 18300,
      'Kia': 14300,
      'Lexus': 31300,
      'Mazda': 15300,
      'Mercedes-Benz': 37300,
      'Nissan': 15300,
      'Ram': 20300,
      'Subaru': 17300,
      'Tesla': 34300,
      'Toyota': 19300,
      'Volkswagen': 16300,
      'Volvo': 23300,
    };

    const basePrice = basePrices[request.make] || 17300;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.088; // 8.8% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.34; // 34% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 500 - 250)); // ±$250 variance
  } catch (error) {
    console.error('Manheim valuation failed:', error);
    return null;
  }
}

async function getAuctionEdgeValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 21600,
      'Audi': 27600,
      'BMW': 29600,
      'Cadillac': 25600,
      'Chevrolet': 17600,
      'Chrysler': 15600,
      'Dodge': 16600,
      'Ford': 18600,
      'GMC': 21600,
      'Honda': 17600,
      'Hyundai': 14600,
      'Jeep': 18600,
      'Kia': 14600,
      'Lexus': 31600,
      'Mazda': 15600,
      'Mercedes-Benz': 37600,
      'Nissan': 15600,
      'Ram': 20600,
      'Subaru': 17600,
      'Tesla': 34600,
      'Toyota': 19600,
      'Volkswagen': 16600,
      'Volvo': 23600,
    };

    const basePrice = basePrices[request.make] || 17600;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.085; // 8.5% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.36; // 36% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 350 - 175)); // ±$175 variance
  } catch (error) {
    console.error('Auction Edge valuation failed:', error);
    return null;
  }
}

async function getQuincyAutoValue(request: ValuationRequest): Promise<number | null> {
  try {
    const basePrices: Record<string, number> = {
      'Acura': 21700,
      'Audi': 27700,
      'BMW': 29700,
      'Cadillac': 25700,
      'Chevrolet': 17700,
      'Chrysler': 15700,
      'Dodge': 16700,
      'Ford': 18700,
      'GMC': 21700,
      'Honda': 17700,
      'Hyundai': 14700,
      'Jeep': 18700,
      'Kia': 14700,
      'Lexus': 31700,
      'Mazda': 15700,
      'Mercedes-Benz': 37700,
      'Nissan': 15700,
      'Ram': 20700,
      'Subaru': 17700,
      'Tesla': 34700,
      'Toyota': 19700,
      'Volkswagen': 16700,
      'Volvo': 23700,
    };

    const basePrice = basePrices[request.make] || 17700;
    const yearAdjustment = (new Date().getFullYear() - request.year) * 0.083; // 8.3% per year
    const mileageAdjustment = (request.mileage / 100000) * 0.31; // 31% per 100k miles
    let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
    
    // Apply regional market adjustment
    const regionalMultiplier = getRegionalAdjustment({
      year: request.year,
      make: request.make,
      model: request.model,
      trim: request.trim,
      mileage: request.mileage,
      condition: request.conditionRating,
      options: request.options,
      zip: request.zip
    });
    adjustedPrice *= regionalMultiplier;
    
    return Math.round(adjustedPrice + (Math.random() * 420 - 210)); // ±$210 variance
  } catch (error) {
    console.error('Quincy Auto valuation failed:', error);
    return null;
  }
}

// Helper: Fetch from single provider with timeout
async function fetchValuation(
  provider: string,
  fetcher: () => Promise<number | null>
): Promise<SourceValuation | null> {
  try {
    const startTime = Date.now();
    const value = await Promise.race([
      fetcher(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      ),
    ]);

    const elapsed = Date.now() - startTime;

    if (value === null) return null;

    return {
      provider,
      value: Math.round(value),
      confidence: getConfidenceLevel(provider, elapsed),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`⚠️ ${provider} valuation failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Helper: Determine confidence level
function getConfidenceLevel(provider: string, responseTime: number): 'high' | 'medium' | 'low' {
  const highConfidenceProviders = ['Black Book', 'Manheim', 'NADA', 'KBB'];

  if (!highConfidenceProviders.includes(provider)) return 'medium';
  if (responseTime > 5000) return 'medium';

  return 'high';
}

// Helper: Calculate aggregate value using weighted average
function calculateAggregateValue(quotes: SourceValuation[]): number {
  if (quotes.length === 0) return 0;

  // Weight calculation:
  // - High confidence: 0.35
  // - Medium confidence: 0.25
  // - Low confidence: 0.10
  const weights = {
    high: 0.35,
    medium: 0.25,
    low: 0.10,
  };

  const totalWeight = quotes.reduce((sum, q) => sum + weights[q.confidence], 0);

  const weighted = quotes.reduce((sum, q) => {
    return sum + (q.value * weights[q.confidence]);
  }, 0);

  // Normalize by total weight to ensure proper averaging
  return Math.round(weighted / totalWeight);
}

// Helper: Generate unique valuation ID
function generateValuationId(): string {
  return `VAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Calculate overall confidence level
function calculateConfidenceLevel(sourceCount: number, quotes: SourceValuation[]): string {
  const highConfidenceCount = quotes.filter(q => q.confidence === 'high').length;

  if (sourceCount >= 5 && highConfidenceCount >= 3) return 'Very High';
  if (sourceCount >= 4 && highConfidenceCount >= 2) return 'High';
  if (sourceCount >= 3) return 'Medium';
  if (sourceCount >= 2) return 'Fair';
  return 'Low';
}

// Main service class
export class ValuationService {
  /**
   * Calculate complete vehicle valuation with depreciation applied
   * 
   * @param request ValuationRequest with vehicle details and condition
   * @returns Complete valuation with depreciation breakdown
   */
  async performValuation(request: ValuationRequest): Promise<ValuationResult> {
    console.log(`📊 Starting valuation for ${request.year} ${request.make} ${request.model}`);
    console.log(`   Mileage: ${request.mileage.toLocaleString()}, Condition: ${request.conditionRating}`);

    // ============================================================================
    // STEP 1: CHECK CACHE
    // ============================================================================
    console.log('📦 Checking cache...');
    const cacheKey = `${request.vin || `${request.year}-${request.make}-${request.model}`}:${request.conditionRating}:${request.mileage}`;

    try {
      const cachedResult = await getValuationFromCache(
        request.vin || `${request.year}-${request.make}-${request.model}`,
        request.conditionRating,
        request.mileage
      );

      if (cachedResult) {
        console.log('✅ Returning cached valuation (24-hour cache hit)');
        return {
          ...cachedResult,
          _cached: true,
        };
      }
    } catch (error) {
      console.warn('⚠️ Cache lookup failed:', error);
      // Continue with fresh valuation if cache fails
    }

    // ============================================================================
    // STEP 2: FETCH FROM MULTIPLE SOURCES IN PARALLEL
    // ============================================================================
    console.log('🔍 Fetching valuations from multiple sources...');

    const valuationPromises = [
      fetchValuation('Black Book', () => getBlackBookValue(request)),
      fetchValuation('KBB', () => getKBBValue(request)),
      fetchValuation('NADA', () => getNADAValue(request)),
      fetchValuation('Manheim', () => getManheimValue(request)),
      fetchValuation('Auction Edge', () => getAuctionEdgeValue(request)),
      fetchValuation('Quincy Auto', () => getQuincyAutoValue(request)),
    ];

    const sourceResults = await Promise.all(valuationPromises);
    const validQuotes = sourceResults.filter((q): q is SourceValuation => q !== null);

    if (validQuotes.length === 0) {
      console.error('❌ All valuation sources failed');
      throw new Error('Unable to retrieve valuations - all sources unavailable');
    }

    console.log(`✅ Retrieved ${validQuotes.length} valuations`);
    validQuotes.forEach(q => {
      console.log(`   ${q.provider}: $${q.value.toLocaleString()} (${q.confidence} confidence)`);
    });

    // ============================================================================
    // STEP 3: AGGREGATE VALUES
    // ============================================================================
    const baseWholesaleValue = calculateAggregateValue(validQuotes);
    console.log(`💰 Base Wholesale Value (aggregated): $${baseWholesaleValue.toLocaleString()}`);

    // ============================================================================
    // STEP 4: APPLY DEPRECIATION FACTOR (CRITICAL BUSINESS LOGIC)
    // ============================================================================
    console.log(`🔽 Applying depreciation factor for condition ${request.conditionRating}...`);

    const depreciation = depreciationCalculator.calculateDepreciation(
      baseWholesaleValue,
      request.conditionRating
    );

    console.log(`   Depreciation Factor: ${(depreciation.depreciationFactor * 100).toFixed(0)}%`);
    console.log(`   Depreciation Amount: $${depreciation.depreciationAmount.toLocaleString()}`);
    console.log(`   Final Value: $${depreciation.finalWholesaleValue.toLocaleString()}`);

    // ============================================================================
    // STEP 5: BUILD RESPONSE
    // ============================================================================
    const valuationId = generateValuationId();

    const result: ValuationResult = {
      id: valuationId,
      baseWholesaleValue,
      depreciation,
      finalWholesaleValue: depreciation.finalWholesaleValue,
      quotes: validQuotes,
      vehicle: {
        vin: request.vin,
        year: request.year,
        make: request.make,
        model: request.model,
        trim: request.trim,
        mileage: request.mileage,
      },
      dealership: {
        id: request.dealershipId,
      },
      timestamp: new Date().toISOString(),
      request: request,
    };

    // ============================================================================
    // STEP 6: CACHE RESULT FOR 24 HOURS
    // ============================================================================
    console.log('💾 Caching valuation result...');
    try {
      await cacheValuationResult(
        request.vin || `${request.year}-${request.make}-${request.model}`,
        request.conditionRating,
        request.mileage,
        result
      );
    } catch (error) {
      console.warn('⚠️ Cache storage failed (continuing anyway):', error);
    }

    // ============================================================================
    // STEP 7: LOG TO DATABASE FOR AUDIT/ANALYTICS
    // ============================================================================
    console.log('📝 Logging valuation event...');
    try {
      await this.logValuationEvent({
        valuationId,
        dealershipId: request.dealershipId,
        vehicle: request,
        baseValue: baseWholesaleValue,
        depreciation,
        sourceCount: validQuotes.length,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn('⚠️ Failed to log valuation event:', error);
    }

    console.log(`✅ Valuation complete: ID ${valuationId}`);
    return result;
  }

  /**
   * Private: Log valuation event for audit trail and analytics
   */
  private async logValuationEvent(event: any): Promise<void> {
    try {
      // TODO: Insert into audit_log or analytics table
      console.log('📊 Valuation logged:', {
        id: event.valuationId,
        dealership: event.dealershipId,
        vehicle: `${event.vehicle.year} ${event.vehicle.make} ${event.vehicle.model}`,
        baseValue: event.baseValue,
        finalValue: event.depreciation.finalWholesaleValue,
        condition: event.depreciation.conditionRating,
        sources: event.sourceCount,
        timestamp: event.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to log valuation event:', error);
      // Don't fail the valuation if logging fails
    }
  }

  /**
   * Get historical valuations for a specific VIN
   * 
   * @param vin Vehicle VIN
   * @param days Number of days to look back (default: 30)
   * @returns Array of historical valuations
   */
  async getValuationHistory(vin: string, days: number = 30): Promise<ValuationResult[]> {
    try {
      console.log(`📋 Retrieving valuation history for ${vin} (last ${days} days)`);
      
      // TODO: Query database for valuations of this VIN in last N days
      // const valuations = await db.query(`
      //   SELECT * FROM valuations
      //   WHERE vin = $1 AND created_at > NOW() - INTERVAL '${days} days'
      //   ORDER BY created_at DESC
      // `, [vin]);
      // return valuations;

      return [];
    } catch (error) {
      console.error('Failed to retrieve valuation history:', error);
      return [];
    }
  }

  /**
   * Get valuation statistics for a vehicle model
   * 
   * @param year Year
   * @param make Make
   * @param model Model
   * @param days Number of days to look back (default: 30)
   * @returns Statistics about valuations for this model
   */
  async getModelStatistics(
    year: number,
    make: string,
    model: string,
    days: number = 30
  ): Promise<{
    totalAppraisals: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    avgCondition: number;
    lastUpdated: string;
  }> {
    try {
      console.log(`📊 Retrieving statistics for ${year} ${make} ${model} (last ${days} days)`);
      
      // TODO: Query database for statistics
      // const stats = await db.query(`
      //   SELECT
      //     COUNT(*) as total,
      //     AVG(final_wholesale_value) as avg_value,
      //     MIN(final_wholesale_value) as min_value,
      //     MAX(final_wholesale_value) as max_value,
      //     AVG(condition_rating) as avg_condition,
      //     MAX(created_at) as last_updated
      //   FROM valuations
      //   WHERE year = $1 AND make = $2 AND model = $3
      //     AND created_at > NOW() - INTERVAL '${days} days'
      // `, [year, make, model]);
      // return stats[0];

      return {
        totalAppraisals: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0,
        avgCondition: 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to retrieve model statistics:', error);
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
}

// Export singleton instance
export const valuationService = new ValuationService();
