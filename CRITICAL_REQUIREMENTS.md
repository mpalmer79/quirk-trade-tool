# Critical Requirements - Quirk Trade Tool

This document outlines **non-negotiable requirements** that must be preserved during development, refactoring, or AI-assisted code modifications.

---

## 🚨 UI/UX Critical Elements

### 1. Admin Login Link (Homepage)
**Location:** `frontend/app/page.tsx` - Hero section, top-right corner

**Requirement:** The Admin Login link MUST be preserved at all times.

**Code Reference:**
```tsx
{/* ⚠️ CRITICAL: DO NOT REMOVE - Admin Login Link Required */}
<div className="flex-shrink-0">
  <Link href="/login" className="...">
    <span>Admin Login</span>
  </Link>
</div>
```

**Why:** This is the **only access point** to the admin dashboard. Removing it would lock all users out of administrative functions including:
- User management
- Dealership configuration
- Reports and analytics
- System settings

**Exception:** Only remove if building an alternative navigation system and explicitly requested.

---

## 🔒 Security Critical Elements

### 1. Environment Variables
**Files:** `.env`, `.env.local`, `.env.production`

**Never commit:**
- API keys (BlackBook, KBB, NADA, Manheim, AutoDev)
- Database credentials
- JWT secrets
- Redis connection strings

**Always use:** `.env.example` files as templates.

---

## 📊 Data Integrity Requirements

### 1. Valuation Provider Adapters
**Location:** `orchestrator/src/adapters/providers/`

**Requirement:** All provider integrations must:
- Return normalized quote format
- Handle errors gracefully with fallbacks
- Log all API calls for audit trails
- Cache responses appropriately

**Why:** Inconsistent data formats can corrupt aggregated valuations.

---

## 🗄️ Database Schema Requirements

### 1. User-Dealership Relationships
**Tables:** `users`, `user_dealerships`

**Requirement:** 
- Never orphan user records
- Always use CASCADE on foreign key deletes
- Maintain dealership ID consistency between frontend and backend

**Why:** Breaking these relationships locks users out of their assigned dealerships.

---

## 🎯 Permission System Rules

### Role Hierarchy (Cannot be changed without full system review)
1. **Admin** - Full access to all dealerships
2. **General Manager** - Multiple dealerships, can manage GSMs
3. **General Sales Manager** - Single dealership, can manage Sales Managers
4. **Sales Manager** - Single dealership, read-only users

**Why:** The entire authorization system depends on this hierarchy.

---

## 📝 Documentation Standards

### 1. API Documentation
**File:** `docs/API.md`

**Requirement:** 
- All new endpoints must be documented
- Include request/response examples
- Document error codes
- Note authentication requirements

---

## 🚀 Deployment Requirements

### 1. Multi-Environment Support
**Requirement:** Code must work in:
- Local development (localhost:3000, localhost:4000)
- Staging environments
- Production (custom domains)

**Always use:** Environment variables for API endpoints, never hardcode URLs.

---

## ⚠️ Breaking Change Protocol

Before making changes that affect:
- User authentication flow
- Database schema
- API endpoint contracts
- Permission system logic

**You must:**
1. Document the change in this file
2. Update migration scripts
3. Test with all user roles
4. Update API documentation
5. Notify all stakeholders

---

## 📋 Code Comment Conventions

### Critical Elements Format
```tsx
{/* ⚠️ CRITICAL: DO NOT REMOVE - [Description] */}
{/* [Detailed explanation of why it's critical] */}
{/* [Code block] */}
```

### Important Elements Format
```tsx
{/* ✅ IMPORTANT: [Description] */}
{/* [Explanation] */}
{/* [Code block] */}
```

---

## 🔄 Update History

| Date | Change | Reason |
|------|--------|--------|
| 2024-10-31 | Added Admin Login requirement | AI assistant confusion prevention |

---

## 📞 Questions?

If you're unsure whether something is a critical requirement:
1. Check if removing it breaks core functionality
2. Search this file for related warnings
3. Consult with the technical lead
4. When in doubt, **preserve it**

---

**Last Updated:** October 31, 2024  
**Maintained By:** Development Team
