-- =====================================================
-- NEWS REFRESH CRON JOB
-- =====================================================
-- Migration: 20250132000002_create_news_cron_job.sql
-- Description: Set up hourly cron job for news refresh
-- Requires: pg_cron extension
-- =====================================================

-- =====================================================
-- 1. ENABLE PG_CRON EXTENSION (if not already enabled)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 2. CREATE NEWS REFRESH CRON JOB
-- =====================================================

-- Schedule: Every hour at :00 (1:00, 2:00, 3:00, etc.)
-- This will call your Edge Function or API endpoint

-- Option A: Using Supabase Edge Function (Recommended)
-- Note: Replace YOUR_PROJECT_URL and YOUR_CRON_SECRET with actual values

DO $$
DECLARE
  v_job_id INTEGER;
  v_project_url TEXT := 'https://mjxtzwekczanotbgxjuz.supabase.co'; -- Your Supabase URL
  v_cron_secret TEXT := 'YOUR_CRON_SECRET'; -- Set this in your .env
BEGIN
  -- Remove existing job if it exists
  SELECT jobid INTO v_job_id 
  FROM cron.job 
  WHERE jobname = 'refresh-news-hourly';
  
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
    RAISE NOTICE 'Removed existing news refresh job (ID: %)', v_job_id;
  END IF;

  -- Create new hourly job
  -- This calls the Next.js API endpoint to refresh news
  v_job_id := cron.schedule(
    'refresh-news-hourly',
    '0 * * * *', -- Every hour at :00
    $$
    SELECT 
      net.http_post(
        url:='https://YOUR_DOMAIN.com/api/news/refresh',
        headers:='{"x-api-key": "YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
        body:='{"topics": ["technology", "earnings", "financial_markets", "economy_fiscal"]}'::jsonb
      ) as request_id;
    $$
  );
  
  RAISE NOTICE '✅ News refresh cron job created (ID: %)', v_job_id;
  RAISE NOTICE '⏰ Schedule: Every hour at :00';
  RAISE NOTICE '📍 Endpoint: https://YOUR_DOMAIN.com/api/news/refresh';
  RAISE NOTICE '⚠️  IMPORTANT: Update YOUR_DOMAIN and YOUR_CRON_SECRET in the job definition!';
END $$;

-- =====================================================
-- 3. ALTERNATIVE: DATABASE-SIDE REFRESH FUNCTION
-- =====================================================
-- If you prefer to handle refresh entirely in the database
-- (Not recommended - better to use API endpoint)

CREATE OR REPLACE FUNCTION public.cron_refresh_news()
RETURNS void AS $$
DECLARE
  v_log_entry JSONB;
BEGIN
  -- Log the cron execution
  INSERT INTO public.news_refresh_log (
    started_at,
    status
  ) VALUES (
    NOW(),
    'running'
  )
  RETURNING row_to_json(news_refresh_log.*) INTO v_log_entry;
  
  RAISE NOTICE '🔄 News refresh triggered by cron at %', NOW();
  RAISE NOTICE '📝 Log entry: %', v_log_entry;
  
  -- Note: The actual API call should happen via the HTTP function above
  -- This is just a placeholder to log cron executions
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. HELPER FUNCTIONS TO MANAGE CRON JOBS
-- =====================================================

-- View all cron jobs
CREATE OR REPLACE FUNCTION public.list_news_cron_jobs()
RETURNS TABLE (
  jobid INTEGER,
  schedule TEXT,
  command TEXT,
  nodename TEXT,
  nodeport INTEGER,
  database TEXT,
  username TEXT,
  active BOOLEAN,
  jobname TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cron.job
  WHERE jobname LIKE '%news%';
END;
$$ LANGUAGE plpgsql;

-- View recent cron job runs
CREATE OR REPLACE FUNCTION public.view_news_cron_history(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  runid BIGINT,
  jobid INTEGER,
  job_name TEXT,
  status TEXT,
  return_message TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.runid,
    r.jobid,
    j.jobname,
    r.status,
    r.return_message,
    r.start_time,
    r.end_time,
    (r.end_time - r.start_time) as duration
  FROM cron.job_run_details r
  JOIN cron.job j ON r.jobid = j.jobid
  WHERE j.jobname LIKE '%news%'
  ORDER BY r.start_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.cron_refresh_news TO service_role;
GRANT EXECUTE ON FUNCTION public.list_news_cron_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION public.view_news_cron_history TO authenticated;

-- =====================================================
-- 6. USAGE INSTRUCTIONS
-- =====================================================

-- View all news cron jobs:
-- SELECT * FROM public.list_news_cron_jobs();

-- View recent cron runs:
-- SELECT * FROM public.view_news_cron_history(10);

-- Manually trigger refresh (for testing):
-- SELECT public.cron_refresh_news();

-- Check cron job status:
-- SELECT * FROM cron.job WHERE jobname = 'refresh-news-hourly';

-- View all cron job runs:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-news-hourly') ORDER BY start_time DESC LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ News refresh cron job setup complete';
  RAISE NOTICE '⏰ Schedule: Every hour at :00';
  RAISE NOTICE '📋 Use public.list_news_cron_jobs() to view jobs';
  RAISE NOTICE '📊 Use public.view_news_cron_history() to view history';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ACTION REQUIRED:';
  RAISE NOTICE '1. Update the cron job SQL with your actual domain URL';
  RAISE NOTICE '2. Set CRON_SECRET environment variable';
  RAISE NOTICE '3. Test manually: SELECT public.cron_refresh_news();';
END $$;

