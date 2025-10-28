# Quirk Trade Tool

Multi-source vehicle valuation **demo** for Quirk Auto Dealers. The app is organized as a minimal monorepo:

- **frontend/** — Next.js 14 UI (TypeScript, Tailwind, React Hook Form, Zod)
- **orchestrator/** — Express + TypeScript API that:
  - normalizes provider quotes (demo adapters provided)
  - aggregates values (outlier drop + trimmed mean + confidence band)
  - decodes VINs via **NHTSA VPIC** fallback
  - writes an immutable **Appraisal Receipt** (JSON) and can render a PDF on demand

> **Legal/production note:** This repo ships **demo provider adapters** (BlackBook/KBB/NADA/Manheim/Auction) that simulate results. For production, you must implement licensed provider integrations under `orchestrator/src/adapters/providers/*` and wire them in. Do **not** imply live aggregation until licensed APIs are connected and validated

---

## Repo layout

├─ frontend/ # Next.js 14 app
│ ├─ app/ # page.tsx renders form + results
│ ├─ components/ # ValuationForm, ValuationResults, etc.
│ ├─ hooks/useVehicleData.ts # NHTSA-backed make/model/year helpers
│ └─ … # Tailwind/PostCSS/tsconfig
├─ orchestrator/ # Express + TS API
│ ├─ src/routes/ # /api/appraise, /api/vin, /api/receipt
│ ├─ src/adapters/ # demo* adapters + provider stubs
│ ├─ src/valuation/ # outlier handling + trimmed mean
│ ├─ src/vin/ # NHTSA VPIC fallback decoder
│ └─ src/util/ # receipts + PDF generation
├─ data/receipts/ # Appraisal receipts are written here at runtime
├─ package.json # pnpm workspaces (frontend, orchestrator)
└─ pnpm-workspace.yaml


---

## Requirements

- **Node 20+**
- **pnpm** (Corepack recommended)

---

## Quick start (local dev)

```bash
# install everything
pnpm install

# frontend: point to the API
cp frontend/.env.local frontend/.env.local   # already points to http://localhost:4000

# run both apps (frontend :3000, API :4000)
pnpm dev

## Multi-store support
- Frontend shows a Dealership dropdown sourced from `frontend/app/lib/dealerships.ts`.
- Orchestrator validates `storeId` against `src/config/dealerships.json` and stamps it on the receipt (JSON + PDF).
- To add or rename stores, edit both files and redeploy (no code changes required).
