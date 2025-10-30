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
