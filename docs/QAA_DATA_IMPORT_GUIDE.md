# Quincy Auto Auction (QAA) Data Import

## Overview

The QAA Data Import feature allows administrators to upload weekly auction data from Quincy Auto Auction. This data provides real wholesale values that heavily influence the trade valuation calculations.

## 🎯 Why This Matters

Quincy Auto Auction data will have **heavy weight** in the final valuation calculation. Real auction data provides:
- **Actual market prices** instead of estimates
- **Local market insights** specific to your region
- **Recent transaction data** that reflects current market conditions
- **VIN-specific pricing** for exact vehicle matches

## 📋 Setup Instructions

### 1. Database Migration

Run the database migration to create the necessary tables:

```bash
cd orchestrator
# Apply the migration
psql $DATABASE_URL -f src/db/migrations/002_qaa_auction_data.sql
```

### 2. Install Dependencies

Install the required npm packages:

```bash
cd orchestrator
npm install multer csv-parse uuid
npm install --save-dev @types/multer
```

### 3. Environment Variables

No additional environment variables are needed. The feature uses your existing database connection.

### 4. Verify API Route

The QAA API routes are automatically registered at:
- `POST /api/qaa/import` - Import CSV data
- `GET /api/qaa/stats` - View statistics
- `GET /api/qaa/history` - View import history

## 📄 CSV Format

### Required Columns

Your CSV file must have exactly three columns (in any order):

1. **date** - The auction sale date
2. **vin** - The Vehicle Identification Number
3. **sale_price** - The sale price in dollars

### Supported Date Formats

- `YYYY-MM-DD` (e.g., 2024-11-01)
- `MM/DD/YYYY` (e.g., 11/01/2024)
- `M/D/YYYY` (e.g., 11/1/2024)

### Supported Price Formats

- Plain numbers: `12500`
- With dollar sign: `$12500`
- With commas: `12,500`
- With both: `$12,500`
- With decimals: `12500.00`

### Example CSV

```csv
date,vin,sale_price
2024-11-01,1HGCV41JXMN109186,12500
2024-11-01,2HGFG12857H543210,$15,300
11/02/2024,3VWFE21C04M000001,9800
```

### Alternative Column Names

The system recognizes various column name formats:
- Date: `date`, `Date`, `DATE`, `sale_date`, `Sale_Date`
- VIN: `vin`, `VIN`, `Vin`
- Price: `sale_price`, `Sale_Price`, `price`, `Price`

## 🚀 How to Import Data

### Using the Admin Interface

1. **Log in as an administrator**
   - Only users with the `admin` role can import auction data

2. **Navigate to the Admin Dashboard**
   - Go to `/admin` in your application

3. **Find the "Quincy Auto Auction Data Import" section**
   - This appears below the Quick Actions cards

4. **Download the sample CSV** (optional)
   - Click "Download Sample CSV" to get a template

5. **Upload your CSV file**
   - Click the upload area or drag and drop your CSV file
   - The file must have a `.csv` extension

6. **Click "Import Auction Data"**
   - The system will process each row
   - VINs are automatically decoded to extract vehicle details
   - Progress is shown during the import

7. **Review the results**
   - Success count and failure count are displayed
   - Any errors are shown with row numbers and reasons
   - Statistics are automatically updated

### Using the API Directly

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@auction_data.csv" \
  https://your-domain.com/api/qaa/import
```

## 🔍 How It Works

### Import Process

1. **File Upload**: CSV file is received by the server
2. **Parsing**: CSV is parsed into rows
3. **Validation**: Each row is validated for required fields
4. **VIN Decoding**: Each VIN is decoded to get year, make, model, trim
5. **Database Storage**: Valid records are inserted into the database
6. **Batch Tracking**: Import is logged with success/failure counts

### VIN Decoding

The system automatically decodes VINs using:
1. **Auto.dev API** (if API key is configured) - Commercial decoder
2. **NHTSA API** (fallback) - Free government database

Decoded information includes:
- Year
- Make
- Model
- Trim
- Body style
- Engine details

### Data Storage

Data is stored in the `qaa_auction_data` table with:
- Sale date
- Sale price (stored in cents for precision)
- VIN
- Decoded vehicle information
- Import batch ID for tracking

## 💡 How QAA Data Affects Valuations

When a valuation is requested, the Quincy Auto Provider now:

### Priority 1: Exact VIN Match
- Searches for exact VIN matches in auction data
- Uses last 5 sales, with recent sales weighted more heavily
- **Highest confidence level**

### Priority 2: Same Make/Model/Year
- Searches for same make, model, and year
- Uses last 20 sales from the past year
- Requires at least 3 data points
- **High confidence level**

### Priority 3: Similar Vehicles
- Searches for same make/model within ±2 years
- Uses last 30 sales from the past 18 months
- Adjusts for year difference (10% depreciation per year)
- Requires at least 5 data points
- **Medium confidence level**

### Fallback: Estimation
- If insufficient auction data, uses the original estimation algorithm
- Ensures valuations are always available

### Weighting Strategy

Recent sales are weighted more heavily using exponential decay:
- **Exact VIN**: Slow decay (365-day half-life)
- **Exact Match**: Moderate decay (180-day half-life)  
- **Similar**: Fast decay (120-day half-life)

## 📊 Statistics Dashboard

The admin interface shows real-time statistics:
- **Total Records**: Total auction records in database
- **Unique Vehicles**: Number of unique VINs
- **Avg Sale Price**: Average auction sale price
- **Total Imports**: Number of CSV imports performed
- **Last Import**: Date of most recent import

## 🔒 Security & Permissions

### Access Control
- Only users with `admin` role can import data
- All imports are logged with user ID
- Audit trail is maintained for compliance

### File Validation
- Only CSV files are accepted
- 10MB file size limit
- Malformed files are rejected with clear error messages

### Data Validation
- VIN format is validated (11-17 characters)
- Dates must be valid
- Prices must be positive numbers
- Invalid rows are skipped with detailed error messages

## 🐛 Troubleshooting

### "VIN decode failed"
- **Cause**: VIN could not be decoded by NHTSA or Auto.dev
- **Solution**: Verify VIN is correct. Some older vehicles may not be in databases.

### "Invalid date format"
- **Cause**: Date doesn't match supported formats
- **Solution**: Use YYYY-MM-DD or MM/DD/YYYY format

### "Missing required fields"
- **Cause**: CSV doesn't have date, vin, or sale_price columns
- **Solution**: Ensure CSV has all three required columns with correct names

### "Insufficient data for valuation"
- **Cause**: Not enough auction records for the vehicle
- **Solution**: Import more weekly data. System will fall back to estimation.

### "Only administrators can import"
- **Cause**: User doesn't have admin role
- **Solution**: Ensure your user account has role set to 'admin' in the database

## 📈 Best Practices

### Weekly Updates
- Import new auction data weekly
- Consistent updates ensure current market pricing
- Older data is automatically weighted less

### Data Quality
- Verify VINs are correct before uploading
- Check for duplicate entries
- Review error reports after each import

### Monitoring
- Check statistics regularly
- Ensure data coverage for your primary makes/models
- Monitor the average sale prices for market trends

### Performance
- Large files (1000+ rows) may take several minutes
- VIN decoding adds ~1-2 seconds per row
- Consider splitting very large files into smaller batches

## 🔄 Data Lifecycle

### Import Tracking
- Each import gets a unique batch ID
- All records from one CSV share the same batch ID
- Import logs track success/failure counts

### Data Retention
- No automatic deletion
- Older data is weighted less in calculations
- Consider periodic cleanup of very old data (>3 years)

### Updates vs. New Records
- System allows duplicate VINs with different dates
- Each auction sale is a separate record
- Multiple sales of the same vehicle show price trends

## 🎓 Example Workflow

### Step 1: Receive Weekly Data
```
Quincy Auto Auction sends weekly_sales_2024-11-01.csv
```

### Step 2: Verify Format
```csv
date,vin,sale_price
2024-11-01,1HGCV41JXMN109186,12500
2024-11-01,2HGFG12857H543210,15300
```

### Step 3: Import via Admin Interface
- Log in as admin
- Upload the CSV file
- Wait for processing

### Step 4: Review Results
- 45 successful imports
- 2 failed (invalid VINs)
- Update statistics

### Step 5: Test Valuations
- Run a valuation for a vehicle with auction data
- Verify it uses QAA data (check logs)
- Compare with previous estimates

## 📞 Support

If you encounter issues:
1. Check the import error messages for specific row failures
2. Verify your CSV format matches the examples
3. Ensure VINs are valid and properly formatted
4. Check database logs for detailed error information
5. Review the audit logs for import history

## 🚀 Future Enhancements

Potential improvements:
- Scheduled automatic imports
- Email notifications on import completion
- Advanced filtering by date range, make, model
- Export functionality for reporting
- API integration directly with QAA (when available)
- Bulk delete/update operations
- Data visualization and trends
