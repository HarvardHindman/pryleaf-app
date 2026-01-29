-- Migration: Remove Alpha Vantage cache system
-- Date: 2026-01-29
-- Description: Drops all Alpha Vantage related tables, functions, and cron jobs
-- as part of migration to Massive API with simplified caching

-- ============================================================================
-- Remove Cron Jobs
-- ============================================================================

-- Unschedule any Alpha Vantage related cron jobs
DO $$
BEGIN
    -- Try to unschedule quote refresh cron job (may not exist)
    BEGIN
        PERFORM cron.unschedule('refresh-portfolio-quotes-hourly');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Cron job refresh-portfolio-quotes-hourly not found, skipping';
    END;
    
    -- Try to unschedule any other related jobs
    BEGIN
        PERFORM cron.unschedule('refresh-news-hourly');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Cron job refresh-news-hourly not found, skipping';
    END;
END $$;

-- ============================================================================
-- Drop Tables
-- ============================================================================

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS quote_refresh_log CASCADE;
DROP TABLE IF EXISTS news_refresh_log CASCADE;
DROP TABLE IF EXISTS api_usage_tracking CASCADE;
DROP TABLE IF EXISTS stock_quotes CASCADE;
DROP TABLE IF EXISTS stock_cache CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;

-- ============================================================================
-- Drop Functions
-- ============================================================================

-- Stock quote related functions
DROP FUNCTION IF EXISTS get_active_portfolio_symbols() CASCADE;
DROP FUNCTION IF EXISTS bulk_upsert_stock_quotes(JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_stale_quote_symbols(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_quote_cache_stats() CASCADE;
DROP FUNCTION IF EXISTS get_cache_health_dashboard() CASCADE;

-- API usage tracking functions
DROP FUNCTION IF EXISTS increment_api_usage() CASCADE;

-- Stock cache functions
DROP FUNCTION IF EXISTS get_cached_stock_data(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS set_cached_stock_data(VARCHAR, VARCHAR, JSONB, INTEGER) CASCADE;

-- News cache functions
DROP FUNCTION IF EXISTS get_news_articles(VARCHAR, VARCHAR, INTEGER, INTEGER, DECIMAL, DECIMAL, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS bulk_upsert_news_articles(JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_news_cache_stats() CASCADE;
DROP FUNCTION IF EXISTS get_news_health_dashboard() CASCADE;
DROP FUNCTION IF EXISTS clean_old_news_articles(INTEGER) CASCADE;

-- Cron related functions
DROP FUNCTION IF EXISTS cron_refresh_portfolio_quotes() CASCADE;

-- ============================================================================
-- Cleanup Complete
-- ============================================================================

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE '✅ Alpha Vantage cache system removed successfully';
    RAISE NOTICE '✅ All related tables, functions, and cron jobs dropped';
    RAISE NOTICE '✅ Ready for Massive API with simplified in-memory caching';
END $$;
