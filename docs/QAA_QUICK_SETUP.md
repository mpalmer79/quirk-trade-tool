# Quick Setup: QAA Data Import Feature

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd orchestrator
npm install
```

### 2. Run Database Migration
```bash
psql $DATABASE_URL -f src/db/migrations/002_qaa_auction_data.sql
```

### 3. Restart Your Application
```bash
npm run dev  # or npm start
```

### 4. Test the Feature
1. Log in as an admin user
2. Go to `/admin`
3. Scroll to "Quincy Auto Auction Data Import"
4. Download the sample CSV
5. Upload it to test

## 📁 Files Created/Modified

### New Files
- `orchestrator/src/db/migrations/002_qaa_auction_data.sql` - Database schema
- `orchestrator/src/routes/qaa.ts` - API endpoints
- `orchestrator/src/providers/quincy-auto-provider.ts` - Updated provider (MODIFIED)
- `frontend/components/QaaCsvImport.tsx` - Upload UI component
- `docs/QAA_DATA_IMPORT_GUIDE.md` - Full documentation

### Modified Files
- `orchestrator/src/app.ts` - Added QAA routes
- `orchestrator/package.json` - Added multer & csv-parse
- `frontend/app/admin/page.tsx` - Added import component

## 🎯 CSV Format

```csv
date,vin,sale_price
2024-11-01,1HGCV41JXMN109186,12500
2024-11-01,2HGFG12857H543210,15300
```

**Required columns:** date, vin, sale_price  
**Supported formats:** See full documentation

## 🔑 Key Features

✅ **Automatic VIN Decoding** - Extracts year, make, model, trim  
✅ **Smart Valuation** - Uses real auction data when available  
✅ **Weighted Calculations** - Recent sales weighted more heavily  
✅ **Batch Tracking** - Every import is logged and auditable  
✅ **Error Reporting** - Detailed errors for failed rows  
✅ **Statistics Dashboard** - Real-time data insights  

## 🚨 Important Notes

1. **Admin Only**: Only admin users can import auction data
2. **Heavy Weight**: QAA data has high priority in valuation calculations
3. **VIN Decoding**: Each row requires a VIN decode API call (~1-2 sec/row)
4. **Weekly Updates**: Import fresh data weekly for best results

## 📖 Full Documentation

See `docs/QAA_DATA_IMPORT_GUIDE.md` for:
- Complete setup instructions
- Detailed CSV format specifications
- How valuation weighting works
- Troubleshooting guide
- Best practices

## 🧪 Testing

### Test the Import API
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_auction_data.csv" \
  http://localhost:3001/api/qaa/import
```

### Test the Stats API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/qaa/stats
```

## 🔄 Integration with Valuations

The Quincy Auto Provider now uses a **smart fallback strategy**:

1. **Try exact VIN match** → Highest confidence
2. **Try same make/model/year** → High confidence  
3. **Try similar vehicles** → Medium confidence
4. **Use estimation** → Fallback

This ensures:
- Real data is used when available
- Valuations never fail due to missing data
- Most accurate pricing possible

## 💾 Database Tables

### `qaa_auction_data`
Stores auction sales with decoded VIN information

### `qaa_import_logs`
Tracks every import with success/failure metrics

## 🎉 You're Done!

Your Quirk Trade Tool now has enterprise-grade auction data integration with automatic VIN decoding and intelligent valuation weighting.

**Next Steps:**
1. Import your first CSV file
2. Run a valuation on a vehicle with auction data
3. Compare results with and without auction data
4. Set up weekly import schedule
