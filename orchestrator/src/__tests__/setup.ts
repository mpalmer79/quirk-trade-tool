/**
 * Vitest Setup File
 * Runs before all tests - initializes test environment, mocks, and utilities
 * 
 * Configures:
 * - Environment variables for test mode
 * - Global test utilities and fixtures
 * - Mock providers for external APIs
 * - Database and cache simulation
 * - Error handling and logging
 */

import { beforeAll, afterAll, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCK IOREDIS TO PREVENT REDIS CONNECTION ATTEMPTS
// ============================================================================

vi.mock('ioredis', () => {
  // Create a simple in-memory store for the mock
  const store = new Map<string, string>();
  
  const RedisMock = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setex: vi.fn().mockImplementation((key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(store.get(key) || null);
    }),
    del: vi.fn().mockImplementation((key: string) => {
      store.delete(key);
      return Promise.resolve(1);
    }),
    quit: vi.fn().mockResolvedValue('OK'),
    disconnect: vi.fn(),
  }));
  
  return { default: RedisMock };
});

// ============================================================================
// ENVIRONMENT VARIABLES - TEST CONFIGURATION
// ============================================================================

process.env.NODE_ENV = 'test';
process.env.PORT = '4001';

// ============================================================================
// SECURITY & AUTHENTICATION
// ============================================================================

process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';
process.env.JWT_EXPIRY = '24h';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-do-not-use-in-production';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'quirk_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/quirk_test';

// ============================================================================
// CACHE & REDIS CONFIGURATION
// ============================================================================

process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CACHE_TTL = '3600'; // 1 hour
process.env.CACHE_ENABLED = 'false'; // Disable cache in tests to avoid Redis connection issues


// ============================================================================
// EXTERNAL API CONFIGURATION (Providers)
// ============================================================================

// NADA Guides API
process.env.NADA_API_KEY = 'test-nada-api-key-do-not-use-in-production';
process.env.NADA_API_BASE_URL = 'https://api.nadaguides.com/test';

// Black Book API
process.env.BLACKBOOK_API_KEY = 'test-blackbook-api-key-do-not-use-in-production';
process.env.BLACKBOOK_API_BASE_URL = 'https://api.blackbook.com/test';

// KBB API
process.env.KBB_API_KEY = 'test-kbb-api-key-do-not-use-in-production';
process.env.KBB_API_BASE_URL = 'https://api.kbb.com/test';

// Manheim API
process.env.MANHEIM_API_KEY = 'test-manheim-api-key-do-not-use-in-production';
process.env.MANHEIM_API_BASE_URL = 'https://api.manheim.com/test';

// Auction Edge API
process.env.AUCTION_EDGE_API_KEY = 'test-auction-edge-api-key-do-not-use-in-production';
process.env.AUCTION_EDGE_API_BASE_URL = 'https://api.auctionestedge.com/test';

// ============================================================================
// LOGGING & DEBUGGING
// ============================================================================

process.env.LOG_LEVEL = 'error'; // Suppress logs during tests
process.env.DEBUG = 'false'; // Disable debug mode
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

// ============================================================================
// FEATURE FLAGS
// ============================================================================

process.env.ENABLE_CACHING = 'true';
process.env.ENABLE_MULTIPLE_PROVIDERS = 'true';
process.env.ENABLE_DEPRECIATION_CALC = 'true';
process.env.ENABLE_REGIONAL_ADJUSTMENT = 'true';

// ============================================================================
// DEALERSHIP CONFIGURATION
// ============================================================================

process.env.DEFAULT_DEALERSHIP_ID = 'test-dealer-01';

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

beforeAll(() => {
  console.log('🧪 Test suite starting...');
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✓ configured' : '✗ missing'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? '✓ configured' : '✗ missing'}`);
  console.log(`📦 Redis: ${process.env.REDIS_URL ? '✓ configured' : '✗ missing'}`);
});

// ============================================================================
// GLOBAL TEARDOWN
// ============================================================================

afterAll(() => {
  console.log('✅ Test suite completed');
  // Cleanup resources
  vi.clearAllMocks();
});

// ============================================================================
// GLOBAL TEST UTILITIES & FIXTURES
// ============================================================================

/**
 * Standard valid valuation request for testing
 */
export const validValuationRequest = {
  year: 2020,
  make: 'Honda',
  model: 'Accord',
  mileage: 45000,
  condition: 3,
  storeId: 'test-dealer-01',
  vin: 'JHCV12345JM123456',
};

/**
 * Standard valid user credentials for testing
 */
export const validUserCredentials = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  dealershipId: 'test-dealer-01',
  role: 'BDR',
};

/**
 * Standard admin credentials for testing
 */
export const adminCredentials = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  dealershipId: 'test-dealer-01',
  role: 'admin',
};

/**
 * Mock provider response template
 */
export const mockProviderResponse = {
  source: 'test-provider',
  value: 15000,
  currency: 'USD',
  timestamp: new Date().toISOString(),
  confidence: 0.85,
};

/**
 * Mock depreciation factors by condition
 */
export const depreciationFactors = {
  5: 1.0,    // Excellent
  4: 0.95,   // Very Good
  3: 0.9,    // Good
  2: 0.8,    // Fair
  1: 0.6,    // Poor
};

/**
 * Mock vehicle data for various test scenarios
 */
export const mockVehicles = {
  standard: {
    year: 2020,
    make: 'Honda',
    model: 'Accord',
    mileage: 45000,
    vin: 'JHCV12345JM123456',
  },
  luxury: {
    year: 2022,
    make: 'BMW',
    model: '3 Series',
    mileage: 15000,
    vin: 'WBADT43452G297186',
  },
  economy: {
    year: 2018,
    make: 'Toyota',
    model: 'Corolla',
    mileage: 120000,
    vin: 'JTDKARFP2J3012345',
  },
  oldVehicle: {
    year: 2005,
    make: 'Ford',
    model: 'F-150',
    mileage: 180000,
    vin: '1FTFX12505FC12345',
  },
};

/**
 * Mock provider error scenarios
 */
export const providerErrorScenarios = {
  timeout: { status: 408, message: 'Request timeout' },
  serviceUnavailable: { status: 503, message: 'Service unavailable' },
  badRequest: { status: 400, message: 'Bad request' },
  unauthorized: { status: 401, message: 'Unauthorized' },
  forbidden: { status: 403, message: 'Forbidden' },
  notFound: { status: 404, message: 'Not found' },
  serverError: { status: 500, message: 'Internal server error' },
  badGateway: { status: 502, message: 'Bad gateway' },
};

/**
 * Utility: Generate random valid VIN
 */
export function generateRandomVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
}

/**
 * Utility: Generate mock valuation response
 */
export function generateMockValuation(overrides: any = {}) {
  return {
    id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    baseWholesaleValue: 15000,
    finalWholesaleValue: 13500,
    quotes: [
      { source: 'NADA', value: 14500, currency: 'USD' },
      { source: 'BlackBook', value: 15200, currency: 'USD' },
      { source: 'KBB', value: 14800, currency: 'USD' },
    ],
    depreciation: {
      depreciationFactor: 0.9,
      conditionRating: 3,
      finalWholesaleValue: 13500,
    },
    vehicle: {
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      mileage: 45000,
      vin: 'JHCV12345JM123456',
    },
    dealership: {
      id: 'test-dealer-01',
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Utility: Wait for a specified time (useful for async operations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility: Create bearer token for auth tests
 */
export function createBearerToken(userId: string = 'test-user-id'): string {
  return `Bearer test-token-for-user-${userId}`;
}

// ============================================================================
// ERROR HANDLING & LOGGING
// ============================================================================

/**
 * Global error handler for test errors
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// ============================================================================
// SUPPRESS CONSOLE LOGS DURING TESTS
// ============================================================================

// Suppress console.log but keep console.error and console.warn
const originalLog = console.log;
const originalInfo = console.info;

console.log = (...args: any[]) => {
  // Only log if it contains specific keywords useful for debugging
  const message = args.join(' ');
  if (
    message.includes('error') ||
    message.includes('failed') ||
    message.includes('✓') ||
    message.includes('✗')
  ) {
    originalLog(...args);
  }
};

console.info = () => {
  // Suppress info logs during tests
};

// Restore on process exit
process.on('exit', () => {
  console.log = originalLog;
  console.info = originalInfo;
});
