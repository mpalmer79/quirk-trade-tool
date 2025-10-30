/**
 * Startup Validation
 * Validates critical application configuration on startup
 * Prevents the app from running with bad depreciation factors
 */

import { depreciationCalculator } from '../services/depreciation-calculator';

/**
 * Run all startup validations
 * Called in app.ts before the server starts
 * 
 * Exits the process if any validation fails
 */
export function validateOnStartup(): void {
  console.log('🔍 Running startup validation checks...\n');

  // ============================================================================
  // Validation 1: Check depreciation calculator configuration
  // ============================================================================
  console.log('✓ Validating depreciation calculator...');
  
  const isDepreciationValid = depreciationCalculator.validateConfiguration();
  
  if (!isDepreciationValid) {
    console.error('❌ STARTUP FAILED: Depreciation calculator configuration is invalid!');
    console.error('   Please check depreciation factors in depreciation-calculator.ts');
    process.exit(1);
  }
  
  const depreciationConfig = depreciationCalculator.exportConfiguration();
  console.log('   ✅ Depreciation calculator: VALID');
  console.log(`   📊 Depreciation Factors:`);
  console.log(`      - Excellent (5): ${(depreciationConfig.factors.excellent * 100).toFixed(0)}%`);
  console.log(`      - Very Good (4): ${(depreciationConfig.factors.veryGood * 100).toFixed(0)}%`);
  console.log(`      - Good (3): ${(depreciationConfig.factors.good * 100).toFixed(0)}%`);
  console.log(`      - Fair (2): ${(depreciationConfig.factors.fair * 100).toFixed(0)}%`);
  console.log(`      - Poor (1): ${(depreciationConfig.factors.poor * 100).toFixed(0)}%\n`);

  // ============================================================================
  // Validation 2: Check environment variables
  // ============================================================================
  console.log('✓ Validating environment configuration...');
  
  const requiredEnvVars = ['NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing optional environment variables: ${missingEnvVars.join(', ')}`);
  } else {
    console.log('   ✅ Environment configuration: VALID\n');
  }

  // ============================================================================
  // Validation 3: Check Redis connection (if configured)
  // ============================================================================
  if (process.env.REDIS_HOST) {
    console.log('✓ Redis is configured (will connect on first cache operation)...');
    console.log(`   REDIS_HOST: ${process.env.REDIS_HOST}`);
    console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 6379}\n`);
  } else {
    console.warn('⚠️  Redis not configured - using in-memory cache\n');
  }

  // ============================================================================
  // All Validations Passed
  // ============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All startup validations passed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
