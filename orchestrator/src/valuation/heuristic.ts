import type { AppraiseInput } from '../schemas/appraise.js';

export function demoHeuristic(f: AppraiseInput): number {
  const now = new Date().getFullYear();
  const age = Math.max(0, now - f.year);
  const expected = Math.max(0, age * 12000);
  const mileageAdj = ((f.mileage - expected) / 1000) * 50;

  const conditionMultipliers: Record<number, number> = { 1: 0.7, 2: 0.85, 3: 1, 4: 1.1, 5: 1.2 };
  let base = 35000 - age * 2000 - mileageAdj;
  base = Math.max(base, 2000);
  base *= conditionMultipliers[f.condition] ?? 1;
  base += (f.options?.length ?? 0) * 500;
  return Math.round(base);
}
