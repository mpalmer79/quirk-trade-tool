import { z } from "zod";

export type Dealership = { id: string; name: string; brand?: string };

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

export type SourceQuote = { source: string; value: number };
export type Summary = { low: number; high: number; avg: number; confidence: string };

export type AppraiseResponse = {
  id: string;
  quotes: SourceQuote[];
  summary: Summary;
  store?: Dealership;
  note?: string;
};
