-- =====================================================
-- STOCK CACHE FUNCTIONS
-- =====================================================
-- Migration: 20250206000001_create_stock_cache_functions.sql
-- Description: Create missing cache functions for stock data
-- =====================================================

-- =====================================================
-- 1. CREATE STOCK_CACHE TABLE
-- =====================================================
DROP TABLE IF EXISTS public.stock_cache;
CREATE TABLE IF NOT EXISTS public.stock_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(symbol, data_type)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stock_cache_symbol_type ON public.stock_cache(symbol, data_type);
CREATE INDEX IF NOT EXISTS idx_stock_cache_expires ON public.stock_cache(expires_at);

-- =====================================================
-- 2. GET CACHED STOCK DATA FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_cached_stock_data(
  p_symbol TEXT,
  p_data_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT data, expires_at
  INTO v_data, v_expires_at
  FROM public.stock_cache
  WHERE symbol = UPPER(p_symbol)
    AND data_type = p_data_type
  LIMIT 1;

  -- If no data found or expired, return null
  IF v_data IS NULL OR (v_expires_at IS NOT NULL AND v_expires_at < NOW()) THEN
    RETURN NULL;
  END IF;

  RETURN v_data;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. SET CACHED STOCK DATA FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_cached_stock_data(
  p_symbol TEXT,
  p_data_type TEXT,
  p_data JSONB,
  p_cache_duration_minutes INTEGER DEFAULT 15
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.stock_cache (
    symbol,
    data_type,
    data,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    UPPER(p_symbol),
    p_data_type,
    p_data,
    NOW() + (p_cache_duration_minutes || ' minutes')::INTERVAL,
    NOW(),
    NOW()
  )
  ON CONFLICT (symbol, data_type)
  DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CLEAN EXPIRED STOCK CACHE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.clean_expired_stock_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.stock_cache
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read cache
CREATE POLICY "Allow authenticated users to read cache"
  ON public.stock_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update cache
CREATE POLICY "Allow authenticated users to write cache"
  ON public.stock_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cache"
  ON public.stock_cache
  FOR UPDATE
  TO authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON public.stock_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_cached_stock_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_cached_stock_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.clean_expired_stock_cache TO service_role;

GRANT SELECT ON public.stock_cache TO authenticated, anon;
GRANT INSERT, UPDATE ON public.stock_cache TO authenticated, anon;
GRANT ALL ON public.stock_cache TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Stock cache functions created successfully';
  RAISE NOTICE '📊 Table: stock_cache';
  RAISE NOTICE '🔧 Functions: get_cached_stock_data, set_cached_stock_data, clean_expired_stock_cache';
END $$;

