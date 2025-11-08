-- Create stock_quotes table for caching realtime quote data
CREATE TABLE IF NOT EXISTS public.stock_quotes (
  symbol VARCHAR(20) PRIMARY KEY,
  price DECIMAL(20, 4) NOT NULL,
  open DECIMAL(20, 4),
  high DECIMAL(20, 4),
  low DECIMAL(20, 4),
  volume BIGINT,
  latest_trading_day DATE,
  previous_close DECIMAL(20, 4),
  change DECIMAL(20, 4),
  change_percent VARCHAR(20),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on last_updated for efficient cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_stock_quotes_last_updated ON public.stock_quotes(last_updated);

-- Enable RLS
ALTER TABLE public.stock_quotes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read quotes (public data)
CREATE POLICY "Allow all users to read stock quotes"
  ON public.stock_quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update quotes (API will do this on behalf of users)
CREATE POLICY "Allow authenticated users to insert stock quotes"
  ON public.stock_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update stock quotes"
  ON public.stock_quotes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.stock_quotes IS 'Cached stock quote data from Alpha Vantage with 10-minute TTL';

