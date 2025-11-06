# Vehicle Valuation Algorithm Documentation

**System:** Quirk Trade Tool  
**Version:** 2.1.0  
**Last Updated:** November 2025

> **Note:** This document describes the calculation algorithm, weights, and factors used in vehicle valuations. The current implementation uses demo provider adapters with realistic depreciation models. For production deployment, replace demo providers with licensed API integrations from KBB, BlackBook, NADA, and Manheim as described in the main README.

---

## Overview

The Quirk Trade Tool valuation engine uses a multi-dimensional calculation approach that considers vehicle age, mileage, condition, location, seasonality, and vehicle type. The system aggregates quotes from multiple providers and applies condition-based depreciation to produce final wholesale values.

### Calculation Pipeline

```
Input → Base Value → Age Depreciation → Mileage Depreciation → 
Regional Adjustment → Seasonal Adjustment → Vehicle Type Adjustment → 
Provider Quote → Multi-Source Aggregation → Condition Depreciation → 
Final Wholesale Value
```

---

## 1. Base Value Determination

Each provider starts with a manufacturer-specific base price that reflects typical market positioning.

### Base Prices by Manufacturer

| Manufacturer | Base Price | Market Segment |
|-------------|-----------|----------------|
| Mercedes-Benz | $38,000 | Luxury |
| Tesla | $35,000 | Luxury/EV |
| Lexus | $32,000 | Luxury |
| BMW | $30,000 | Luxury |
| Audi | $28,000 | Luxury |
| Cadillac | $26,000 | Luxury |
| Volvo | $24,000 | Premium |
| Acura | $22,000 | Premium |
| GMC | $22,000 | Truck/SUV |
| Ram | $21,000 | Truck |
| Toyota | $20,000 | Mainstream |
| Ford | $19,000 | Mainstream |
| Jeep | $19,000 | SUV |
| Chevrolet | $18,000 | Mainstream |
| Honda | $18,000 | Mainstream |
| Subaru | $18,000 | AWD Specialist |
| Dodge | $17,000 | Mainstream |
| Volkswagen | $17,000 | Mainstream |
| Chrysler | $16,000 | Mainstream |
| Nissan | $16,000 | Mainstream |
| Mazda | $16,000 | Mainstream |
| Hyundai | $15,000 | Value |
| Kia | $15,000 | Value |

---

## 2. Age-Based Depreciation

Vehicles depreciate based on years since manufacture. Each provider applies a different yearly depreciation rate to reflect their valuation methodology.

### Provider-Specific Depreciation Rates

| Provider | Annual Rate | Methodology Focus |
|----------|------------|-------------------|
| Manheim | 8.8% per year | Auction market data |
| KBB | 8.5% per year | Consumer market |
| Auction Edge | 8.5% per year | Wholesale auctions |
| Quincy Auto | 8.3% per year | Local market |
| NADA | 8.2% per year | Dealer transactions |
| Black Book | 8.0% per year | Wholesale market |

### Calculation Formula

```typescript
yearsSinceManufacture = currentYear - vehicleYear
yearAdjustment = min(yearsSinceManufacture × yearlyRate, 0.85)
```

**Safety Cap:** Maximum 85% age-based depreciation to prevent unrealistic values.

### Examples

- **2020 vehicle in 2025** (5 years old)
  - KBB: 5 × 8.5% = 42.5% depreciation
  
- **2015 vehicle in 2025** (10 years old)
  - KBB: 10 × 8.5% = 85% (capped at maximum)

---

## 3. Mileage-Based Depreciation

Mileage depreciation is calculated per 100,000 miles to reflect wear and tear.

### Provider Mileage Rates

| Provider | Rate per 100k Miles |
|----------|-------------------|
| Auction Edge | 36% |
| Black Book | 35% |
| Manheim | 34% |
| NADA | 33% |
| KBB | 32% |
| Quincy Auto | 31% |

### Calculation Formula

```typescript
mileageAdjustment = min((mileage / 100000) × mileageRate, 0.50)
```

**Safety Cap:** Maximum 50% mileage-based depreciation.

### Examples

- **45,000 miles with KBB rate (32%)**
  - Factor: 45,000 / 100,000 = 0.45
  - Depreciation: 0.45 × 32% = 14.4%

- **125,000 miles with KBB rate (32%)**
  - Factor: 125,000 / 100,000 = 1.25
  - Depreciation: 1.25 × 32% = 40%

---

## 4. Combined Age + Mileage Depreciation

Age and mileage depreciation are combined with an overall safety cap.

### Formula

```typescript
totalDepreciation = min(yearAdjustment + mileageAdjustment, 0.95)
adjustedPrice = basePrice × (1 - totalDepreciation)
```

**Overall Safety Cap:** Maximum 95% total depreciation (minimum 5% residual value).

### Example

**2020 Honda Accord with 45,000 miles (KBB provider)**

```
Base Price: $18,000
Age Depreciation: 42.5%
Mileage Depreciation: 14.4%
Total: 56.9%

Value after depreciation: $18,000 × (1 - 0.569) = $7,758
```

---

## 5. Regional Adjustments

Geographic location affects vehicle values based on market demand patterns.

### Regional Base Multipliers

| Region | Base Multiplier | Rationale |
|--------|----------------|-----------|
| Northeast (NH, MA, ME, VT) | 0.98 | 2% below national average |
| National (default) | 1.00 | Baseline |

**Note:** Additional regions can be configured in `orchestrator/src/valuation/regional-adjustment.ts`

---

## 6. Seasonal Adjustments

Vehicle values fluctuate based on time of year, with regional variations.

### Northeast Seasonal Factors

| Season | Months | Multiplier | Impact |
|--------|--------|------------|--------|
| Winter | Dec-Feb | 0.92 | -8% |
| Spring | Mar-May | 1.00 | Neutral |
| Summer | Jun-Aug | 1.02 | +2% |
| Fall | Sep-Nov | 0.98 | -2% |

### Seasonal Logic

```typescript
function getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = new Date().getMonth(); // 0-11
  if (month >= 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'fall';
}
```

### Impact Example

**$10,000 vehicle value across seasons:**
- Winter: $9,200 (-$800)
- Spring: $10,000 (baseline)
- Summer: $10,200 (+$200)
- Fall: $9,800 (-$200)

**Value swing:** Up to 10% difference between best and worst seasons.

---

## 7. Vehicle Type Adjustments

Different vehicle types have varying demand based on regional needs.

### Northeast Vehicle Type Multipliers

| Vehicle Type | Multiplier | Rationale |
|-------------|------------|-----------|
| AWD/4WD | 1.05 (+5%) | High winter demand |
| Truck | 1.03 (+3%) | Utility preference |
| SUV | 1.02 (+2%) | Family demand |
| RWD | 0.95 (-5%) | Winter concerns |
| Convertible | 0.90 (-10%) | Climate unsuitable |

### Detection Logic

**AWD/4WD:** Detected from options array
- Keywords: "AWD", "4WD", "All-Wheel Drive", "Quattro", "xDrive"

**Trucks:** Pattern matching on model names
- Examples: F-150, Silverado, Ram 1500, Tundra, Sierra, Tacoma

**SUVs:** Pattern matching on model names
- Examples: Tahoe, Explorer, Highlander, Pilot, Expedition

**Convertibles:** Model name keywords
- Keywords: "Convertible", "Cabriolet", "Roadster", "Spyder"

**RWD:** Inferred from sports/luxury brands
- Brands: BMW, Mercedes, Porsche, Corvette, Mustang, Camaro

---

## 8. Complete Regional Calculation

Regional, seasonal, and vehicle type factors are multiplied together.

### Formula

```typescript
regionalAdjustment = baseRegional × seasonal × vehicleType
```

### Example: AWD SUV in Manchester, NH in January

```
Base Regional: 0.98 (Northeast)
Seasonal: 0.92 (Winter)
Vehicle Type (SUV): 1.02
Vehicle Type (AWD): 1.05

Combined: 0.98 × 0.92 × 1.02 × 1.05 = 0.9744

Impact: -2.56% overall adjustment
```

---

## 9. Provider Variance

Each provider adds random variance to simulate real-world quote variation.

### Variance Ranges by Provider

| Provider | Variance Range |
|----------|---------------|
| Black Book | ± $500 |
| Manheim | ± $500 |
| NADA | ± $450 |
| Quincy Auto | ± $420 |
| KBB | ± $400 |
| Auction Edge | ± $350 |

### Application

```typescript
variance = Math.random() × config.randomVariance - (config.randomVariance / 2)
finalValue = adjustedPrice + variance
```

---

## 10. Minimum Value Floor

All calculations enforce a minimum scrap value.

```typescript
finalProviderQuote = max(calculatedValue, $500)
```

**Rationale:** Vehicles always have minimum scrap/salvage value.

---

## 11. Multi-Source Aggregation

The system fetches quotes from all providers and aggregates using outlier detection.

### Aggregation Algorithm

1. **Fetch** quotes from all 6 providers
2. **Calculate** mean and standard deviation
3. **Remove** outliers (values > 2σ from mean)
4. **Calculate** trimmed mean of remaining values
5. **Result** = baseWholesaleValue

### Code Reference

See `orchestrator/src/aggregators/quote-aggregator.ts` for full implementation.

---

## 12. Condition-Based Depreciation

After aggregating provider quotes, final condition adjustment is applied.

### Condition Rating Scale

| Rating | Label | Factor | Description |
|--------|-------|--------|-------------|
| 5 | Excellent | 1.00 (100%) | Like new, pristine condition |
| 4 | Very Good | 0.95 (95%) | Minimal wear, excellent condition |
| 3 | Good | 0.90 (90%) | Normal wear, clean, well-maintained |
| 2 | Fair | 0.80 (80%) | Visible wear, minor damage, functional |
| 1 | Poor | 0.60 (60%) | Significant damage, needs major repairs |

### Final Calculation

```typescript
finalWholesaleValue = baseWholesaleValue × conditionFactor
```

### Value Comparison Example

**Base wholesale value: $10,000**

| Condition | Final Value | Loss from Excellent |
|-----------|-------------|-------------------|
| Excellent (5) | $10,000 | $0 |
| Very Good (4) | $9,500 | -$500 |
| Good (3) | $9,000 | -$1,000 |
| Fair (2) | $8,000 | -$2,000 |
| Poor (1) | $6,000 | -$4,000 |

---

## Complete Example Calculation

### Input Parameters

- **Vehicle:** 2020 Honda Accord
- **Mileage:** 45,000 miles
- **Condition:** Good (3)
- **Location:** Manchester, NH (ZIP 03103)
- **Date:** January 15, 2025
- **Options:** AWD

### Step-by-Step (KBB Provider)

```
1. Base Price (Honda)
   $18,000

2. Age Depreciation
   Years: 5 (2025 - 2020)
   Rate: 8.5% per year
   Depreciation: 5 × 0.085 = 42.5%

3. Mileage Depreciation
   Miles: 45,000
   Rate: 32% per 100k
   Factor: 45,000 / 100,000 = 0.45
   Depreciation: 0.45 × 0.32 = 14.4%

4. Combined Depreciation
   Total: 42.5% + 14.4% = 56.9%
   Value: $18,000 × (1 - 0.569) = $7,758

5. Regional Base (Northeast)
   $7,758 × 0.98 = $7,603

6. Seasonal (Winter)
   $7,603 × 0.92 = $6,995

7. Vehicle Type (AWD)
   $6,995 × 1.05 = $7,345

8. Random Variance
   ± $400 → assume +$124
   $7,345 + $124 = $7,469

9. KBB Quote: $7,469

10. Aggregate All Providers
    Black Book: $7,550
    KBB: $7,469
    NADA: $7,620
    Manheim: $7,380
    Auction Edge: $7,410
    Quincy Auto: $7,490
    
    Average: $7,486
    = baseWholesaleValue

11. Apply Condition (Good = 3)
    Factor: 0.90
    $7,486 × 0.90 = $6,737

12. FINAL WHOLESALE VALUE: $6,737
```

---

## Summary of Factors

### Primary Calculation Factors

| Factor | Weight/Range | Always Applied |
|--------|--------------|----------------|
| Vehicle Age | 8.0-8.8% per year | Yes |
| Mileage | 31-36% per 100k miles | Yes |
| Make/Brand | $15k-$38k base | Yes |
| Geographic Region | -2% to 0% | If ZIP provided |
| Season | -8% to +2% | Yes (current date) |
| Vehicle Type | -10% to +5% | If detected |
| Condition | 60% to 100% | Yes |
| Provider Variance | ± $350-$500 | Yes |

### Safety Mechanisms

| Mechanism | Value | Purpose |
|-----------|-------|---------|
| Max age depreciation | 85% | Prevent over-depreciation |
| Max mileage depreciation | 50% | Reasonable wear limits |
| Max total depreciation | 95% | Minimum residual value |
| Minimum value floor | $500 | Scrap value guarantee |

---

## Configuration & Customization

### Adding New Regions

Edit `orchestrator/src/valuation/regional-adjustment.ts`:

```typescript
const REGIONS: Record<string, RegionConfig> = {
  'southwest': {
    name: 'Southwest (AZ, NM, TX)',
    baseMultiplier: 1.02,  // 2% above national
    seasonalMultipliers: {
      winter: 1.05,  // Convertibles premium
      spring: 1.02,
      summer: 0.98,  // Heat concerns
      fall: 1.00,
    },
    vehicleTypeMultipliers: {
      convertible: 1.10,  // High demand
      awd: 0.98,          // Low demand
      rwd: 1.02,          // Good weather
      truck: 1.05,        // Work vehicle demand
      suv: 1.03,
    }
  }
};
```

### Adjusting Depreciation Factors

Edit `orchestrator/src/services/depreciation-calculator.ts`:

```typescript
private readonly factors: DepreciationFactors = {
  excellent: 1.0,    // Condition 5
  veryGood: 0.95,    // Condition 4
  good: 0.90,        // Condition 3
  fair: 0.80,        // Condition 2
  poor: 0.60,        // Condition 1
};
```

### Provider Configuration

Each provider in `orchestrator/src/providers/` can be configured:

```typescript
protected config: ProviderConfig = {
  name: 'Provider Name',
  basePrice: 17500,              // Default if make not found
  yearAdjustmentRate: 0.085,     // 8.5% per year
  mileageAdjustmentRate: 0.32,   // 32% per 100k miles
  randomVariance: 400            // ± $400 variance
};
```

---

## Code References

### Key Files

| File | Purpose |
|------|---------|
| `orchestrator/src/services/valuation-service.ts` | Main orchestration |
| `orchestrator/src/services/depreciation-calculator.ts` | Condition depreciation |
| `orchestrator/src/providers/base-provider.ts` | Provider calculation logic |
| `orchestrator/src/aggregators/quote-aggregator.ts` | Multi-source aggregation |
| `orchestrator/src/valuation/regional-adjustment.ts` | Geographic/seasonal logic |

### API Endpoint

```
POST /api/valuations/calculate

Request:
{
  "storeId": "quirk-chevy-manchester",
  "year": 2020,
  "make": "Honda",
  "model": "Accord",
  "trim": "EX",
  "mileage": 45000,
  "condition": 3,
  "vin": "1HGCV41JXMN109186",
  "options": ["AWD", "Navigation"],
  "zip": "03103"
}

Response:
{
  "id": "VAL-abc123",
  "baseWholesaleValue": 7486,
  "finalWholesaleValue": 6737,
  "depreciation": {
    "conditionRating": 3,
    "conditionLabel": "Good",
    "depreciationFactor": 0.90,
    "depreciationAmount": 749
  },
  "quotes": [
    { "source": "KBB", "value": 7469 },
    { "source": "BlackBook", "value": 7550 },
    ...
  ]
}
```

---

## Testing

### Unit Tests

```bash
cd orchestrator
npm test src/__tests__/services/depreciation-calculator.test.ts
```

### Integration Tests

```bash
cd orchestrator
npm test src/__tests__/integration/valuation-flow.test.ts
```

### Coverage

Target coverage for valuation logic: 90%+

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing documentation.

---

## Compliance & Auditing

### Validation on Startup

The depreciation calculator validates its configuration on application startup:

```typescript
if (!depreciationCalculator.validateConfiguration()) {
  console.error('⚠️ Depreciation calculator configuration is invalid!');
  process.exit(1);
}
```

### Export Configuration

For compliance audits:

```
GET /api/valuations/health

Response includes:
{
  "status": "ok",
  "depreciation": {
    "factors": {
      "excellent": 1.0,
      "veryGood": 0.95,
      "good": 0.90,
      "fair": 0.80,
      "poor": 0.60
    },
    "version": "1.0"
  }
}
```

---

## Related Documentation

- [README.md](../README.md) - Project overview and setup
- [API.md](./API.md) - Complete API reference
- [CALCULATION_QUICK_REFERENCE.md](./CALCULATION_QUICK_REFERENCE.md) - Quick calculation examples
- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - Testing strategies

---

**Maintained By:** Quirk Auto Development Team  
**Last Updated:** November 2025  
**Version:** 2.1.0
