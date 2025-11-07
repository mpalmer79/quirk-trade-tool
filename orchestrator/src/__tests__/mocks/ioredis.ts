/**
 * Mock for ioredis to allow tests to run without Redis connection
 * This prevents tests from hanging when Redis is not available
 */

import { vi } from 'vitest';

// Create a mock Redis client
const mockRedis = {
  // Connection methods
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue('OK'),
  
  // Status
  status: 'ready',
  
  // Data methods
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  keys: vi.fn().mockResolvedValue([]),
  
  // Info methods
  info: vi.fn().mockResolvedValue('used_memory_human:1M\r\n'),
  ping: vi.fn().mockResolvedValue('PONG'),
  
  // Event handlers
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  once: vi.fn().mockReturnThis(),
  emit: vi.fn().mockReturnThis(),
};

// Mock the default export (class constructor)
const MockRedis = vi.fn(() => mockRedis);

// Export as default for ES modules
export default MockRedis;

// Also export the mock instance for testing
export { mockRedis };
