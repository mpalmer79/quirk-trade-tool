-- Quincy Auto Auction Data Table
-- Version: 1.0
-- Date: 2024-11-05
-- Purpose: Store historical auction wholesale values from Quincy Auto Auction

-- ============================================================================
-- QUINCY AUTO AUCTION DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS qaa_auction_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auction details
  sale_date DATE NOT NULL,
  sale_price INTEGER NOT NULL, -- Store in cents to avoid floating point issues
  
  -- VIN and decoded vehicle information
  vin VARCHAR(17) NOT NULL,
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  
  -- Metadata
  import_batch_id UUID, -- Track which CSV import this came from
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- Primary lookup: Find auction data by VIN
CREATE INDEX idx_qaa_vin ON qaa_auction_data(vin);

-- Lookup by vehicle make/model/year for similar vehicle matching
CREATE INDEX idx_qaa_vehicle ON qaa_auction_data(year, make, model);

-- Lookup by sale date for recent data weighting
CREATE INDEX idx_qaa_sale_date ON qaa_auction_data(sale_date DESC);

-- Composite index for efficient valuation queries
CREATE INDEX idx_qaa_valuation_lookup ON qaa_auction_data(make, model, year, sale_date DESC);

-- Import batch tracking
CREATE INDEX idx_qaa_import_batch ON qaa_auction_data(import_batch_id);

-- ============================================================================
-- IMPORT AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS qaa_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL,
  
  -- Import metadata
  filename VARCHAR(255),
  total_rows INTEGER NOT NULL,
  successful_rows INTEGER NOT NULL,
  failed_rows INTEGER NOT NULL,
  
  -- Error tracking
  errors JSONB, -- Array of error objects with row numbers and messages
  
  -- User who performed import
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qaa_import_logs_batch ON qaa_import_logs(batch_id);
CREATE INDEX idx_qaa_import_logs_created ON qaa_import_logs(created_at DESC);
