## Environment Setup

### Local Development

Copy example files:
```bash
cp orchestrator/.env.example orchestrator/.env
cp frontend/.env.example frontend/.env.local
```

Edit if needed for your local setup (usually not required).

The app validates all environment variables on startup. 
If any variable is invalid, you'll see a clear error message.
```

**But this is optional.** The main thing is you have the code + `.env.example` files in place.

---

## ✅ Final Repo State Should Have
```
orchestrator/
├── src/
│   ├── config/
│   │   └── env.ts              ✅ NEW
│   ├── server.ts               ✅ UPDATED
│   ├── util/
│   │   └── receipts.ts         ✅ UPDATED
│   └── ...
├── .env.example                ✅ NEW
└── .env                         ✅ NEW (local only)

frontend/
├── .env.example                ✅ NEW
├── .env.local                  ✅ NEW (local only)
└── ...
