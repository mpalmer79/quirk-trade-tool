# Quirk Trade Tool

Multi-source vehicle valuation **demo** for Quirk Auto Dealers. Frontend (Next.js) + Orchestrator (Express). Uses simulated adapters for Black Book, KBB, NADA, and Manheim and computes a trimmed-mean range with a confidence indicator. Stores an immutable “Appraisal Receipt” JSON for auditability.

> **Legal note**: This demo does not call licensed providers. Do not imply live aggregation until you wire actual APIs under license.

## Quick start

Requirements: Node 20+, pnpm

```bash
pnpm install
cp .env.example .env
pnpm dev    # runs frontend:3000 and orchestrator:4000
