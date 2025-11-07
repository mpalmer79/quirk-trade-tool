import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // ============================================================================
    // MOCKING CONFIGURATION
    // ============================================================================
    // Mock ioredis to prevent tests from hanging on Redis connection
    alias: {
      'ioredis': '/home/runner/work/quirk-trade-tool/quirk-trade-tool/orchestrator/src/__tests__/mocks/ioredis.ts'
    },
    
    // ============================================================================
    // TIMEOUT CONFIGURATION
    // ============================================================================
    // Increase timeouts for integration tests that may need to:
    // - Connect to external services (NHTSA VIN decoder, etc.)
    // - Perform database operations
    // - Make multiple provider API calls
    testTimeout: 30000,        // 30 seconds per test (default is 5000ms)
    hookTimeout: 30000,        // 30 seconds for beforeAll/afterAll hooks
    teardownTimeout: 10000,    // 10 seconds for cleanup
    
    // ============================================================================
    // TEST EXECUTION SETTINGS
    // ============================================================================
    // Run tests in sequence for integration tests to avoid race conditions
    // You can override this for unit tests by using describe.concurrent()
    pool: 'threads',           // Use worker threads for better isolation
    poolOptions: {
      threads: {
        singleThread: false,   // Allow parallel execution
        isolate: true,         // Isolate tests from each other
      }
    },
    
    // Retry flaky tests once before failing (helpful for network-dependent tests)
    retry: 1,
    
    // ============================================================================
    // COVERAGE CONFIGURATION
    // ============================================================================
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/types/**',
        '**/*.d.ts'
      ],
      // Thresholds (optional - uncomment to enforce coverage)
      // statements: 80,
      // branches: 80,
      // functions: 80,
      // lines: 80,
    },
    
    // ============================================================================
    // TEST FILTERING & ORGANIZATION
    // ============================================================================
    // ✅ FIXED: Only include actual test files (*.test.ts or *.spec.ts)
    include: [
      'src/**/*.{test,spec}.{js,ts}'
    ],
    
    // ✅ FIXED: Explicitly exclude setup and fixture files
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/node_modules/**',
      '**/setup.ts',                    // ← Exclude any setup.ts files
      '**/fixtures.ts',                 // ← Exclude any fixtures.ts files
      '**/__tests__/setup.ts',          // ← Exclude test setup
      '**/__tests__/**/fixtures.ts',    // ← Exclude test fixtures
      '**/__tests__/**/helpers.ts',     // ← Exclude test helpers
      '**/__tests__/**/mocks.ts'        // ← Exclude test mocks
    ],
    
    // ============================================================================
    // REPORTER CONFIGURATION
    // ============================================================================
    // Use 'verbose' for detailed output, 'default' for standard output
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
    
    // ============================================================================
    // MOCK & STUB CONFIGURATION
    // ============================================================================
    // Automatically clear mocks between tests
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    
    // ============================================================================
    // ENVIRONMENT VARIABLES FOR TESTS
    // ============================================================================
    env: {
      NODE_ENV: 'test',
      // Add test-specific environment variables here
      // These will override your .env file during tests
    }
  },
});
