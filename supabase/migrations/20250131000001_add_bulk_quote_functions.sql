-- Migration: Add bulk quote caching functions for portfolio stock quotes
-- This enables efficient hourly updates using Alpha Vantage's bulk quote API

-- ============================================================================
-- FUNCTION: Get all active portfolio symbols
-- Returns array of unique symbols from all user portfolios
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_active_portfolio_symbols()
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT UPPER(symbol)
    FROM public.portfolio_holdings 
    WHERE shares > 0
    ORDER BY UPPER(symbol)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_active_portfolio_symbols IS 
  'Returns array of unique stock symbols from all active portfolio holdings';

-- ============================================================================
-- FUNCTION: Bulk upsert stock quotes
-- Efficiently updates multiple stock quotes in a single transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION public.bulk_upsert_stock_quotes(quotes JSONB)
RETURNS TABLE(
  inserted_count INTEGER,
  updated_count INTEGER,
  total_count INTEGER
) AS $$
DECLARE
  quote JSONB;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_total INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Loop through each quote in the JSONB array
  FOR quote IN SELECT * FROM jsonb_array_elements(quotes)
  LOOP
    -- Check if symbol already exists
    SELECT EXISTS(
      SELECT 1 FROM public.stock_quotes 
      WHERE symbol = UPPER((quote->>'symbol')::TEXT)
    ) INTO v_exists;
    
    -- Insert or update the quote
    INSERT INTO public.stock_quotes (
      symbol, 
      price, 
      open, 
      high, 
      low, 
      volume,
      latest_trading_day, 
      previous_close, 
      change, 
      change_percent,
      last_updated
    )
    VALUES (
      UPPER((quote->>'symbol')::TEXT),
      NULLIF(quote->>'price', '')::NUMERIC,
      NULLIF(quote->>'open', '')::NUMERIC,
      NULLIF(quote->>'high', '')::NUMERIC,
      NULLIF(quote->>'low', '')::NUMERIC,
      NULLIF(quote->>'volume', '')::BIGINT,
      NULLIF(quote->>'latest_trading_day', '')::DATE,
      NULLIF(quote->>'previous_close', '')::NUMERIC,
      NULLIF(quote->>'change', '')::NUMERIC,
      NULLIF(quote->>'change_percent', '')::VARCHAR,
      NOW()
    )
    ON CONFLICT (symbol) DO UPDATE SET
      price = EXCLUDED.price,
      open = EXCLUDED.open,
      high = EXCLUDED.high,
      low = EXCLUDED.low,
      volume = EXCLUDED.volume,
      latest_trading_day = EXCLUDED.latest_trading_day,
      previous_close = EXCLUDED.previous_close,
      change = EXCLUDED.change,
      change_percent = EXCLUDED.change_percent,
      last_updated = NOW();
    
    v_total := v_total + 1;
    
    IF v_exists THEN
      v_updated := v_updated + 1;
    ELSE
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;
  
  -- Return statistics
  RETURN QUERY SELECT v_inserted, v_updated, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.bulk_upsert_stock_quotes IS 
  'Bulk insert/update stock quotes from Alpha Vantage bulk API response';

-- ============================================================================
-- FUNCTION: Get stale quote symbols
-- Returns symbols that need to be refreshed based on age
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_stale_quote_symbols(age_minutes INTEGER DEFAULT 60)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT symbol 
    FROM public.stock_quotes 
    WHERE last_updated < (NOW() - (age_minutes || ' minutes')::INTERVAL)
    ORDER BY symbol
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_stale_quote_symbols IS 
  'Returns array of symbols with quotes older than specified minutes (default: 60)';

-- ============================================================================
-- FUNCTION: Get quote cache statistics
-- Returns useful stats about the quote cache
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_quote_cache_stats()
RETURNS TABLE(
  total_symbols INTEGER,
  fresh_quotes INTEGER,
  stale_quotes INTEGER,
  oldest_quote TIMESTAMPTZ,
  newest_quote TIMESTAMPTZ,
  avg_age_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_symbols,
    COUNT(CASE WHEN last_updated > NOW() - INTERVAL '1 hour' THEN 1 END)::INTEGER as fresh_quotes,
    COUNT(CASE WHEN last_updated <= NOW() - INTERVAL '1 hour' THEN 1 END)::INTEGER as stale_quotes,
    MIN(last_updated) as oldest_quote,
    MAX(last_updated) as newest_quote,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - last_updated))/60), 2) as avg_age_minutes
  FROM public.stock_quotes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_quote_cache_stats IS 
  'Returns statistics about the stock quote cache freshness';

-- ============================================================================
-- TABLE: Quote refresh log
-- Tracks each bulk refresh operation for monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quote_refresh_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  symbols_requested INTEGER NOT NULL DEFAULT 0,
  symbols_processed INTEGER NOT NULL DEFAULT 0,
  api_calls_made INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_refresh_log_started_at ON public.quote_refresh_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_refresh_log_status ON public.quote_refresh_log(status);

COMMENT ON TABLE public.quote_refresh_log IS 
  'Audit log for bulk stock quote refresh operations';

-- ============================================================================
-- FUNCTION: Start refresh log entry
-- Creates a new log entry when refresh starts
-- ============================================================================
CREATE OR REPLACE FUNCTION public.start_quote_refresh_log(p_symbols_count INTEGER)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.quote_refresh_log (
    started_at,
    symbols_requested,
    status
  )
  VALUES (
    NOW(),
    p_symbols_count,
    'running'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Complete refresh log entry
-- Updates log entry when refresh completes or fails
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_quote_refresh_log(
  p_log_id UUID,
  p_status VARCHAR,
  p_symbols_processed INTEGER,
  p_api_calls_made INTEGER,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.quote_refresh_log
  SET 
    completed_at = NOW(),
    status = p_status,
    symbols_processed = p_symbols_processed,
    api_calls_made = p_api_calls_made,
    error_message = p_error_message,
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
  WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_active_portfolio_symbols TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_upsert_stock_quotes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stale_quote_symbols TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quote_cache_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_quote_refresh_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_quote_refresh_log TO authenticated;

-- Grant service role full access to refresh log
GRANT ALL ON public.quote_refresh_log TO service_role;
GRANT SELECT ON public.quote_refresh_log TO authenticated;

-- ============================================================================
-- Enable RLS on quote_refresh_log
-- ============================================================================
ALTER TABLE public.quote_refresh_log ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read the log
CREATE POLICY "Allow authenticated users to read refresh log"
  ON public.quote_refresh_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage refresh log"
  ON public.quote_refresh_log
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.quote_refresh_log IS 
  'Audit log for tracking bulk stock quote refresh operations - useful for monitoring and debugging';


