import { Pool } from 'pg';
import { z } from 'zod';

const envSchema = z.object({
  PGHOST: z.string(),
  PGPORT: z.coerce.number().int(),
  PGDATABASE: z.string(),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
});
const env = envSchema.parse(process.env);

export const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Properly type the error and avoid implicit any
pool.on('error', (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  // eslint-disable-next-line no-console
  console.error('✗ Database connection failed:', error);
});
