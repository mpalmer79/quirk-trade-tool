import { z } from "zod";

export type Dealership = { 
  id: string; 
  name: string; 
  brand?: string;
  city: string;      // ✅ ADD THIS
  state: string;     // ✅ ADD THIS
};

export const FormSchema = z.object({
  storeId: z.string().min(1, "Select a dealership"),
  vin: z.string().optional(),
  year: z.coerce.number().min(1990).max(new Date().getFullYear()),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().default(""),
  mileage: z.coerce.number().int().min(0).max(1_000_000),
  condition: z.coerce.number().int().min(1).max(5),
  options: z.array(z.string()).default([]),
  zip: z.string().regex(/^\d{5}$/).optional()
});
export type FormData = z.infer<typeof FormSchema>;

// ✅ NEW: Depreciation data type
export type DepreciationData = {
  baseWholesaleValue: number;
  conditionRating: number;
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
};

export type SourceQuote = { source: string; value: number };

// ✅ UPDATED: Added base and depreciation
export type Summary = { 
  low: number; 
  high: number; 
  avg: number; 
  confidence: string;
  base: number;                    // ✅ NEW
  depreciation: DepreciationData;  // ✅ NEW
};

// ✅ UPDATED: Added depreciation
export type AppraiseResponse = {
  id: string;
  quotes: SourceQuote[];
  summary: Summary;
  store?: Dealership;
  note?: string;
  depreciation: DepreciationData;  // ✅ NEW
};

export type DecodedVin = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
};
