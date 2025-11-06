-- Migration: Create valuation_history table for historical market trends
-- Purpose: Store historical valuation data to track market trends over time

-- Create valuation_history table
CREATE TABLE IF NOT EXISTS valuation_history (
  id SERIAL PRIMARY KEY,
  valuation_id VARCHAR(50) UNIQUE NOT NULL,
  vin VARCHAR(17),
  year INT NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  mileage INT NOT NULL,
  condition_rating INT CHECK (condition_rating BETWEEN 1 AND 5),
  base_wholesale_value DECIMAL(10,2) NOT NULL,
  final_wholesale_value DECIMAL(10,2) NOT NULL,
  dealership_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  zip_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vh_vin ON valuation_history(vin);
CREATE INDEX IF NOT EXISTS idx_vh_vin_created ON valuation_history(vin, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vh_make_model ON valuation_history(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vh_dealership ON valuation_history(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vh_created_at ON valuation_history(created_at DESC);

-- Create market_trends table for aggregated statistics
CREATE TABLE IF NOT EXISTS market_trends (
  id SERIAL PRIMARY KEY,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  trim VARCHAR(100),
  time_period DATE NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Aggregated statistics
  sample_count INT NOT NULL DEFAULT 0,
  avg_value DECIMAL(10,2) NOT NULL,
  min_value DECIMAL(10,2) NOT NULL,
  max_value DECIMAL(10,2) NOT NULL,
  median_value DECIMAL(10,2),
  std_deviation DECIMAL(10,2),
  
  -- Trend indicators
  trend_direction VARCHAR(10) CHECK (trend_direction IN ('rising', 'falling', 'stable')),
  trend_percentage DECIMAL(5,2),
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (make, model, year, trim, time_period, period_type)
);

-- Create indexes for market_trends
CREATE INDEX IF NOT EXISTS idx_mt_vehicle ON market_trends(make, model, year);
CREATE INDEX IF NOT EXISTS idx_mt_period ON market_trends(time_period, period_type);
CREATE INDEX IF NOT EXISTS idx_mt_updated ON market_trends(updated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE valuation_history IS 'Stores individual valuation records for historical tracking and trend analysis';
COMMENT ON TABLE market_trends IS 'Aggregated market statistics and trends for vehicle models';
COMMENT ON COLUMN valuation_history.valuation_id IS 'Unique identifier from valuation service';
COMMENT ON COLUMN market_trends.trend_direction IS 'Market trend direction: rising, falling, or stable';
COMMENT ON COLUMN market_trends.trend_percentage IS 'Percentage change from previous period';
