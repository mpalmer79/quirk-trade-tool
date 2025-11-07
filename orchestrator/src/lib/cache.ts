/**
 * Cache Layer
 * Stores and retrieves valuation results for 24 hours
 * Cache key includes: VIN (or year-make-model) + CONDITION + MILEAGE
 * 
 * This prevents stale data from being served when the same vehicle
 * is appraised with different condition ratings
 */

import Redis from 'ioredis';
import type { ValuationResult } from '../types/valuation.types';

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Error handling
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Cache configuration
const CACHE_TTL_SECONDS = 86400; // 24 hours
const CACHE_PREFIX = 'valuation:';

/**
 * Generate cache key from vehicle parameters
 * ✅ NOW INCLUDES CONDITION for proper cache isolation
 * 
 * @param identifier VIN or "year-make-model"
 * @param condition 1-5 condition rating
 * @param mileage Vehicle mileage
 * @returns Cache key string
 */
function generateCacheKey(identifier: string, condition: number, mileage: number): string {
  return `${CACHE_PREFIX}${identifier}:${condition}:${mileage}`;
}

/**
 * Cache a valuation result for 24 hours
 * ✅ NOW INCLUDES CONDITION in cache key
 * 
 * @param identifier VIN or "year-make-model"
 * @param condition 1-5 condition rating
 * @param mileage Vehicle mileage
 * @param result ValuationResult to cache
 * @throws Error if cache operation fails
 */
export async function cacheValuationResult(
  identifier: string,
  condition: number,
  mileage: number,
  result: ValuationResult
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(identifier, condition, mileage);
    
    console.log(`💾 Caching valuation [${cacheKey}] for 24 hours`);
    
    await redis.setex(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(result)
    );

    console.log(`✅ Cached successfully: ${cacheKey}`);
  } catch (error) {
    console.error('⚠️ Cache storage failed:', error);
    // Don't throw - allow valuation to continue even if cache fails
  }
}

/**
 * Retrieve a cached valuation result
 * ✅ NOW INCLUDES CONDITION in cache key lookup
 * 
 * @param identifier VIN or "year-make-model"
 * @param condition 1-5 condition rating
 * @param mileage Vehicle mileage
 * @returns Cached ValuationResult or null if not found/expired
 * @throws Error if cache operation fails
 */
export async function getValuationFromCache(
  identifier: string,
  condition: number,
  mileage: number
): Promise<ValuationResult | null> {
  try {
    const cacheKey = generateCacheKey(identifier, condition, mileage);
    
    console.log(`🔍 Looking up cache [${cacheKey}]`);
    
    const cached = await redis.get(cacheKey);
    
    if (!cached) {
      console.log(`❌ Cache miss: ${cacheKey}`);
      return null;
    }

    const result = JSON.parse(cached) as ValuationResult;
    console.log(`✅ Cache hit: ${cacheKey}`);
    
    return result;
  } catch (error) {
    console.error('⚠️ Cache retrieval failed:', error);
    return null;
  }
}

/**
 * Clear cache for a specific vehicle
 * Useful for testing or manual cache invalidation
 * 
 * @param identifier VIN or "year-make-model"
 * @param condition 1-5 condition rating (optional - clears all if not provided)
 * @param mileage Vehicle mileage (optional)
 * @returns Number of keys deleted
 */
export async function clearValuationCache(
  identifier: string,
  condition?: number,
  mileage?: number
): Promise<number> {
  try {
    if (condition !== undefined && mileage !== undefined) {
      // Clear specific entry
      const cacheKey = generateCacheKey(identifier, condition, mileage);
      const deleted = await redis.del(cacheKey);
      console.log(`🗑️ Cleared cache: ${cacheKey} (${deleted} keys)`);
      return deleted;
    } else {
      // Clear all entries for this identifier
      const pattern = `${CACHE_PREFIX}${identifier}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) {
        console.log(`❌ No cache entries found for: ${identifier}`);
        return 0;
      }

      const deleted = await redis.del(...keys);
      console.log(`🗑️ Cleared ${deleted} cache entries for: ${identifier}`);
      return deleted;
    }
  } catch (error) {
    console.error('⚠️ Cache clear failed:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 * Returns information about cached valuations
 * 
 * @returns Statistics object
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  totalSize: string;
  connected: boolean;
}> {
  try {
    const info = await redis.info('memory');
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    
    return {
      totalKeys: keys.length,
      totalSize: extractMemoryUsage(info),
      connected: redis.status === 'ready',
    };
  } catch (error) {
    console.error('⚠️ Failed to get cache stats:', error);
    return {
      totalKeys: 0,
      totalSize: 'unknown',
      connected: false,
    };
  }
}

/**
 * Health check for Redis connection
 * 
 * @returns true if connected and responsive
 */
export async function checkCacheHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('⚠️ Redis health check failed:', error);
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeCacheConnection(): Promise<void> {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed');
  } catch (error) {
    console.error('⚠️ Failed to close Redis connection:', error);
    redis.disconnect();
  }
}

// Helper: Extract memory usage from Redis info
function extractMemoryUsage(info: string): string {
  const match = info.match(/used_memory_human:(.+?)\r/);
  return match ? match[1] : 'unknown';
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing cache connection...');
  await closeCacheConnection();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing cache connection...');
  await closeCacheConnection();
});

/**
 * Export cache key generator for testing
 */
export { generateCacheKey };
