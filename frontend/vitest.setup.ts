import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// --- Global mock: react-hook-form.useForm is a vi mock in all tests
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    // Default implementation that returns actual useForm - tests can override if needed
    useForm: actual.useForm
  };
});

// --- Jest shim so legacy jest.* calls keep working under Vitest ---
const jestLike = new Proxy(vi, {
  get(target, prop: string) {
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
    // @ts-expect-error dynamic index
    return target[prop] ?? (() => {});
  },
});
// @ts-expect-error exposing global for legacy tests
globalThis.jest = jestLike;

// Clean up between tests & reset mocks
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
