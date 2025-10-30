/**
 * Depreciation Calculator Service
 * Applies condition-based depreciation factors to wholesale vehicle valuations
 * 
 * Business Logic:
 * - Excellent (5): 100% of wholesale value
 * - Very Good (4): 95% of wholesale value
 * - Good (3): 90% of wholesale value
 * - Fair (2): 80% of wholesale value
 * - Poor (1): 60% of wholesale value
 */

export interface DepreciationFactors {
  excellent: number;    // 1.0 (100%)
  veryGood: number;     // 0.95 (95%)
  good: number;         // 0.90 (90%)
  fair: number;         // 0.80 (80%)
  poor: number;         // 0.60 (60%)
}

export interface DepreciatedValuation {
  baseWholesaleValue: number;
  conditionRating: 1 | 2 | 3 | 4 | 5;
  conditionLabel: string;
  depreciationFactor: number;
  depreciationPercentage: number;
  depreciationAmount: number;
  finalWholesaleValue: number;
  breakdown: {
    excellent: number;
    veryGood: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export class DepreciationCalculator {
  private readonly factors: DepreciationFactors = {
    excellent: 1.0,      // Condition 5
    veryGood: 0.95,      // Condition 4
    good: 0.90,          // Condition 3
    fair: 0.80,          // Condition 2
    poor: 0.60,          // Condition 1
  };

  private readonly conditionLabels: Record<number, string> = {
    5: 'Excellent',
    4: 'Very Good',
    3: 'Good',
    2: 'Fair',
    1: 'Poor',
  };

  private readonly conditionDescriptions: Record<number, string> = {
    5: 'Like new, pristine condition',
    4: 'Minimal wear, excellent condition',
    3: 'Normal wear, clean, well-maintained',
    2: 'Visible wear, minor damage, functional',
    1: 'Significant damage, needs major repairs',
  };

  /**
   * Calculate final wholesale value with depreciation applied
   * 
   * @param baseValue - The unadjusted wholesale value from aggregated sources (e.g., from Black Book, KBB, NADA)
   * @param conditionRating - Vehicle condition on 1-5 scale
   * @returns DepreciatedValuation with comprehensive breakdown
   * @throws Error if baseValue is invalid or conditionRating is out of range
   */
  calculateDepreciation(
    baseValue: number,
    conditionRating: 1 | 2 | 3 | 4 | 5
  ): DepreciatedValuation {
    // Input validation
    if (!Number.isFinite(baseValue) || baseValue <= 0) {
      throw new Error(`Invalid base wholesale value: ${baseValue}`);
    }

    if (!this.isValidCondition(conditionRating)) {
      throw new Error(`Invalid condition rating: ${conditionRating}. Must be 1-5.`);
    }

    const factorKey = this.getFactorKey(conditionRating);
    const depreciationFactor = this.factors[factorKey];
    const depreciationAmount = baseValue * (1 - depreciationFactor);
    const finalValue = baseValue - depreciationAmount;

    return {
      baseWholesaleValue: baseValue,
      conditionRating,
      conditionLabel: this.conditionLabels[conditionRating],
      depreciationFactor,
      depreciationPercentage: (1 - depreciationFactor) * 100,
      depreciationAmount: Math.round(depreciationAmount),
      finalWholesaleValue: Math.round(finalValue),
      breakdown: {
        excellent: Math.round(baseValue * this.factors.excellent),
        veryGood: Math.round(baseValue * this.factors.veryGood),
        good: Math.round(baseValue * this.factors.good),
        fair: Math.round(baseValue * this.factors.fair),
        poor: Math.round(baseValue * this.factors.poor),
      },
    };
  }

  /**
   * Get human-readable condition description
   * @param rating Condition rating 1-5
   * @returns Description string
   */
  getConditionDescription(rating: number): string {
    return this.conditionDescriptions[rating] || 'Unknown condition';
  }

  /**
   * Get condition label (e.g., "Excellent", "Good")
   * @param rating Condition rating 1-5
   * @returns Condition label
   */
  getConditionLabel(rating: number): string {
    return this.conditionLabels[rating] || 'Unknown';
  }

  /**
   * Get the depreciation impact in dollars
   * Shows how much value is lost due to condition rating
   * @param baseValue Base wholesale value
   * @param conditionRating Vehicle condition
   * @returns Dollar amount lost due to condition
   */
  getDepreciationImpactDollars(baseValue: number, conditionRating: 1 | 2 | 3 | 4 | 5): number {
    if (!this.isValidCondition(conditionRating)) {
      throw new Error(`Invalid condition rating: ${conditionRating}`);
    }

    const factorKey = this.getFactorKey(conditionRating);
    const factor = this.factors[factorKey];
    return Math.round(baseValue * (1 - factor));
  }

  /**
   * Compare valuation across all condition ratings
   * Useful for showing sales team "what if" scenarios
   * @param baseValue Base wholesale value
   * @returns Object with valuations for each condition level
   */
  getComparisonAcrossConditions(baseValue: number) {
    return {
      excellent: {
        rating: 5,
        label: this.conditionLabels[5],
        value: Math.round(baseValue * this.factors.excellent),
        impact: 0,
      },
      veryGood: {
        rating: 4,
        label: this.conditionLabels[4],
        value: Math.round(baseValue * this.factors.veryGood),
        impact: Math.round(baseValue * (this.factors.excellent - this.factors.veryGood)),
      },
      good: {
        rating: 3,
        label: this.conditionLabels[3],
        value: Math.round(baseValue * this.factors.good),
        impact: Math.round(baseValue * (this.factors.excellent - this.factors.good)),
      },
      fair: {
        rating: 2,
        label: this.conditionLabels[2],
        value: Math.round(baseValue * this.factors.fair),
        impact: Math.round(baseValue * (this.factors.excellent - this.factors.fair)),
      },
      poor: {
        rating: 1,
        label: this.conditionLabels[1],
        value: Math.round(baseValue * this.factors.poor),
        impact: Math.round(baseValue * (this.factors.excellent - this.factors.poor)),
      },
    };
  }

  /**
   * Apply optional dealership-specific markup to depreciated value
   * @param depreciatedValue The already-depreciated final value
   * @param markupPercentage Markup as decimal (e.g., 0.02 for 2%)
   * @returns Value with markup applied
   */
  applyDealershipMarkup(depreciatedValue: number, markupPercentage: number): number {
    if (markupPercentage < 0 || markupPercentage > 0.2) {
      throw new Error('Markup must be between 0% and 20%');
    }
    return Math.round(depreciatedValue * (1 + markupPercentage));
  }

  /**
   * Validate depreciation factor configuration
   * Call this on application startup to ensure business rules are correct
   * @returns true if all factors are properly configured
   */
  validateConfiguration(): boolean {
    const requiredKeys: (keyof DepreciationFactors)[] = [
      'excellent',
      'veryGood',
      'good',
      'fair',
      'poor',
    ];

    for (const key of requiredKeys) {
      const value = this.factors[key];
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        console.error(`Invalid depreciation factor for ${key}: ${value}`);
        return false;
      }
    }

    // Verify factors are in descending order (excellent > veryGood > good > fair > poor)
    if (!(this.factors.excellent >= this.factors.veryGood &&
          this.factors.veryGood >= this.factors.good &&
          this.factors.good >= this.factors.fair &&
          this.factors.fair >= this.factors.poor)) {
      console.error('Depreciation factors are not in descending order');
      return false;
    }

    return true;
  }

  /**
   * Export configuration for audit/compliance purposes
   * @returns Current depreciation factor configuration
   */
  exportConfiguration() {
    return {
      factors: { ...this.factors },
      conditionLabels: { ...this.conditionLabels },
      conditionDescriptions: { ...this.conditionDescriptions },
      lastUpdated: new Date().toISOString(),
      version: '1.0',
    };
  }

  // Private helper methods
  private getFactorKey(rating: number): keyof DepreciationFactors {
    const keyMap: Record<number, keyof DepreciationFactors> = {
      5: 'excellent',
      4: 'veryGood',
      3: 'good',
      2: 'fair',
      1: 'poor',
    };
    return keyMap[rating];
  }

  private isValidCondition(rating: number): boolean {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  }
}

// Singleton instance
export const depreciationCalculator = new DepreciationCalculator();

// Validate configuration on module load
if (!depreciationCalculator.validateConfiguration()) {
  console.error('⚠️ Depreciation calculator configuration is invalid!');
  process.exit(1);
}
