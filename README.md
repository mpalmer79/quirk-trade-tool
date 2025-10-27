# Quirk Trade Tool

Multi-source vehicle valuation **demo** for Quirk Auto Dealers. Frontend (Next.js) + Orchestrator (Express). Uses simulated adapters for Black Book, KBB, NADA, and Manheim and computes a trimmed-mean range with a confidence indicator. Stores an immutable “Appraisal Receipt” JSON for auditability.

> **Legal note**: This demo does not call licensed providers. Do not imply live aggregation until you wire actual APIs under license A.

---

## Quick start

**Requirements:** Node 20+, pnpm

```bash
pnpm install
cp .env.example .env
pnpm dev    # runs frontend on :3000 and orchestrator on :4000

.
├─ frontend/         # Next.js 14 UI (TypeScript, Tailwind, RHF, Zod)
│  └─ app/           # page.tsx includes VIN field + Decode button
├─ orchestrator/     # Express + TS; adapters, normalization, receipts
│  ├─ src/routes/    # /api/appraise, /api/vin/decode
│  ├─ src/adapters/  # demo* adapters + provider stubs
│  ├─ src/vin/       # NHTSA VPIC fallback decoder
│  └─ src/valuation/ # heuristic + aggregate (trimmed mean + confidence)
└─ data/receipts/    # Appraisal receipts (JSON), created at runtime
