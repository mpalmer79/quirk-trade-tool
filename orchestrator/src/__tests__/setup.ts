/**
 * Vitest Setup File
 * Runs before all tests
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'quirk_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Mock external APIs if needed
beforeAll(() => {
  console.log('🧪 Test suite starting...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});
