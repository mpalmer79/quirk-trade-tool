import { z } from 'zod';

/**
 * Environment variable schema with validation and defaults.
 * Validates at startup — fails fast if config is invalid.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .pipe(z.coerce.number().min(1).max(65535))
    .default('4000'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  ALLOW_ORIGINS: z.string().optional(),
  RECEIPTS_DIR: z.string().default('./data/receipts'),
  MAX_REQUEST_SIZE: z.string().default('200kb'),
  
  // Security-critical variables
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATA_KEY: z.string().length(32, 'DATA_KEY must be exactly 32 characters'),
  
  // Database configuration
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.string().pipe(z.coerce.number().min(1).max(65535)).default('5432'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(8, 'DB_PASSWORD must be at least 8 characters'),
  DB_SSL: z.string().pipe(z.coerce.boolean()).default('false'),
  
  // API keys for external providers (optional for development)
  BLACKBOOK_API_KEY: z.string().optional(),
  BLACKBOOK_API_URL: z.string().url().optional(),
  KBB_API_KEY: z.string().optional(),
  KBB_API_URL: z.string().url().optional(),
  NADA_API_KEY: z.string().optional(),
  NADA_API_URL: z.string().url().optional(),
  MANHEIM_API_KEY: z.string().optional(),
  MANHEIM_API_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate and parse environment variables.
 * Throws with detailed error messages if validation fails.
 */
export function validateEnv(): Env {
  try {
    return EnvSchema.parse(process.env);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:\n');
      err.errors.forEach(e => {
        const path = e.path.join('.');
        console.error(`  • ${path}: ${e.message}`);
      });
      console.error(
        '\nPlease check your .env file or environment variables.\n'
      );
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Validated environment variables.
 * Safe to use throughout the app — values are guaranteed to be correct.
 */
export const env = validateEnv();
