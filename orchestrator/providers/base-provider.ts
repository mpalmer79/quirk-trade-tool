/**
 * Abstract Base Provider
 * Eliminates code duplication across all providers
 */

import pino from 'pino';
import { getRegionalAdjustment } from '../valuation/regional-adjustment';
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

  async getValue(request: ValuationRequest): Promise<number | null> {
    try {
      const basePrice = this.basePrices[request.make] || this.config.basePrice;
      const currentYear = new Date().getFullYear();
      
      // Depreciation calculations
      const yearAdjustment = (currentYear - request.year) * this.config.yearAdjustmentRate;
      const mileageAdjustment = (request.mileage / 100000) * this.config.mileageAdjustmentRate;
      
      // Apply depreciation
      let adjustedPrice = basePrice * (1 - yearAdjustment - mileageAdjustment);
      
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
      
      return Math.round(adjustedPrice + variance);
    } catch (error) {
      log.error({
        message: `${this.config.name} valuation failed`,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  getName(): string {
    return this.config.name;
  }
}
