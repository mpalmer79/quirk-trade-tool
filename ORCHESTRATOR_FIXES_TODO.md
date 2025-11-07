# Orchestrator TypeScript Fixes - Action Plan

## Completed ✅
- ✅ Frontend: All TypeScript strict mode errors fixed
- ✅ Security: Removed committed credentials from repository
- ✅ Middleware: Fixed auth.ts and validate.ts return types

## Remaining Work (32 TypeScript Errors)

### Category 1: Missing Return Types (11 errors)
**Files:** routes/auth.ts, routes/appraise.ts, routes/receipt.ts, server.ts, services/authorization-service.ts

**Fix Pattern:**
```typescript
// Change this:
asyncHandler(async (req: Request, res: Response) => {
  // code
})

// To this:
asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // code
})
```

**Affected Lines:**
- src/routes/appraise.ts:34
- src/routes/auth.ts:26, 101, 157, 210
- src/routes/receipt.ts:65, 137
- src/server.ts:65
- src/services/authorization-service.ts:48, 74, 106

### Category 2: Type Definition Issues (9 errors)
**Problem:** Audit log objects have properties not defined in type

**Files:** routes/appraise.ts, auth.ts, qaa.ts, receipt.ts, valuations.ts, vin.ts

**Fix:** Update audit log type definition:
```typescript
// In types/audit.ts or similar
interface AuditLog {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  timestamp: Date;
  dealershipId?: string;  // ADD THIS
  metadata?: Record<string, unknown>;  // ADD THIS
}
```

### Category 3: Missing Properties (2 errors)
**Files:** routes/appraise.ts

**Fix:** Add `vin` to request body type or make it optional

### Category 4: Missing Module (1 error)
**File:** src/lib/cache.ts

**Fix Options:**
1. Install ioredis: `pnpm add ioredis @types/ioredis`
2. Or comment out cache.ts if not using Redis yet

### Category 5: Missing Export (1 error)
**File:** src/lib/cache.ts

**Fix:** Export ValuationResult from services/valuation-service.ts

### Category 6: Missing Database Method (2 errors)
**File:** src/repositories/user-repository.ts

**Fix:** Add getClient() method to database connection object

### Category 7: Type Assertion Issues (2 errors)
**Files:** src/services/auth-service.ts

**Fix:** Proper type handling for JWT payload

### Category 8: Function Type Error (1 error)
**File:** src/middleware/error-handler.ts

**Fix:** Replace `Function` type with proper signature

## Linting Issues (60 problems)

### Critical (9 errors):
1. `prefer-const` violations (variables that should be const)
2. `@typescript-eslint/no-namespace` (2 instances - middleware files)
3. `@typescript-eslint/ban-types` (Function type usage)

### Warnings (51):
- `@typescript-eslint/no-explicit-any` (48 instances)
- `@typescript-eslint/no-unused-vars` (3 instances)

**Fix Strategy:**
1. Run `pnpm lint:fix` to auto-fix what can be fixed
2. Replace `any` types with proper types
3. Remove unused variables
4. Convert namespaces to ES6 modules

## Execution Steps

### Step 1: Fix Return Types (Quick)
```bash
# Add `: Promise<void>` to all async route handlers
# Add `: void` to all sync middleware
```

### Step 2: Fix Type Definitions (Medium)
```bash
# Update audit log interface
# Export ValuationResult
# Add database getClient method
```

### Step 3: Fix Linting (Medium)
```bash
cd orchestrator
pnpm lint:fix
# Then manually fix remaining issues
```

### Step 4: Optional - Add Missing Module
```bash
pnpm add ioredis @types/ioredis
# Or comment out cache.ts if not needed yet
```

## Time Estimate
- Return types: 30 minutes
- Type definitions: 45 minutes
- Linting: 1-2 hours
- Testing: 30 minutes

**Total:** 3-4 hours of focused work

## Verification Commands
```bash
# Check build
cd orchestrator && pnpm build

# Check linting
cd orchestrator && pnpm lint

# Check tests
cd orchestrator && pnpm test

# Full CI check
cd .. && pnpm test && pnpm lint && pnpm build
```
