import { Pool, QueryResult } from 'pg';
import pino from 'pino';

const log = pino();

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quirk_trade_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  log.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  log.debug('New client connected to database');
});

/**
 * Database query interface
 */
export const db = {
  /**
   * Execute a query
   */
  query: async <T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        log.warn({
          message: 'Slow query',
          query: text.substring(0, 100),
          duration: `${duration}ms`,
          paramCount: params?.length || 0
        });
      }
      
      return result;
    } catch (error) {
      log.error({
        message: 'Database query error',
        query: text.substring(0, 100),
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  /**
   * Get a client connection (for transactions)
   */
  getClient: () => pool.connect(),

  /**
   * End the pool (for graceful shutdown)
   */
  end: () => pool.end(),

  /**
   * Health check
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Validate database connection on startup
 */
export async function validateDatabaseConnection(): Promise<void> {
  try {
    const result = await db.query('SELECT 1');
    log.info('✅ Database connection successful');
  } catch (error) {
    log.error('❌ Database connection failed:', error);
    throw new Error('Cannot connect to database');
  }
}
