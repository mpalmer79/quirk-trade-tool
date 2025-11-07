import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// --- Jest shim so existing tests can keep calling jest.fn / jest.spyOn etc. ---
const jestLike = new Proxy(vi, {
  // Try to return the vi method if it exists; otherwise a harmless no-op
  get(target, prop: string) {
    // Common 1:1 mappings
    if (prop === 'fn') return vi.fn;
    if (prop === 'spyOn') return vi.spyOn;
    if (prop === 'mock') return vi.mock;
    if (prop === 'unmock') return vi.unmock;
    if (prop === 'clearAllMocks') return vi.clearAllMocks;
    if (prop === 'resetAllMocks') return vi.resetAllMocks;
    if (prop === 'restoreAllMocks') return vi.restoreAllMocks;
    if (prop === 'useFakeTimers') return vi.useFakeTimers;
    if (prop === 'useRealTimers') return vi.useRealTimers;
    if (prop === 'advanceTimersByTime') return vi.advanceTimersByTime;
    if (prop === 'runAllTimers') return vi.runAllTimers;

    // Fallback to any other vi API or a no-op
    // @ts-expect-error dynamic
    return target[prop] ?? (() => {});
  },
});

// Expose as global `jest`
(globalThis as any).jest = jestLike;

// Clean up between tests and reset spies/mocks
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
