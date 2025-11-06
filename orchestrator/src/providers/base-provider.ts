/**
 * Abstract Base Provider
 * Eliminates code duplication across all providers
 */

import pino from 'pino';
import { getRegionalAdjustment } from '../valuation/regional-adjustment.js';
import type { ValuationRequest, ProviderConfig } from '../types/valuation.types';

const log = pino();

export abstract class BaseProvider {
  protected abstract config: ProviderConfig;
  
  protected readonly basePrices: Record<string, number> = {
    'Acura': 22000, 'Audi': 28000, 'BMW': 30000, 'Cadillac': 26000,
    'Chevrolet': 18000, 'Chrysler': 16000, 'Dodge': 17000, 'Ford': 19000,
    'GMC': 22000, 'Honda': 18000, 'Hyundai': 15000, 'Jeep': 19000,
    'Kia': 15000, 'Lexus': 32000, 'Mazda': 16000, 'Mercedes-Benz': 38000,
    'Nissan': 16000, 'Ram': 21000, 'Subaru': 18000, 'Tesla': 35000,
    'Toyota': 20000, 'Volkswagen': 17000, 'Volvo': 24000,
  };

  /**
   * Trim multipliers affect base price based on trim level
   * A "Base" trim vs "Platinum" trim can be $5,000-$15,000 difference
   */
  protected readonly trimMultipliers: Record<string, number> = {
    'base': 0.92,
    'sport': 1.05,
    'limited': 1.08,
    'premium': 1.12,
    'luxury': 1.15,
    'platinum': 1.18,
    'touring': 1.06,
    'ex': 1.04,
    'lx': 0.98,
    'le': 0.96,
    'xle': 1.03,
    'sel': 1.02,
    'sxt': 1.01,
    'rt': 1.09,
    'srt': 1.14,
    'performance': 1.11,
    'signature': 1.13,
  };

  async getValue(request: ValuationRequest): Promise<number | null> {
    try {
      let basePrice = this.basePrices[request.make] || this.config.basePrice;
      const currentYear = new Date().getFullYear();
      
      // Apply trim multiplier to base price
      const trimMultiplier = this.getTrimMultiplier(request.trim);
      basePrice *= trimMultiplier;
      
      // Depreciation calculations with caps to prevent negative values
      const yearsSinceManufacture = currentYear - request.year;
      const yearAdjustment = Math.min(yearsSinceManufacture * this.config.yearAdjustmentRate, 0.85);
      const mileageAdjustment = Math.min((request.mileage / 100000) * this.config.mileageAdjustmentRate, 0.50);
      
      // Ensure total depreciation doesn't exceed 95% (minimum 5% residual value)
      const totalDepreciation = Math.min(yearAdjustment + mileageAdjustment, 0.95);
      
      // Apply depreciation
      let adjustedPrice = basePrice * (1 - totalDepreciation);
      
      // Regional adjustment
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
      
      // Add random variance for realism
      const variance = Math.random() * this.config.randomVariance - (this.config.randomVariance / 2);
      
      const finalValue = Math.round(adjustedPrice + variance);
      
      // Ensure minimum value of $500 (scrap value floor)
      return Math.max(finalValue, 500);
    } catch (error) {
      log.error({
        message: `${this.config.name} valuation failed`,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get trim multiplier based on trim level
   * Returns 1.0 (no adjustment) if trim is not recognized
   */
  protected getTrimMultiplier(trim?: string): number {
    if (!trim) return 1.0;
    
    // Normalize trim to lowercase for comparison
    const normalizedTrim = trim.toLowerCase();
    
    // Check for exact match first
    if (normalizedTrim in this.trimMultipliers) {
      return this.trimMultipliers[normalizedTrim];
    }
    
    // Check for partial matches (e.g., "Sport Plus" contains "sport")
    for (const [key, multiplier] of Object.entries(this.trimMultipliers)) {
      if (normalizedTrim.includes(key)) {
        return multiplier;
      }
    }
    
    // Default to no adjustment
    return 1.0;
  }

  getName(): string {
    return this.config.name;
  }
}
