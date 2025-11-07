// Make legacy Jest helpers available when running under Vitest
import { vi, expect } from 'vitest';

(globalThis as any).jest = vi;
// Optional: common aliases you may be using
// (globalThis as any).beforeAll = beforeAll;
// (globalThis as any).afterAll = afterAll;
// (globalThis as any).beforeEach = beforeEach;
// (globalThis as any).afterEach = afterEach;

expect; // keep TS happy if tree-shaking complains
