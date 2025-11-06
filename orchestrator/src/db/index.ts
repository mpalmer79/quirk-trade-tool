import { Pool } from 'pg';
import { z } from 'zod';
import pino from 'pino';

const log = pino();

// Support both PG* and DB_* environment variables for backwards compatibility
const envSchema = z.object({
  // Try PGHOST first, fallback to DB_HOST
  PGHOST: z.string().optional(),
  DB_HOST: z.string().optional(),
  
  // Try PGPORT first, fallback to DB_PORT
  PGPORT: z.coerce.number().int().optional(),
  DB_PORT: z.coerce.number().int().optional(),
  
  // Try PGDATABASE first, fallback to DB_NAME
  PGDATABASE: z.string().optional(),
  DB_NAME: z.string().optional(),
  
  // Try PGUSER first, fallback to DB_USER
  PGUSER: z.string().optional(),
  DB_USER: z.string().optional(),
  
  // Try PGPASSWORD first, fallback to DB_PASSWORD
  PGPASSWORD: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  
  NODE_ENV: z.string().optional(),
});

const rawEnv = envSchema.parse(process.env);

// Resolve which environment variables to use
const dbConfig = {
  host: rawEnv.PGHOST || rawEnv.DB_HOST,
  port: rawEnv.PGPORT || rawEnv.DB_PORT || 5432,
  database: rawEnv.PGDATABASE || rawEnv.DB_NAME,
  user: rawEnv.PGUSER || rawEnv.DB_USER,
  password: rawEnv.PGPASSWORD || rawEnv.DB_PASSWORD,
};

// Validate that we have all required database configuration
if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
  const missing = [];
  if (!dbConfig.host) missing.push('PGHOST or DB_HOST');
  if (!dbConfig.database) missing.push('PGDATABASE or DB_NAME');
  if (!dbConfig.user) missing.push('PGUSER or DB_USER');
  if (!dbConfig.password) missing.push('PGPASSWORD or DB_PASSWORD');
  
  log.error(`Missing required database configuration: ${missing.join(', ')}`);
  throw new Error(`Missing required database configuration: ${missing.join(', ')}`);
}

// Create pool with proper SSL configuration
export const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  // Use proper SSL configuration for production
  ssl: rawEnv.NODE_ENV === 'production' 
    ? {
        rejectUnauthorized: true, // SECURITY: Always verify SSL certificates in production
        // If using self-signed certificates, provide the CA certificate instead
        // ca: process.env.DB_SSL_CA,
      }
    : undefined,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Properly type the error and avoid implicit any
pool.on('error', (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  log.error('Database connection pool error:', error);
});

// Export a health check function
export async function validateDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    log.info('✅ Database connection verified');
    return true;
  } catch (error) {
    log.error('❌ Database connection failed:', error);
    return false;
  }
}

// Export database wrapper with common operations
export const db = {
  query: pool.query.bind(pool),
  
  async healthCheck(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
  
  async end(): Promise<void> {
    await pool.end();
  }
};
