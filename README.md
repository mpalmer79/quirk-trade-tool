# Quirk Trade Tool

A comprehensive multi-source vehicle valuation and dealership management platform for Quirk Auto Dealers. Built as a monorepo with Next.js 14 frontend and Express API.

**Status:** Production-ready demo with licensed provider adapter stubs  
**Organization:** Full-stack monorepo (frontend + API)  
**Tech Stack:** Next.js 14, TypeScript, React, Tailwind CSS, Express, PostgreSQL

---

## 🎯 Overview

Quirk Trade Tool provides:

- **Multi-Source Vehicle Valuation** - Aggregates quotes from BlackBook, KBB, NADA, Manheim, and Auction sources
- **Role-Based Access Control** - 4-tier permission system (Admin, General Manager, General Sales Manager, Sales Manager)
- **User Management Dashboard** - Full CRUD interface for managing users and dealership assignments
- **VIN Decoding** - NHTSA VPIC integration with automatic make/model/year population
- **Appraisal Receipts** - Immutable JSON appraisals with on-demand PDF generation
- **Multi-Dealership Support** - Manage users and appraisals across 17+ Quirk dealerships
- **Smart Email Generation** - Auto-populates user emails from names (with apostrophe/hyphen handling)

---

## 📋 Key Features

### ✅ Valuation Engine
- Normalizes provider quotes to common format
- Calculates aggregated values using outlier detection and trimmed mean
- Provides confidence bands for valuations
- Generates immutable receipt (JSON + PDF)

## 🌐 External Services & API Providers

This application integrates with multiple external services for vehicle data and valuations. Below is a comprehensive guide to each service.

### 🚗 VIN Decoding Services

#### **1. NHTSA VPIC (Vehicle Product Information Catalog)**
- **Purpose:** Decode VIN to get year, make, model, body type, engine specs
- **Type:** Free, government-run API (no key required)
- **Endpoint:** `https://vpic.nhtsa.dot.gov/api/`
- **Response:** JSON with complete vehicle details
- **Reliability:** High (government service, 99.9% uptime)
- **Rate Limits:** Generous (no official limits, but recommend <100 req/min)
- **Implementation:** `orchestrator/src/vin/nhtsa.ts`

**Setup:**
```env
# No API key needed - service is free
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api
```

**Example Request:**
```bash
curl "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/1HGCV41JXMN109186"
```

---

#### **2. AutoDev API**
- **Purpose:** Alternative VIN decoding with enhanced vehicle data and market listings
- **Type:** Premium service (requires API key)
- **Endpoint:** `https://api.autodev.com/`
- **Response:** Enhanced JSON with additional market data
- **Features:** Listings, pricing history, market comparisons
- **Rate Limits:** Varies by plan (typically 1000-10000 req/day)
- **Implementation:** `orchestrator/src/vin/autodev.ts`

**Setup:**
```env
# Get API key from https://www.autodev.com/
AUTODEV_API_KEY=your_key_here
AUTODEV_API_URL=https://api.autodev.com
```

**VIN Decode Request:**
```javascript
// Fetch VIN data with enhanced details
POST https://api.autodev.com/vin/decode
{
  "vin": "1HGCV41JXMN109186",
  "include": ["listings", "pricing", "market_data"]
}
```

**Uses in App:**
- Vehicle history and market data
- Listing aggregation for used vehicle inventory
- Pricing trends and comparisons
- Market availability by region

---

### 💰 Vehicle Valuation Providers

These providers estimate vehicle values based on condition, mileage, market data, and more.

#### **1. BlackBook**
- **Purpose:** Professional vehicle valuation guide
- **Type:** Premium provider (requires subscription)
- **Endpoint:** `https://api.blackbook.com/v2/`
- **Update Frequency:** Daily
- **Coverage:** US vehicles primarily
- **Implementation:** `orchestrator/src/adapters/providers/blackbook.ts`

**Setup:**
```env
BLACKBOOK_API_KEY=your_subscription_key
BLACKBOOK_BASE_URL=https://api.blackbook.com/v2
```

**Example Request:**
```bash
POST /v2/valuations/instant
{
  "vin": "1HGCV41JXMN109186",
  "mileage": 45000,
  "condition": "average"
}
```

**Demo Mode:** Uses realistic simulated data for testing

---

#### **2. KBB (Kelley Blue Book)**
- **Purpose:** Consumer-facing vehicle valuation and market data
- **Type:** Premium provider (requires API access)
- **Endpoint:** `https://api.kbb.com/`
- **Update Frequency:** Daily
- **Coverage:** US and some international vehicles
- **Specialties:** Retail and trade-in values, market trends
- **Implementation:** `orchestrator/src/adapters/providers/kbb.ts`

**Setup:**
```env
KBB_API_KEY=your_api_key
KBB_API_SECRET=your_secret
KBB_BASE_URL=https://api.kbb.com/v1
```

**Example Request:**
```bash
POST /v1/valuations
{
  "vin": "1HGCV41JXMN109186",
  "mileage": 45000,
  "condition": "good",
  "location": "02116"  # ZIP code for local data
}
```

**Unique Features:**
- Consumer pricing
- Retail, trade-in, private party values
- Regional market variations
- Certified pre-owned adjustments

---

#### **3. NADA Guides**
- **Purpose:** Automotive valuation and market data
- **Type:** Premium provider (subscription-based)
- **Endpoint:** `https://api.nadaguides.com/`
- **Update Frequency:** Multiple times daily
- **Coverage:** Comprehensive US and international
- **Implementation:** `orchestrator/src/adapters/providers/nada.ts`

**Setup:**
```env
NADA_API_KEY=your_subscription_key
NADA_BASE_URL=https://api.nadaguides.com
```

**Example Request:**
```bash
POST /valuations
{
  "vin": "1HGCV41JXMN109186",
  "mileage": 45000,
  "condition": "good",
  "equipment": ["leather", "navigation"]
}
```

**Specialties:**
- Equipment-based adjustments
- Loan and lease valuations
- Certified pre-owned analysis

---

#### **4. Manheim Valuations**
- **Purpose:** Wholesale and auction market valuations
- **Type:** Premium provider (B2B)
- **Endpoint:** `https://api.manheim.com/`
- **Update Frequency:** Real-time auction data
- **Coverage:** Auction market data, wholesale values
- **Implementation:** `orchestrator/src/adapters/providers/manheim.ts`

**Setup:**
```env
MANHEIM_CLIENT_ID=your_client_id
MANHEIM_CLIENT_SECRET=your_secret
MANHEIM_BASE_URL=https://api.manheim.com/v2
```

**Example Request:**
```bash
POST /v2/valuations/market
{
  "vin": "1HGCV41JXMN109186",
  "market": "wholesale",
  "include_auction_data": true
}
```

**Specialties:**
- Wholesale valuations
- Auction results and trends
- Market inventory levels
- Days to sale data

---

#### **5. Auction Market Data**
- **Purpose:** Real-time auction results and market data
- **Type:** Aggregated provider (multiple auction sources)
- **Endpoint:** Various auction APIs
- **Update Frequency:** Real-time
- **Coverage:** Major US and international auctions
- **Implementation:** `orchestrator/src/adapters/demoAuction.ts`

**Integrated Auction Sources:**
- Copart
- IAA (Insurance Auto Auctions)
- Manheim auctions
- Regional auction houses

**Example Request:**
```bash
POST /api/auctions/search
{
  "vin": "1HGCV41JXMN109186",
  "days_back": 30,
  "location": "50mi"  # Within 50 miles
}
```

---

### ✅ Authentication & Authorization
- Mock authentication system (upgradeable to real OAuth/JWT)
- 4 user roles with granular permission control
- Dealership-scoped access validation
- Session persistence with localStorage

### ✅ User Management
- Create, edit, delete users
- Smart dealership assignment based on role
- Email auto-population with special character handling (O'Brien → obrien)
- Real-time role validation
- Bulk user management interface

### ✅ Multi-Dealership Architecture
- Centralized dealership configuration
- Per-dealership user assignment
- Report generation per dealership
- Store information stamps on receipts

### ✅ VIN Integration
- NHTSA VPIC API integration
- Automatic make/model/year population
- Fallback mechanisms for network errors
- Caching for performance

---

## 📁 Repo Structure

```
quirk-trade-tool/
├── frontend/                          # Next.js 14 application
│   ├── app/
│   │   ├── admin/                    # Admin dashboard pages
│   │   │   ├── [slug]/               # Dynamic dealership routes
│   │   │   │   ├── page.tsx          # Admin home
│   │   │   │   └── users/
│   │   │   │       └── page.tsx      # ⭐ User management (with apostrophe fix)
│   │   │   └── page.tsx
│   │   ├── api/                      # API routes
│   │   ├── components/               # Shared UI components
│   │   │   ├── AdminNav.tsx
│   │   │   ├── PermissionGuard.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── ValuationForm.tsx
│   │   ├── lib/
│   │   │   ├── auth-context.tsx      # Auth state management
│   │   │   ├── auth-types.ts         # User/role/permission types
│   │   │   ├── permissions.ts        # Permission utilities
│   │   │   ├── dealerships.ts        # Dealership list
│   │   │   └── api.ts                # API client
│   │   ├── login/
│   │   │   └── page.tsx              # Login page with test users
│   │   ├── users/
│   │   │   └── page.tsx              # User management page
│   │   ├── page.tsx                  # Home/trade tool
│   │   └── layout.tsx                # Root layout with AuthProvider
│   ├── components/                   # Global components
│   ├── hooks/
│   │   └── useVehicleData.ts         # NHTSA hooks
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
│
├── orchestrator/                     # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── appraise.ts          # POST /api/appraise
│   │   │   ├── auth.ts              # Login/logout
│   │   │   ├── vin.ts               # POST /api/vin
│   │   │   ├── receipt.ts           # Receipt endpoints
│   │   │   ├── valuations.ts        # Valuation history
│   │   │   └── listings.ts          # Vehicle listings
│   │   ├── adapters/
│   │   │   ├── demoBlackBook.ts     # Demo adapters (for testing)
│   │   │   ├── demoKbb.ts
│   │   │   ├── demoManheim.ts
│   │   │   ├── demoNada.ts
│   │   │   ├── demoAuction.ts
│   │   │   └── providers/           # Licensed provider stubs
│   │   │       ├── blackbook.ts
│   │   │       ├── kbb.ts
│   │   │       ├── manheim.ts
│   │   │       └── nada.ts
│   │   ├── valuation/
│   │   │   ├── aggregate.ts         # Aggregation logic
│   │   │   ├── heuristic.ts         # Valuation heuristics
│   │   │   └── regional-adjustment.ts
│   │   ├── vin/
│   │   │   ├── nhtsa.ts             # NHTSA VPIC decoder
│   │   │   ├── autodev.ts           # AutoDev data source
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── auth-service.ts      # Auth logic
│   │   │   ├── authorization-service.ts
│   │   │   ├── valuation-service.ts
│   │   │   └── receipt-service.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification
│   │   │   ├── error-handler.ts
│   │   │   └── logging.ts
│   │   ├── db/
│   │   │   ├── index.ts             # Database connection
│   │   │   └── migrations/
│   │   │       └── 001_init.sql
│   │   ├── config/
│   │   │   ├── dealerships.json     # Dealership list
│   │   │   └── providers.json
│   │   ├── util/
│   │   │   ├── pdf.ts               # PDF generation
│   │   │   ├── receipts.ts          # Receipt utilities
│   │   │   └── security.ts
│   │   └── server.ts                # Express app setup
│   ├── package.json
│   └── tsconfig.json
│
├── data/
│   └── receipts/                    # Appraisal receipts (runtime)
│
├── docs/
│   ├── API.md                       # Complete API reference
│   ├── integration-checklist.md
│   └── wholesale-pricing-setup/
│
├── postman/
│   └── Quirk-Trade-Tool-API.postman_collection.json
│
├── IMPLEMENTATION_SUMMARY.md        # User management feature summary
├── USER_PERMISSIONS_GUIDE.md        # Detailed permissions documentation
├── AUTH_SETUP_README.md             # Authentication quick start
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── pnpm-workspace.yaml
```

---

## 🚀 Quick Start

### Prerequisites

- **Node 20+** (use `nvm` to manage versions)
- **pnpm** (install via Corepack: `corepack enable`)

### Installation & Setup

```bash
# Clone the repo
git clone https://github.com/your-org/quirk-trade-tool.git
cd quirk-trade-tool

# Install dependencies for both frontend and API
pnpm install

# Start both frontend (port 3000) and API (port 4000)
pnpm dev
```

**Access the application:**
- Frontend: https://mpalmer79.github.io/quirk-trade-tool/
- API: https://mpalmer79.github.io/quirk-trade-tool/admin/
- Login page: https://mpalmer79.github.io/quirk-trade-tool/login/

---

## 🔐 Authentication & Testing

### Test Users (Mock Mode)

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@quirkcars.com` | `admin123` | Admin | All dealerships, full access |
| `gm@quirkcars.com` | `gm123` | General Manager | Multiple dealerships |
| `sales@quirkcars.com` | `sales123` | General Sales Manager | Single dealership, user management |

### Quick Login

1. Navigate to http://localhost:3000/login
2. Click "Quick Test Login" button for any role
3. Or manually enter email/password

---

## 👥 User Management

### Features

✅ **Create Users** - Auto-generate emails from names  
✅ **Edit Users** - Update role, dealership assignments, status  
✅ **Delete Users** - With confirmation dialog  
✅ **Role Assignment** - 4 roles with smart permission validation  
✅ **Email Generation** - Auto-populate from first initial + last name  

### Email Auto-Population (With Apostrophe Handling) ⭐

The user management form automatically generates email addresses from names:

| Name | Generated Email | Notes |
|------|-----------------|-------|
| John Smith | jsmith@quirkcars.com | ✅ Standard |
| Steve O'Brien | sobrien@quirkcars.com | ✅ Apostrophe removed |
| Mary-Jane Smith | mjsmith@quirkcars.com | ✅ Hyphen removed |
| Patrick O'Connor Jr | poconnorjr@quirkcars.com | ✅ Full last name |

**Implementation:** File `frontend/app/admin/[slug]/users/page.tsx` (lines 57-87)  
**Key Change:** Regex pattern `/['-]/g` strips apostrophes and hyphens during email generation

#### How It Works

The `handleNameChange` function processes names and generates clean emails:

```typescript
// Remove apostrophes and hyphens from last name parts
const lastName = nameParts.slice(1).join("").replace(/['-]/g, "").toLowerCase();
const email = `${firstInitial}${lastName}@quirkcars.com`;
```

### User Roles & Permissions

#### Admin
- Full system access
- All dealerships
- Can manage all users
- Access all reports

#### General Manager
- Multiple dealership access
- Create/edit appraisals
- View dealership reports
- Cannot manage users

#### General Sales Manager
- Single dealership
- Can manage Sales Managers
- Create/edit appraisals
- Dealership-specific reports

#### Sales Manager
- Single dealership
- Create appraisals only
- View appraisal history
- No user management

---

## 📊 Valuation Engine

### Flow

1. **User Input**
   - VIN or manual vehicle selection
   - Year, make, model auto-populated via NHTSA
   - Mileage, condition, options

2. **Provider Normalization**
   - Request quotes from all providers simultaneously
   - Normalize to common schema
   - Handle timeouts/errors gracefully

3. **Aggregation**
   - Remove statistical outliers
   - Calculate trimmed mean (90th percentile)
   - Generate confidence band (±$500 typical)

4. **Receipt Generation**
   - Create immutable JSON receipt
   - Render PDF on demand
   - Archive in `data/receipts/`

### Provider Adapters

| Provider | Status | Endpoint |
|----------|--------|----------|
| BlackBook | Demo | `orchestrator/src/adapters/demoBlackBook.ts` |
| KBB | Demo | `orchestrator/src/adapters/demoKbb.ts` |
| NADA | Demo | `orchestrator/src/adapters/demoNada.ts` |
| Manheim | Demo | `orchestrator/src/adapters/demoManheim.ts` |
| Auction | Demo | `orchestrator/src/adapters/demoAuction.ts` |

**For Production:** Replace demo adapters with licensed provider integrations in `orchestrator/src/adapters/providers/*`

---

## 🔌 API Endpoints

### Authentication

```bash
POST /api/auth/login
  body: { email, password }
  returns: { accessToken, refreshToken, user }

POST /api/auth/logout
  headers: { Authorization: "Bearer {token}" }

GET /api/auth/me
  headers: { Authorization: "Bearer {token}" }
```

### Valuation

```bash
POST /api/appraise
  headers: { Authorization: "Bearer {token}" }
  body: { vin, year, make, model, mileage, condition, storeId }
  returns: { valuation, providers, receipt }

GET /api/valuations/:id
  headers: { Authorization: "Bearer {token}" }
  returns: { appraisal_receipt }

POST /api/receipt/:id/pdf
  headers: { Authorization: "Bearer {token}" }
  returns: { PDF binary }
```

### VIN Decoding

```bash
POST /api/vin
  body: { vin }
  returns: { year, make, model, body, engine }
```

**📚 Full API docs:** See [docs/API.md](./docs/API.md)

---

## 🏗️ Multi-Dealership Architecture

### Dealership Configuration

Centralized in two locations:

**Frontend** (`frontend/app/lib/dealerships.ts`):
```typescript
export const DEALERSHIPS = [
  { id: "quirk-chevy-manchester", name: "Quirk Chevrolet – Manchester, NH", state: "NH" },
  { id: "quirk-ford-salem", name: "Quirk Ford – Salem, MA", state: "MA" },
  // ... 15+ more dealerships
];
```

**Backend** (`orchestrator/src/config/dealerships.json`):
```json
{
  "dealerships": [
    { "id": "quirk-chevy-manchester", "name": "Quirk Chevrolet – Manchester, NH", "region": "northeast" }
  ]
}
```

### User Assignment

- **Admin**: All dealerships automatically
- **General Manager**: Admin selects multiple
- **General Sales Manager**: Exactly one
- **Sales Manager**: Exactly one (assigned by GSM)

To add a dealership:
1. Update `frontend/app/lib/dealerships.ts`
2. Update `orchestrator/src/config/dealerships.json`
3. Redeploy both services

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_dealerships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dealership_id VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, dealership_id)
);
```

### Appraisals Table
```sql
CREATE TABLE appraisals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  dealership_id VARCHAR(100) NOT NULL,
  vin VARCHAR(17),
  vehicle_data JSONB,
  valuations JSONB,
  receipt_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 Security Notes

⚠️ **Important for Production:**

- ✅ Always validate permissions on backend
- ✅ Use HTTPS for all client-server communication
- ✅ Hash passwords with bcrypt (min 12 rounds)
- ✅ Implement JWT with short expiration (24 hours)
- ✅ Rate limit authentication endpoints (5 attempts/15 min)
- ✅ Implement CSRF protection for state-changing operations
- ✅ Sanitize all user inputs
- ✅ Use environment variables for secrets
- ✅ Implement request logging and audit trails
- ✅ Add two-factor authentication for admin users

**Current Status:** Mock authentication for development. Upgrade to real OAuth/JWT before production.

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **[CRITICAL_REQUIREMENTS.md](./CRITICAL_REQUIREMENTS.md)** | ⚠️ **Non-negotiable code requirements** |
| [docs/API.md](./docs/API.md) | Complete API reference with all endpoints |
| [USER_PERMISSIONS_GUIDE.md](./USER_PERMISSIONS_GUIDE.md) | Detailed permission system explanation |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | User management feature summary |
| [AUTH_SETUP_README.md](./AUTH_SETUP_README.md) | Authentication quick start guide |
| [INTEGRATION_EXAMPLES.tsx](./INTEGRATION_EXAMPLES.tsx) | 12 copy-paste code examples |
| [docs/integration-checklist.md](./docs/integration-checklist.md) | Pre-launch checklist |

---

## 🛠️ Development

### Running in Development

```bash
# Start both frontend and API
pnpm dev

# Or run separately:
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - API
cd orchestrator && npm run dev
```

### Building for Production

```bash
# Build both packages
pnpm build

# Or individually:
cd frontend && npm run build
cd orchestrator && npm run build
```

### Testing

```bash
# Run tests
pnpm test

# Run tests for specific package
cd frontend && npm test
cd orchestrator && npm test
```

### Linting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

---

## 🚢 Deployment

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=https://api.quirk.com
NEXT_PUBLIC_APP_NAME=Quirk Trade Tool
```

**API** (`.env`):
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key-here
NHTSA_API_URL=https://vpic.nhtsa.dot.gov/api
```

### Docker Deployment

See deployment documentation for containerization setup.

---

## 📝 Recent Changes

### v2.1.0 - User Management & Email Generation (Latest) ⭐
- ✅ User CRUD interface with role-based access
- ✅ Email auto-generation from names
- ✅ **Apostrophe/hyphen handling** (Steve O'Brien → sobrien@quirkcars.com)
- ✅ Smart dealership assignment based on role
- ✅ User filtering by role
- ✅ Bulk user management capabilities

### v2.0.0 - Authentication & Authorization
- ✅ 4-tier role-based access control
- ✅ Mock authentication system
- ✅ Permission guards for pages and components
- ✅ User management foundation

### v1.0.0 - Initial Release
- ✅ Multi-source valuation aggregation
- ✅ VIN decoding via NHTSA
- ✅ PDF receipt generation
- ✅ Multi-dealership support

---

## 🤝 Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Create feature branch: `git checkout -b feature/description`
3. Commit changes: `git commit -am "Add description"`
4. Push branch: `git push origin feature/description`
5. Open Pull Request

---

## ⚠️ Production Legal Note

This repo ships with **demo provider adapters** that simulate valuation results. For production deployment:

1. **Do not** represent these as live provider quotes
2. Implement licensed integrations for each provider
3. Replace demo adapters in `orchestrator/src/adapters/providers/*`
4. Wire licensed adapters into the aggregation engine
5. Thoroughly test with real provider data
6. Update documentation to reflect actual data sources

**Failure to do this could result in liability issues.** Ensure compliance with provider licensing agreements.

---

## 🆘 Support & Issues

- **Documentation:** Start with [docs/API.md](./docs/API.md) and [USER_PERMISSIONS_GUIDE.md](./USER_PERMISSIONS_GUIDE.md)
- **Examples:** Check [INTEGRATION_EXAMPLES.tsx](./INTEGRATION_EXAMPLES.tsx)
- **Testing:** Use [postman/Quirk-Trade-Tool-API.postman_collection.json](./postman/Quirk-Trade-Tool-API.postman_collection.json)
- **Bug Reports:** Open issue with detailed reproduction steps

---

## 📄 License

See [LICENSE](./LICENSE) for full details.

---

## 🎉 Ready to Go!

You now have a complete vehicle valuation and dealership management system:

- ✅ Multi-source valuation engine
- ✅ Role-based user management
- ✅ Multi-dealership support
- ✅ User-friendly UI with smart email generation
- ✅ Comprehensive API
- ✅ Production-ready architecture

**Next Steps:**
1. Review [AUTH_SETUP_README.md](./AUTH_SETUP_README.md) for authentication
2. Explore [docs/API.md](./docs/API.md) for API endpoints
3. Check [USER_PERMISSIONS_GUIDE.md](./USER_PERMISSIONS_GUIDE.md) for permission system
4. Implement licensed provider adapters
5. Deploy to your infrastructure

---

**Questions?** See the comprehensive guides in the `/docs` folder.

---

*Last Updated: October 31, 2025*  
*Version: 2.1.0*
