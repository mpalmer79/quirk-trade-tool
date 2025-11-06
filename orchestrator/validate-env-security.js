#!/usr/bin/env node

/**
 * Environment Security Validator
 * Run this script to validate your environment configuration before deployment
 * Usage: node validate-env-security.js
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let hasErrors = false;
let hasWarnings = false;

function error(message) {
  console.error(`${colors.red}✗ ERROR: ${message}${colors.reset}`);
  hasErrors = true;
}

function warning(message) {
  console.warn(`${colors.yellow}⚠ WARNING: ${message}${colors.reset}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`  ${message}`);
}

console.log('\n🔒 Security Configuration Validator\n');
console.log('=' .repeat(50));

// 1. Check JWT Secret
console.log('\n1. JWT Secret Validation:');
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  error('JWT_SECRET is not set');
} else {
  if (jwtSecret.length < 32) {
    error(`JWT_SECRET is too short (${jwtSecret.length} chars). Minimum 32 characters required.`);
  } else {
    success(`JWT_SECRET length is adequate (${jwtSecret.length} chars)`);
  }
  
  const weakPatterns = [
    'change-me', 'secret', 'password', '12345', 
    'test', 'demo', 'example', 'default'
  ];
  
  const hasWeakPattern = weakPatterns.some(pattern => 
    jwtSecret.toLowerCase().includes(pattern)
  );
  
  if (hasWeakPattern) {
    error('JWT_SECRET contains weak or default patterns');
  } else {
    success('JWT_SECRET does not contain common weak patterns');
  }
  
  // Check entropy
  const hasUpperCase = /[A-Z]/.test(jwtSecret);
  const hasLowerCase = /[a-z]/.test(jwtSecret);
  const hasNumbers = /\d/.test(jwtSecret);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(jwtSecret);
  
  const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
    .filter(Boolean).length;
  
  if (varietyCount < 3) {
    warning('JWT_SECRET should use at least 3 character types (uppercase, lowercase, numbers, special)');
    info(`Current: ${varietyCount}/4 character types`);
  } else {
    success(`JWT_SECRET has good character variety (${varietyCount}/4 types)`);
  }
}

// 2. Check Database Configuration
console.log('\n2. Database Configuration:');

const dbHost = process.env.PGHOST || process.env.DB_HOST;
const dbPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD;

if (!dbHost) {
  error('Database host not configured (PGHOST or DB_HOST)');
} else {
  success('Database host configured');
  
  if (dbHost.includes('localhost') || dbHost.includes('127.0.0.1')) {
    if (process.env.NODE_ENV === 'production') {
      warning('Using localhost database in production environment');
    }
  }
}

if (!dbPassword) {
  error('Database password not set (PGPASSWORD or DB_PASSWORD)');
} else {
  if (dbPassword.length < 12) {
    warning(`Database password is short (${dbPassword.length} chars). Consider using longer password.`);
  } else {
    success('Database password configured');
  }
  
  // Check for exposed password in example file
  const commonPasswords = ['password', '12345', 'admin', 'postgres', 'test'];
  if (commonPasswords.some(weak => dbPassword.toLowerCase().includes(weak))) {
    error('Database password contains common weak patterns');
  }
}

// 3. Check Data Encryption Key
console.log('\n3. Data Encryption Key:');
const dataKey = process.env.DATA_KEY;

if (!dataKey) {
  warning('DATA_KEY not set - data encryption disabled');
} else if (dataKey === 'replace-with-32-char-secret' || dataKey.includes('CHANGE')) {
  error('DATA_KEY still has default/placeholder value');
} else if (dataKey.length !== 32) {
  error(`DATA_KEY must be exactly 32 characters (current: ${dataKey.length})`);
} else {
  success('DATA_KEY properly configured (32 chars)');
}

// 4. Check CORS Configuration
console.log('\n4. CORS Configuration:');
const corsOrigins = process.env.CORS_ORIGINS || process.env.ALLOW_ORIGINS;

if (!corsOrigins) {
  warning('CORS_ORIGINS not configured - using defaults');
} else {
  const origins = corsOrigins.split(',').map(o => o.trim());
  info(`Configured origins: ${origins.join(', ')}`);
  
  if (origins.includes('*')) {
    error('CORS configured with wildcard (*) - security risk!');
  }
  
  if (process.env.NODE_ENV === 'production') {
    const hasLocalhost = origins.some(o => 
      o.includes('localhost') || o.includes('127.0.0.1')
    );
    if (hasLocalhost) {
      warning('CORS includes localhost origins in production');
    }
  }
  
  success(`CORS configured with ${origins.length} origin(s)`);
}

// 5. Check Environment Mode
console.log('\n5. Environment Mode:');
const nodeEnv = process.env.NODE_ENV;

if (!nodeEnv) {
  warning('NODE_ENV not set - defaulting to development');
} else {
  info(`Running in ${nodeEnv} mode`);
  
  if (nodeEnv === 'production') {
    success('Production mode enabled - strict validation applied');
  } else if (nodeEnv === 'development') {
    info('Development mode - some checks relaxed');
  }
}

// 6. Check for .env files that shouldn't exist
console.log('\n6. File Security Check:');

const sensitiveFiles = [
  '.env.production',
  '.env.staging',
  '.env.local'
];

const existingSensitiveFiles = sensitiveFiles.filter(file => {
  const filePath = path.join(__dirname, file);
  return fs.existsSync(filePath);
});

if (existingSensitiveFiles.length > 0) {
  warning(`Found environment files that should not be committed: ${existingSensitiveFiles.join(', ')}`);
  info('Ensure these are in .gitignore');
} else {
  success('No sensitive environment files found in repository');
}

// 7. Check .gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const requiredIgnores = ['.env', '.env.production', '.env.local'];
  
  const missingIgnores = requiredIgnores.filter(pattern => 
    !gitignore.includes(pattern)
  );
  
  if (missingIgnores.length > 0) {
    error(`.gitignore missing patterns: ${missingIgnores.join(', ')}`);
  } else {
    success('All sensitive files properly configured in .gitignore');
  }
}

// Summary
console.log('\n' + '=' .repeat(50));
console.log('\n📊 Validation Summary:\n');

if (hasErrors) {
  console.log(`${colors.red}❌ FAILED: ${hasErrors ? 'Critical security issues found' : ''}${colors.reset}`);
  console.log('\nPlease fix all errors before deploying to production.');
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  PASSED WITH WARNINGS${colors.reset}`);
  console.log('\nConsider addressing warnings for better security.');
  process.exit(0);
} else {
  console.log(`${colors.green}✅ PASSED: Configuration is secure${colors.reset}`);
  process.exit(0);
}
