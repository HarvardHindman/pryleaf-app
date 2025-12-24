-- =====================================================
-- API USAGE TRACKING SYSTEM
-- =====================================================
-- Migration: 20250129000001_create_api_usage_tracking.sql
-- Description: Create table and function for Alpha Vantage API rate limiting
-- Tracks daily API usage to stay within the 25 requests/day limit
-- =====================================================

-- =====================================================
-- 1. API USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  requests_used INTEGER DEFAULT 0 NOT NULL,
  requests_limit INTEGER DEFAULT 25 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient date lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON public.api_usage_tracking(date DESC);

-- =====================================================
-- 2. API USAGE TRACKING FUNCTION
-- =====================================================

-- Function: increment_api_usage()
-- Purpose: Safely increment the API usage counter for today
-- Returns: true if request allowed (under limit), false if limit reached
-- Uses UPSERT to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.increment_api_usage()
RETURNS BOOLEAN AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Insert or update today's usage record
  INSERT INTO public.api_usage_tracking (date, requests_used, requests_limit, created_at, updated_at)
  VALUES (v_today, 0, 25, NOW(), NOW())
  ON CONFLICT (date) 
  DO UPDATE SET updated_at = NOW()
  RETURNING requests_used, requests_limit INTO v_current_usage, v_limit;
  
  -- Check if we're under the limit
  IF v_current_usage < v_limit THEN
    -- Increment the counter
    UPDATE public.api_usage_tracking
    SET requests_used = requests_used + 1,
        updated_at = NOW()
    WHERE date = v_today;
    
    RETURN true;
  ELSE
    -- Limit reached
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function: get_today_api_usage()
-- Purpose: Get current usage stats for today
-- Returns: JSON with usage details
CREATE OR REPLACE FUNCTION public.get_today_api_usage()
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  result JSON;
BEGIN
  SELECT json_build_object(
    'date', date,
    'requests_used', requests_used,
    'requests_remaining', (requests_limit - requests_used),
    'requests_limit', requests_limit,
    'percentage_used', ROUND((requests_used::NUMERIC / requests_limit::NUMERIC * 100), 2),
    'updated_at', updated_at
  )
  INTO result
  FROM public.api_usage_tracking
  WHERE date = v_today;
  
  -- If no record exists for today, return default values
  IF result IS NULL THEN
    result := json_build_object(
      'date', v_today,
      'requests_used', 0,
      'requests_remaining', 25,
      'requests_limit', 25,
      'percentage_used', 0,
      'updated_at', NOW()
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: reset_api_usage()
-- Purpose: Reset usage counter (for testing or manual resets)
-- Returns: void
CREATE OR REPLACE FUNCTION public.reset_api_usage(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  UPDATE public.api_usage_tracking
  SET requests_used = 0,
      updated_at = NOW()
  WHERE date = p_date;
  
  IF NOT FOUND THEN
    INSERT INTO public.api_usage_tracking (date, requests_used, requests_limit, created_at, updated_at)
    VALUES (p_date, 0, 25, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: clean_old_api_usage_records()
-- Purpose: Remove old tracking records (keep last 90 days)
-- Returns: Number of records deleted
CREATE OR REPLACE FUNCTION public.clean_old_api_usage_records(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_usage_tracking
  WHERE date < CURRENT_DATE - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read usage stats
CREATE POLICY "Authenticated users can read API usage"
  ON public.api_usage_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage API usage records
CREATE POLICY "Service role can manage API usage"
  ON public.api_usage_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.increment_api_usage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_today_api_usage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reset_api_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_api_usage_records TO service_role;

-- Grant table permissions
GRANT SELECT ON public.api_usage_tracking TO authenticated, anon;
GRANT ALL ON public.api_usage_tracking TO service_role;

-- =====================================================
-- 6. INITIALIZE TODAY'S RECORD
-- =====================================================

-- Create today's record if it doesn't exist
INSERT INTO public.api_usage_tracking (date, requests_used, requests_limit, created_at, updated_at)
VALUES (CURRENT_DATE, 0, 25, NOW(), NOW())
ON CONFLICT (date) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ API Usage Tracking system created successfully';
  RAISE NOTICE '📊 Table: api_usage_tracking';
  RAISE NOTICE '🔧 Functions: increment_api_usage, get_today_api_usage, reset_api_usage, clean_old_api_usage_records';
  RAISE NOTICE '🔐 RLS policies enabled for security';
  RAISE NOTICE '📈 Daily limit: 25 requests (configurable)';
END $$;

