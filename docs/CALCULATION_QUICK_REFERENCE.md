# Vehicle Valuation - Quick Reference Guide

**Quick lookup for calculation factors, weights, and examples**

---

## Calculation Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   VALUATION CALCULATION                     │
│                                                             │
│  1. BASE PRICE (by manufacturer)                            │
│     └─ $15,000 - $38,000 depending on brand                │
│                                                             │
│  2. AGE DEPRECIATION (time-based)                          │
│     └─ 8.0% - 8.8% per year                                │
│     └─ Max 85% depreciation cap                            │
│                                                             │
│  3. MILEAGE DEPRECIATION (wear-based)                      │
│     └─ 31% - 36% per 100,000 miles                         │
│     └─ Max 50% depreciation cap                            │
│                                                             │
│  4. SEASONAL ADJUSTMENT (time of year)                     │
│     ├─ Winter (Dec-Feb): -8%                               │
│     ├─ Spring (Mar-May): ±0%                               │
│     ├─ Summer (Jun-Aug): +2%                               │
│     └─ Fall (Sep-Nov): -2%                                 │
│                                                             │
│  5. REGIONAL ADJUSTMENT (location)                         │
│     └─ Northeast: -2% base                                 │
│     └─ National: ±0%                                       │
│                                                             │
│  6. VEHICLE TYPE ADJUSTMENT                                │
│     ├─ AWD: +5% (winter states)                            │
│     ├─ Trucks: +3%                                         │
│     ├─ SUVs: +2%                                           │
│     ├─ RWD: -5%                                            │
│     └─ Convertibles: -10%                                  │
│                                                             │
│  7. PROVIDER AGGREGATION                                   │
│     └─ 6 sources averaged                                  │
│     └─ Outliers removed                                    │
│                                                             │
│  8. CONDITION RATING (1-5 scale)                           │
│     ├─ Excellent (5): 100% of value                        │
│     ├─ Very Good (4): 95%                                  │
│     ├─ Good (3): 90%                                       │
│     ├─ Fair (2): 80%                                       │
│     └─ Poor (1): 60%                                       │
│                                                             │
│  9. SAFETY FLOORS                                          │
│     └─ Minimum value: $500                                 │
│     └─ Max depreciation: 95%                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Factor Lookup

### Base Prices by Manufacturer

| Tier | Manufacturers | Base Price |
|------|--------------|------------|
| **Luxury** | Mercedes-Benz, Tesla, Lexus, BMW | $28k - $38k |
| **Premium** | Audi, Cadillac, Volvo, Acura | $22k - $28k |
| **Mainstream** | Toyota, Honda, Ford, Chevrolet | $18k - $20k |
| **Value** | Hyundai, Kia, Nissan, Mazda | $15k - $16k |

### Depreciation Rates by Provider

| Provider | Year Rate | Mileage Rate | Variance |
|----------|-----------|--------------|----------|
| **Manheim** | 8.8%/year | 34%/100k | ±$500 |
| **KBB** | 8.5%/year | 32%/100k | ±$400 |
| **Black Book** | 8.0%/year | 35%/100k | ±$500 |
| **NADA** | 8.2%/year | 33%/100k | ±$450 |
| **Auction Edge** | 8.5%/year | 36%/100k | ±$350 |
| **Quincy Auto** | 8.3%/year | 31%/100k | ±$420 |

### Seasonal Impact

| Season | Months | Adjustment | Best For |
|--------|--------|------------|----------|
| **Winter** | Dec-Feb | **-8%** | AWD/4WD vehicles |
| **Spring** | Mar-May | ±0% | Most vehicles |
| **Summer** | Jun-Aug | **+2%** | Convertibles |
| **Fall** | Sep-Nov | -2% | Transitional |

**Key Insight:** 10% value swing between best and worst seasons.

### Vehicle Type Multipliers (Northeast)

| Type | Adjustment | Reason |
|------|-----------|--------|
| **AWD/4WD** | **+5%** | High winter demand |
| **Trucks** | **+3%** | Utility preference |
| **SUVs** | **+2%** | Family demand |
| RWD | -5% | Winter concerns |
| Convertibles | -10% | Climate unsuitable |

### Condition Rating Impact

| Rating | Label | Factor | Example ($10k base) |
|--------|-------|--------|-------------------|
| **5** | Excellent | 100% | $10,000 |
| **4** | Very Good | 95% | $9,500 |
| **3** | Good | 90% | $9,000 |
| **2** | Fair | 80% | $8,000 |
| **1** | Poor | 60% | $6,000 |

---

## Example Calculations

### Example 1: Standard Sedan

**Input:**
- 2020 Honda Accord
- 45,000 miles
- Good condition (3)
- Manchester, NH
- January 2025
- No AWD

**Calculation (KBB Provider):**

```
Step 1: Base Price (Honda)
        $18,000

Step 2: Age Depreciation (5 years × 8.5%)
        $18,000 × 0.425 = -$7,650
        
Step 3: Mileage Depreciation (45k @ 32%)
        $18,000 × 0.144 = -$2,592
        
        Subtotal: $18,000 - $7,650 - $2,592 = $7,758

Step 4: Regional (Northeast: -2%)
        $7,758 × 0.98 = $7,603

Step 5: Seasonal (Winter: -8%)
        $7,603 × 0.92 = $6,995

Step 6: Vehicle Type (None)
        $6,995 × 1.00 = $6,995

Step 7: Variance (+$124)
        $6,995 + $124 = $7,119

KBB Quote: $7,119

Aggregate all 6 providers → $7,200 (baseWholesaleValue)

Step 8: Condition (Good: 90%)
        $7,200 × 0.90 = $6,480

FINAL VALUE: $6,480
```

---

### Example 2: Premium SUV with AWD

**Input:**
- 2021 Lexus RX 350
- 30,000 miles
- Excellent condition (5)
- Boston, MA
- July 2025
- AWD

**Calculation (KBB Provider):**

```
Step 1: Base Price (Lexus)
        $32,000

Step 2: Age Depreciation (4 years × 8.5%)
        $32,000 × 0.34 = -$10,880
        
Step 3: Mileage Depreciation (30k @ 32%)
        $32,000 × 0.096 = -$3,072
        
        Subtotal: $32,000 - $10,880 - $3,072 = $18,048

Step 4: Regional (Northeast: -2%)
        $18,048 × 0.98 = $17,687

Step 5: Seasonal (Summer: +2%)
        $17,687 × 1.02 = $18,041

Step 6: Vehicle Type (SUV: +2%, AWD: +5%)
        $18,041 × 1.02 × 1.05 = $19,313

Step 7: Variance (+$87)
        $19,313 + $87 = $19,400

KBB Quote: $19,400

Aggregate all 6 providers → $19,550 (baseWholesaleValue)

Step 8: Condition (Excellent: 100%)
        $19,550 × 1.00 = $19,550

FINAL VALUE: $19,550
```

---

### Example 3: High-Mileage Truck

**Input:**
- 2018 Ford F-150
- 110,000 miles
- Fair condition (2)
- Manchester, NH
- March 2025
- 4WD

**Calculation (KBB Provider):**

```
Step 1: Base Price (Ford)
        $19,000

Step 2: Age Depreciation (7 years × 8.5%)
        $19,000 × 0.595 = -$11,305
        
Step 3: Mileage Depreciation (110k @ 32%)
        $19,000 × 0.352 = -$6,688
        
        Subtotal: $19,000 - $11,305 - $6,688 = $1,007

Step 4: Regional (Northeast: -2%)
        $1,007 × 0.98 = $987

Step 5: Seasonal (Spring: ±0%)
        $987 × 1.00 = $987

Step 6: Vehicle Type (Truck: +3%, 4WD: +5%)
        $987 × 1.03 × 1.05 = $1,068

Step 7: Variance (-$50)
        $1,068 - $50 = $1,018

KBB Quote: $1,018

Aggregate all 6 providers → $1,150 (baseWholesaleValue)

Step 8: Condition (Fair: 80%)
        $1,150 × 0.80 = $920

FINAL VALUE: $920
```

---

## Seasonal Value Impact

### Same Vehicle, Different Seasons

**2020 Honda Accord, 45k miles, Good condition, NH**

| Season | Adjustment | Value | Difference from Peak |
|--------|-----------|-------|---------------------|
| **Summer** (Jun) | +2% | $6,610 | **Baseline** |
| Spring (Apr) | ±0% | $6,480 | -$130 |
| Fall (Oct) | -2% | $6,350 | -$260 |
| **Winter** (Jan) | **-8%** | $5,962 | **-$648** |

**Key Takeaway:** Selling in winter costs ~$650 on a mid-value vehicle.

---

## Regional Comparison

### Same Vehicle, Different Locations

**2020 Toyota Camry, 40k miles, Good condition, Summer**

| Location | Regional Factor | Final Value | Notes |
|----------|----------------|-------------|-------|
| **National Default** | 1.00 | $15,400 | Baseline |
| **Northeast** (NH/MA) | 0.98 | $15,092 | -$308 (2% lower) |
| **Northeast + AWD** | 0.98 × 1.05 | $15,847 | +$447 (AWD premium) |

---

## Vehicle Type Comparison

### Same Base Value, Different Types (Northeast, Winter)

**Base Value: $20,000 before vehicle type adjustment**

| Type | Multiplier | Adjusted Value | Impact |
|------|-----------|---------------|--------|
| **AWD SUV** | ×1.02 ×1.05 | $21,420 | **+$1,420** |
| AWD Sedan | ×1.05 | $21,000 | +$1,000 |
| Truck (4WD) | ×1.03 ×1.05 | $21,630 | **+$1,630** |
| Regular Sedan | ×1.00 | $20,000 | Baseline |
| RWD Sports Car | ×0.95 | $19,000 | -$1,000 |
| Convertible | ×0.90 | $18,000 | **-$2,000** |

**Key Insight:** Vehicle type can swing value ±10% in regional markets.

---

## Condition Impact

### Same Vehicle, Different Conditions

**2020 Honda Accord, 45k miles, Summer, NH**

| Condition | Label | Value | Loss from Excellent |
|-----------|-------|-------|-------------------|
| **5** | Excellent | $7,200 | $0 |
| **4** | Very Good | $6,840 | -$360 |
| **3** | Good | $6,480 | -$720 |
| **2** | Fair | $5,760 | -$1,440 |
| **1** | Poor | $4,320 | -$2,880 |

**Key Insight:** Condition rating can affect value by up to 40%.

---

## API Request Example

### Calculate Valuation

```bash
curl -X POST https://api.quirk.com/api/valuations/calculate \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Response

```json
{
  "id": "VAL-abc123",
  "baseWholesaleValue": 7200,
  "finalWholesaleValue": 6480,
  "depreciation": {
    "conditionRating": 3,
    "conditionLabel": "Good",
    "depreciationFactor": 0.90,
    "depreciationPercentage": 10,
    "depreciationAmount": 720
  },
  "quotes": [
    { "source": "KBB", "value": 7119, "currency": "USD" },
    { "source": "BlackBook", "value": 7235, "currency": "USD" },
    { "source": "NADA", "value": 7180, "currency": "USD" },
    { "source": "Manheim", "value": 7095, "currency": "USD" },
    { "source": "AuctionEdge", "value": 7142, "currency": "USD" },
    { "source": "QuincyAuto", "value": 7228, "currency": "USD" }
  ],
  "vehicle": {
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "trim": "EX",
    "mileage": 45000
  }
}
```

---

## Common Scenarios

### Best Value Scenarios

✅ **Maximize value by:**
- Selling in summer (+2%)
- Higher condition rating (90-100%)
- AWD in northern states (+5%)
- Lower mileage
- Newer vehicles
- Premium brands

### Lower Value Scenarios

⚠️ **Value decreases with:**
- Selling in winter (-8%)
- Lower condition ratings (60-80%)
- RWD or convertibles in cold climates (-5% to -10%)
- High mileage
- Older vehicles
- Budget brands

---

## Quick Tips for Sales Team

### Time of Year Strategy

- **Best months to buy trade-ins:** December-February (lower values)
- **Best months to sell:** June-August (higher values)
- **Margin opportunity:** Up to 10% spread

### Vehicle Type Strategy

- **Premium for AWD/4WD:** Add $1,000-$2,000 to offers in winter states
- **Discount convertibles:** Budget 10% less in northern markets
- **Truck premium:** Strong year-round, especially +3% in working markets

### Condition Grading Impact

- **Excellent (5) vs Good (3):** 10% value difference
- **Good (3) vs Fair (2):** 10% value difference
- **Fair (2) vs Poor (1):** 20% value difference

**Training Note:** Accurate condition assessment directly impacts profitability.

---

## Formula Quick Reference

```typescript
// Age depreciation
ageDepreciation = min(vehicleAge × yearlyRate, 0.85)

// Mileage depreciation
mileageDepreciation = min((mileage / 100000) × mileageRate, 0.50)

// Total depreciation
totalDepreciation = min(ageDepreciation + mileageDepreciation, 0.95)

// Base value after depreciation
baseValue = originalPrice × (1 - totalDepreciation)

// Regional/seasonal/type adjustments
adjustedValue = baseValue × regional × seasonal × vehicleType

// Final value after condition
finalValue = max(adjustedValue × conditionFactor, 500)
```

---

## Related Documentation

- **[VALUATION_ALGORITHM.md](./VALUATION_ALGORITHM.md)** - Complete technical documentation
- **[API.md](./API.md)** - Full API reference
- **[README.md](../README.md)** - Project overview

---

## Need Help?

- **Quick Questions:** Reference this guide
- **Technical Details:** See VALUATION_ALGORITHM.md
- **API Integration:** See API.md
- **Custom Scenarios:** Contact development team

---

**Last Updated:** November 2025  
**Version:** 2.1.0
