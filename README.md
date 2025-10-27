# Quirk Trade Tool

Multi-source vehicle valuation **demo** for Quirk Auto Dealers. Frontend (Next.js) + Orchestrator (Express). Uses simulated adapters for Black Book, KBB, NADA, and Manheim and computes a trimmed-mean range with a confidence indicator. Stores an immutable “Appraisal Receipt” JSON for auditability.

> **Legal note**: This demo does not call licensed providers. Do not imply live aggregation until you wire actual APIs under license.

## Quick start

Requirements: Node 20+, pnpm

```bash
pnpm install
cp .env.example .env
pnpm dev    # runs frontend:3000 and orchestrator:4000

## VIN Decode

POST `http://localhost:4000/api/vin/decode`
```json
{ "vin": "1G1ZT62812F113456" }
Response (NHTSA fallback):
{
  "vin":"1G1ZT62812F113456",
  "year": 2002,
  "make":"Chevrolet",
  "model":"Malibu",
  "trim":"LS",
  "bodyClass":"Sedan/Saloon",
  "engine":{"cylinders":"6","displacementL":"3.1"},
  "driveType":"FWD",
  "fuelTypePrimary":"Gasoline"
}
Frontend adds a VIN field and a Decode button to prefill year/make/model/trim.

---

# ✅ What you get now

- `/api/vin/decode` route using **NHTSA VPIC** (public fallback).
- Frontend VIN field + **Decode** button that autofills Year/Make/Model/Trim.
- Clean **provider stubs** for Black Book/KBB/NADA/Manheim so you can drop in licensed calls later without refactoring.
- No changes to your existing appraisal math and receipt pipeline.

If you want, I can also add:
- A **commercial VIN decoder adapter stub** (e.g., DataOne/ChromeData) to the same pipeline.
- A **PDF appraisal receipt generator** (customer-facing) with your Quirk branding.

