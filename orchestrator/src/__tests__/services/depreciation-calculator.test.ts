import { depreciationCalculator } from '../../services/depreciation-calculator';

describe('DepreciationCalculator', () => {
  it('calculates 0% depreciation for excellent condition', () => {
    const result = depreciationCalculator.calculateDepreciation(20000, 5);
    
    expect(result.depreciationFactor).toBe(1.0);
    expect(result.finalWholesaleValue).toBe(20000);
  });

  it('calculates 10% depreciation for good condition', () => {
    const result = depreciationCalculator.calculateDepreciation(20000, 3);
    
    expect(result.depreciationFactor).toBe(0.9);
    expect(result.finalWholesaleValue).toBe(18000);
  });
});
