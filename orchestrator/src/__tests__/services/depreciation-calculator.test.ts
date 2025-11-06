import { depreciationCalculator } from '../../services/depreciation-calculator';

describe('DepreciationCalculator', () => {
  describe('calculateDepreciation', () => {
    it('calculates 0% depreciation for excellent condition', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 5);
      
      expect(result.depreciationFactor).toBe(1.0);
      expect(result.finalWholesaleValue).toBe(20000);
      expect(result.conditionRating).toBe(5);
      expect(result.conditionLabel).toBe('Excellent');
      expect(result.depreciationPercentage).toBe(0);
      expect(result.depreciationAmount).toBe(0);
    });

    it('calculates 10% depreciation for good condition', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 3);
      
      expect(result.depreciationFactor).toBe(0.9);
      expect(result.finalWholesaleValue).toBe(18000);
      expect(result.conditionRating).toBe(3);
      expect(result.conditionLabel).toBe('Good');
      expect(result.depreciationPercentage).toBeCloseTo(10, 1);
      expect(result.depreciationAmount).toBe(2000);
    });

    it('calculates 5% depreciation for very good condition', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 4);
      
      expect(result.depreciationFactor).toBe(0.95);
      expect(result.finalWholesaleValue).toBe(19000);
      expect(result.conditionLabel).toBe('Very Good');
      expect(result.depreciationPercentage).toBeCloseTo(5, 1);
    });

    it('calculates 20% depreciation for fair condition', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 2);
      
      expect(result.depreciationFactor).toBe(0.8);
      expect(result.finalWholesaleValue).toBe(16000);
      expect(result.conditionLabel).toBe('Fair');
      expect(result.depreciationPercentage).toBeCloseTo(20, 1);
    });

    it('calculates 40% depreciation for poor condition', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 1);
      
      expect(result.depreciationFactor).toBe(0.6);
      expect(result.finalWholesaleValue).toBe(12000);
      expect(result.conditionLabel).toBe('Poor');
      expect(result.depreciationPercentage).toBe(40);
    });

    it('includes breakdown for all condition levels', () => {
      const result = depreciationCalculator.calculateDepreciation(20000, 3);
      
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.excellent).toBe(20000);
      expect(result.breakdown?.veryGood).toBe(19000);
      expect(result.breakdown?.good).toBe(18000);
      expect(result.breakdown?.fair).toBe(16000);
      expect(result.breakdown?.poor).toBe(12000);
    });

    it('throws error for invalid base value', () => {
      expect(() => {
        depreciationCalculator.calculateDepreciation(-1000, 3);
      }).toThrow('Invalid base wholesale value');

      expect(() => {
        depreciationCalculator.calculateDepreciation(0, 3);
      }).toThrow('Invalid base wholesale value');

      expect(() => {
        depreciationCalculator.calculateDepreciation(NaN, 3);
      }).toThrow('Invalid base wholesale value');
    });

    it('throws error for invalid condition rating', () => {
      expect(() => {
        depreciationCalculator.calculateDepreciation(20000, 0 as any);
      }).toThrow('Invalid condition rating');

      expect(() => {
        depreciationCalculator.calculateDepreciation(20000, 6 as any);
      }).toThrow('Invalid condition rating');

      expect(() => {
        depreciationCalculator.calculateDepreciation(20000, 3.5 as any);
      }).toThrow('Invalid condition rating');
    });

    it('rounds final values to nearest dollar', () => {
      const result = depreciationCalculator.calculateDepreciation(15555, 4);
      
      // 15555 * 0.95 = 14777.25, should round to 14777
      expect(result.finalWholesaleValue).toBe(14777);
    });
  });

  describe('getConditionDescription', () => {
    it('returns correct descriptions for each rating', () => {
      expect(depreciationCalculator.getConditionDescription(5)).toBe('Like new, pristine condition');
      expect(depreciationCalculator.getConditionDescription(4)).toBe('Minimal wear, excellent condition');
      expect(depreciationCalculator.getConditionDescription(3)).toBe('Normal wear, clean, well-maintained');
      expect(depreciationCalculator.getConditionDescription(2)).toBe('Visible wear, minor damage, functional');
      expect(depreciationCalculator.getConditionDescription(1)).toBe('Significant damage, needs major repairs');
    });

    it('returns unknown for invalid rating', () => {
      expect(depreciationCalculator.getConditionDescription(0)).toBe('Unknown condition');
      expect(depreciationCalculator.getConditionDescription(99)).toBe('Unknown condition');
    });
  });

  describe('getConditionLabel', () => {
    it('returns correct labels for each rating', () => {
      expect(depreciationCalculator.getConditionLabel(5)).toBe('Excellent');
      expect(depreciationCalculator.getConditionLabel(4)).toBe('Very Good');
      expect(depreciationCalculator.getConditionLabel(3)).toBe('Good');
      expect(depreciationCalculator.getConditionLabel(2)).toBe('Fair');
      expect(depreciationCalculator.getConditionLabel(1)).toBe('Poor');
    });

    it('returns unknown for invalid rating', () => {
      expect(depreciationCalculator.getConditionLabel(0)).toBe('Unknown');
    });
  });

  describe('getDepreciationImpactDollars', () => {
    it('calculates dollar impact for each condition level', () => {
      const baseValue = 25000;
      
      expect(depreciationCalculator.getDepreciationImpactDollars(baseValue, 5)).toBe(0);
      expect(depreciationCalculator.getDepreciationImpactDollars(baseValue, 4)).toBe(1250);
      expect(depreciationCalculator.getDepreciationImpactDollars(baseValue, 3)).toBe(2500);
      expect(depreciationCalculator.getDepreciationImpactDollars(baseValue, 2)).toBe(5000);
      expect(depreciationCalculator.getDepreciationImpactDollars(baseValue, 1)).toBe(10000);
    });

    it('throws error for invalid condition rating', () => {
      expect(() => {
        depreciationCalculator.getDepreciationImpactDollars(20000, 0 as any);
      }).toThrow('Invalid condition rating');
    });
  });

  describe('getComparisonAcrossConditions', () => {
    it('returns comparison for all condition levels', () => {
      const baseValue = 30000;
      const comparison = depreciationCalculator.getComparisonAcrossConditions(baseValue);
      
      expect(comparison.excellent.value).toBe(30000);
      expect(comparison.excellent.impact).toBe(0);
      expect(comparison.veryGood.value).toBe(28500);
      expect(comparison.veryGood.impact).toBe(1500);
      expect(comparison.good.value).toBe(27000);
      expect(comparison.good.impact).toBe(3000);
      expect(comparison.fair.value).toBe(24000);
      expect(comparison.fair.impact).toBe(6000);
      expect(comparison.poor.value).toBe(18000);
      expect(comparison.poor.impact).toBe(12000);
    });

    it('includes rating and label for each condition', () => {
      const comparison = depreciationCalculator.getComparisonAcrossConditions(10000);
      
      expect(comparison.excellent.rating).toBe(5);
      expect(comparison.excellent.label).toBe('Excellent');
      expect(comparison.good.rating).toBe(3);
      expect(comparison.good.label).toBe('Good');
    });
  });

  describe('applyDealershipMarkup', () => {
    it('applies markup percentage correctly', () => {
      const depreciatedValue = 20000;
      
      expect(depreciationCalculator.applyDealershipMarkup(depreciatedValue, 0.02)).toBe(20400);
      expect(depreciationCalculator.applyDealershipMarkup(depreciatedValue, 0.05)).toBe(21000);
      expect(depreciationCalculator.applyDealershipMarkup(depreciatedValue, 0.10)).toBe(22000);
    });

    it('throws error for invalid markup percentage', () => {
      expect(() => {
        depreciationCalculator.applyDealershipMarkup(20000, -0.01);
      }).toThrow('Markup must be between 0% and 20%');

      expect(() => {
        depreciationCalculator.applyDealershipMarkup(20000, 0.25);
      }).toThrow('Markup must be between 0% and 20%');
    });

    it('accepts 0% and 20% markup as boundary cases', () => {
      expect(depreciationCalculator.applyDealershipMarkup(10000, 0)).toBe(10000);
      expect(depreciationCalculator.applyDealershipMarkup(10000, 0.2)).toBe(12000);
    });
  });

  describe('validateConfiguration', () => {
    it('validates successfully with current configuration', () => {
      expect(depreciationCalculator.validateConfiguration()).toBe(true);
    });
  });

  describe('exportConfiguration', () => {
    it('exports complete configuration with metadata', () => {
      const config = depreciationCalculator.exportConfiguration();
      
      expect(config.factors).toBeDefined();
      expect(config.factors.excellent).toBe(1.0);
      expect(config.factors.poor).toBe(0.6);
      expect(config.conditionLabels).toBeDefined();
      expect(config.conditionDescriptions).toBeDefined();
      expect(config.lastUpdated).toBeDefined();
      expect(config.version).toBe('1.0');
    });

    it('includes ISO timestamp', () => {
      const config = depreciationCalculator.exportConfiguration();
      const timestamp = new Date(config.lastUpdated);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
