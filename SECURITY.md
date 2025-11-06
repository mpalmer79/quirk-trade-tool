# Security Configuration Guide

## ⚠️ CRITICAL SECURITY REQUIREMENTS

This document outlines essential security configurations that MUST be completed before deploying to production.

## 1. Environment Variables

### Generate Secure Secrets

**JWT Secret** (minimum 32 characters):
```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

**Data Encryption Key** (exactly 32 characters):
```bash
# Generate a 32-character hex key
openssl rand -hex 16
```

### Required Environment Variables

Create a `.env.production` file (NEVER commit this to Git):
```env
# Security
JWT_SECRET=[your-secure-64-char-token]
DATA_KEY=[your-32-char-hex-key]

# Database (use environment-specific values)
PGHOST=your-database.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=[your-secure-database-password]

# Application
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://yourdomain.com
```

## 2. Database Security

### SSL Configuration
- Always use SSL in production
- Set `rejectUnauthorized: true` in database config
- Never use `rejectUnauthorized: false` in production

### Connection Security
```javascript
// Correct production configuration
ssl: {
  rejectUnauthorized: true,
  // If using self-signed certificates:
  // ca: fs.readFileSync('path/to/ca-certificate.pem')
}
```

## 3. CORS Configuration

Update CORS origins for your production domain:
```env
CORS_ORIGINS=https://your-production-domain.com
ALLOW_ORIGINS=https://your-production-domain.com
```

Never use wildcards (`*`) for CORS in production.

## 4. File Security

### .gitignore Requirements
Ensure ALL environment files are excluded:
```gitignore
.env
.env.*
!.env.example
```

### Verify Before Committing
```bash
# Check if any sensitive files would be committed
git ls-files | grep -E '\.env|password|secret|key'

# Check git history for secrets
git log -p | grep -E 'password|secret|jwt|token' -i
```

## 5. Authentication Security

### Password Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and special characters
- Implement rate limiting on login endpoints
- Use bcrypt with minimum 10 rounds

### Token Security
- JWT expiry: 24h for access tokens
- Refresh token expiry: 7 days
- Always validate tokens on protected routes
- Implement token rotation for refresh tokens

## 6. API Security

### Rate Limiting
Current configuration:
- General API: 100 requests per 15 minutes
- Login endpoint: 5 attempts per 15 minutes

### Request Validation
- Always validate request body with Zod schemas
- Limit request size (current: 200kb)
- Sanitize all user inputs

## 7. Deployment Checklist

Before deploying to production:

- [ ] Generate new JWT_SECRET (minimum 32 characters)
- [ ] Generate new DATA_KEY (32 characters)
- [ ] Update database credentials
- [ ] Configure SSL for database connections
- [ ] Update CORS origins for production domain
- [ ] Remove all console.log statements with sensitive data
- [ ] Enable HTTPS only
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Review and remove all test/demo data
- [ ] Backup database
- [ ] Test authentication flow
- [ ] Verify rate limiting is working
- [ ] Check for exposed ports
- [ ] Run security validation script

## 8. Secret Rotation

Implement regular rotation for:
- JWT secrets (every 90 days)
- Database passwords (every 60 days)
- API keys (when employees leave)

## 9. Monitoring

Set up monitoring for:
- Failed login attempts
- Unusual API usage patterns
- Database connection failures
- JWT validation errors

## 10. Incident Response

If secrets are exposed:
1. Immediately rotate all affected secrets
2. Revoke all active sessions
3. Check logs for unauthorized access
4. Notify affected users if required
5. Update this document with lessons learned

## 11. Generating Secure Secrets Without Command Line

### For JWT_SECRET:
Use one of these methods:
- Visit https://www.grc.com/passwords.htm and use the 63 character string
- Visit https://randomkeygen.com/ and use a CodeIgniter Encryption Key

### For DATA_KEY (must be exactly 32 hex characters):
- Visit https://www.random.org/strings/
- Set Length: 32
- Set Type: Hexadecimal
- Generate and copy

## 12. GitHub Security Best Practices

### Never Commit:
- `.env` files (any variant except .env.example)
- Files containing passwords or API keys
- Database dumps or backups
- SSL certificates or private keys

### Use GitHub Secrets:
1. Go to Settings → Secrets and variables → Actions
2. Add production secrets there, never in code
3. Reference in GitHub Actions workflows only

## Security Vulnerability Reporting

If you discover a security vulnerability in this application:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond to security reports within 48 hours.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Contacts

- Security Lead: [your-email@example.com]
- Emergency Contact: [emergency-contact@example.com]

---

**Last Updated:** November 2024
**Review Schedule:** Monthly
**Document Version:** 1.0.0
