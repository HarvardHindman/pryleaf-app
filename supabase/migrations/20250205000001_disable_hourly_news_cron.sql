-- =====================================================
-- DISABLE HOURLY NEWS CRON JOB
-- =====================================================
-- Migration: 20250205000001_disable_hourly_news_cron.sql
-- Description: Disable the hourly news refresh cron that was consuming 24 API calls/day
-- Reason: Alpha Vantage has 25 requests/day limit, hourly refresh leaves no room for user requests
-- =====================================================

DO $$
DECLARE
  v_job_id INTEGER;
BEGIN
  -- Find and remove the hourly news refresh job
  SELECT jobid INTO v_job_id 
  FROM cron.job 
  WHERE jobname = 'refresh-news-hourly';
  
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
    RAISE NOTICE '✅ Disabled hourly news refresh cron job (ID: %)', v_job_id;
    RAISE NOTICE '📊 This frees up ~24 API calls per day';
  ELSE
    RAISE NOTICE 'ℹ️  No hourly news refresh job found (already disabled)';
  END IF;

  -- Optionally: Create a new job that runs twice daily instead (morning & afternoon)
  -- Uncomment the following to enable a more conservative schedule:
  
  /*
  v_job_id := cron.schedule(
    'refresh-news-twice-daily',
    '0 9,17 * * *', -- Run at 9 AM and 5 PM daily (2 API calls/day)
    $$
    SELECT 
      net.http_post(
        url:='https://YOUR_DOMAIN.com/api/news/refresh',
        headers:='{"x-api-key": "YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
        body:='{"topics": ["technology", "earnings", "financial_markets"]}'::jsonb
      ) as request_id;
    $$
  );
  
  RAISE NOTICE '✅ Created twice-daily news refresh job (ID: %)', v_job_id;
  RAISE NOTICE '⏰ Schedule: 9 AM and 5 PM daily (2 API calls/day)';
  */

END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Summary:';
  RAISE NOTICE '   • Disabled hourly news cron (saved 24 API calls/day)';
  RAISE NOTICE '   • To enable twice-daily refresh: edit this migration and uncomment the schedule';
  RAISE NOTICE '   • Manual refresh available via: POST /api/news/refresh';
  RAISE NOTICE '';
END $$;

