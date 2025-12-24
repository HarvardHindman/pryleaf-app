-- =====================================================
-- NEWS & SENTIMENT CACHING SYSTEM
-- =====================================================
-- Migration: 20250132000001_create_news_cache.sql
-- Description: Create tables and functions for news article caching
-- with sentiment analysis and hourly refresh system
-- =====================================================

-- =====================================================
-- 1. NEWS ARTICLES CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id VARCHAR(255) UNIQUE NOT NULL, -- Unique ID from Alpha Vantage
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  time_published TIMESTAMPTZ NOT NULL,
  authors TEXT[], -- Array of author names
  summary TEXT,
  banner_image TEXT, -- URL to article image
  source VARCHAR(100),
  category_within_source VARCHAR(100),
  source_domain VARCHAR(255),
  
  -- Tickers mentioned in article
  tickers TEXT[], -- Array of ticker symbols
  topics TEXT[], -- Array of topics (e.g., "technology", "earnings", "ipo")
  
  -- Sentiment Analysis
  overall_sentiment_score DECIMAL(4,3), -- -1.0 to 1.0
  overall_sentiment_label VARCHAR(20), -- Bearish, Somewhat-Bearish, Neutral, Somewhat-Bullish, Bullish
  ticker_sentiment JSONB, -- Detailed sentiment per ticker
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_sentiment_score CHECK (overall_sentiment_score >= -1.0 AND overall_sentiment_score <= 1.0)
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_news_time_published ON public.news_articles(time_published DESC);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON public.news_articles USING GIN(tickers);
CREATE INDEX IF NOT EXISTS idx_news_topics ON public.news_articles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_news_source ON public.news_articles(source);
CREATE INDEX IF NOT EXISTS idx_news_sentiment_score ON public.news_articles(overall_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_news_last_fetched ON public.news_articles(last_fetched);

-- =====================================================
-- 2. NEWS REFRESH LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.news_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
  articles_fetched INTEGER DEFAULT 0,
  articles_inserted INTEGER DEFAULT 0,
  articles_updated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  tickers_processed TEXT[],
  topics_processed TEXT[],
  error_message TEXT,
  duration_seconds INTEGER,
  
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_news_refresh_started ON public.news_refresh_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_refresh_status ON public.news_refresh_log(status);

-- =====================================================
-- 3. DATABASE FUNCTIONS
-- =====================================================

-- Function: Get news articles with filters
CREATE OR REPLACE FUNCTION public.get_news_articles(
  p_ticker VARCHAR DEFAULT NULL,
  p_topic VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sentiment_min DECIMAL DEFAULT -1.0,
  p_sentiment_max DECIMAL DEFAULT 1.0,
  p_hours_ago INTEGER DEFAULT 168 -- Default 7 days
)
RETURNS TABLE (
  id UUID,
  article_id VARCHAR,
  title TEXT,
  url TEXT,
  time_published TIMESTAMPTZ,
  authors TEXT[],
  summary TEXT,
  banner_image TEXT,
  source VARCHAR,
  tickers TEXT[],
  topics TEXT[],
  overall_sentiment_score DECIMAL,
  overall_sentiment_label VARCHAR,
  ticker_sentiment JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.article_id,
    n.title,
    n.url,
    n.time_published,
    n.authors,
    n.summary,
    n.banner_image,
    n.source,
    n.tickers,
    n.topics,
    n.overall_sentiment_score,
    n.overall_sentiment_label,
    n.ticker_sentiment,
    n.created_at
  FROM public.news_articles n
  WHERE 
    (p_ticker IS NULL OR p_ticker = ANY(n.tickers))
    AND (p_topic IS NULL OR p_topic = ANY(n.topics))
    AND (n.overall_sentiment_score >= p_sentiment_min AND n.overall_sentiment_score <= p_sentiment_max)
    AND (n.time_published >= NOW() - (p_hours_ago || ' hours')::INTERVAL)
  ORDER BY n.time_published DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Bulk upsert news articles
CREATE OR REPLACE FUNCTION public.bulk_upsert_news_articles(articles JSONB)
RETURNS TABLE (
  inserted INTEGER,
  updated INTEGER,
  total INTEGER
) AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_total INTEGER := 0;
  article JSONB;
BEGIN
  v_total := jsonb_array_length(articles);
  
  FOR article IN SELECT * FROM jsonb_array_elements(articles)
  LOOP
    INSERT INTO public.news_articles (
      article_id,
      title,
      url,
      time_published,
      authors,
      summary,
      banner_image,
      source,
      category_within_source,
      source_domain,
      tickers,
      topics,
      overall_sentiment_score,
      overall_sentiment_label,
      ticker_sentiment,
      last_fetched
    ) VALUES (
      article->>'article_id',
      article->>'title',
      article->>'url',
      (article->>'time_published')::TIMESTAMPTZ,
      CASE WHEN article->'authors' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(article->'authors'))
      ELSE NULL END,
      article->>'summary',
      article->>'banner_image',
      article->>'source',
      article->>'category_within_source',
      article->>'source_domain',
      CASE WHEN article->'tickers' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(article->'tickers'))
      ELSE ARRAY[]::TEXT[] END,
      CASE WHEN article->'topics' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(article->'topics'))
      ELSE ARRAY[]::TEXT[] END,
      (article->>'overall_sentiment_score')::DECIMAL,
      article->>'overall_sentiment_label',
      article->'ticker_sentiment',
      NOW()
    )
    ON CONFLICT (article_id) 
    DO UPDATE SET
      title = EXCLUDED.title,
      url = EXCLUDED.url,
      time_published = EXCLUDED.time_published,
      authors = EXCLUDED.authors,
      summary = EXCLUDED.summary,
      banner_image = EXCLUDED.banner_image,
      source = EXCLUDED.source,
      category_within_source = EXCLUDED.category_within_source,
      source_domain = EXCLUDED.source_domain,
      tickers = EXCLUDED.tickers,
      topics = EXCLUDED.topics,
      overall_sentiment_score = EXCLUDED.overall_sentiment_score,
      overall_sentiment_label = EXCLUDED.overall_sentiment_label,
      ticker_sentiment = EXCLUDED.ticker_sentiment,
      last_fetched = NOW();
    
    IF FOUND THEN
      IF (SELECT last_fetched FROM public.news_articles WHERE article_id = article->>'article_id') < NOW() - INTERVAL '1 minute' THEN
        v_updated := v_updated + 1;
      ELSE
        v_inserted := v_inserted + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_inserted, v_updated, v_total;
END;
$$ LANGUAGE plpgsql;

-- Function: Get news cache statistics
CREATE OR REPLACE FUNCTION public.get_news_cache_stats()
RETURNS TABLE (
  total_articles INTEGER,
  articles_last_24h INTEGER,
  articles_last_7d INTEGER,
  unique_tickers INTEGER,
  unique_sources INTEGER,
  avg_sentiment_score DECIMAL,
  oldest_article TIMESTAMPTZ,
  newest_article TIMESTAMPTZ,
  bullish_count INTEGER,
  bearish_count INTEGER,
  neutral_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_articles,
    COUNT(*) FILTER (WHERE time_published >= NOW() - INTERVAL '24 hours')::INTEGER as articles_last_24h,
    COUNT(*) FILTER (WHERE time_published >= NOW() - INTERVAL '7 days')::INTEGER as articles_last_7d,
    (SELECT COUNT(DISTINCT ticker) FROM public.news_articles, UNNEST(tickers) AS ticker)::INTEGER as unique_tickers,
    COUNT(DISTINCT source)::INTEGER as unique_sources,
    AVG(overall_sentiment_score)::DECIMAL(4,3) as avg_sentiment_score,
    MIN(time_published) as oldest_article,
    MAX(time_published) as newest_article,
    COUNT(*) FILTER (WHERE overall_sentiment_label IN ('Bullish', 'Somewhat-Bullish'))::INTEGER as bullish_count,
    COUNT(*) FILTER (WHERE overall_sentiment_label IN ('Bearish', 'Somewhat-Bearish'))::INTEGER as bearish_count,
    COUNT(*) FILTER (WHERE overall_sentiment_label = 'Neutral')::INTEGER as neutral_count
  FROM public.news_articles;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get news health dashboard
CREATE OR REPLACE FUNCTION public.get_news_health_dashboard()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'cache_stats', (SELECT row_to_json(s) FROM (SELECT * FROM public.get_news_cache_stats()) s),
    'recent_refreshes', (
      SELECT COALESCE(json_agg(r ORDER BY r.started_at DESC), '[]'::json)
      FROM (
        SELECT 
          started_at,
          completed_at,
          status,
          articles_fetched,
          articles_inserted,
          articles_updated,
          api_calls_made,
          duration_seconds,
          error_message
        FROM public.news_refresh_log
        WHERE started_at >= NOW() - INTERVAL '24 hours'
        ORDER BY started_at DESC
        LIMIT 10
      ) r
    ),
    'top_tickers', (
      SELECT COALESCE(json_agg(t), '[]'::json)
      FROM (
        SELECT ticker, COUNT(*) as article_count
        FROM public.news_articles, UNNEST(tickers) AS ticker
        WHERE time_published >= NOW() - INTERVAL '24 hours'
        GROUP BY ticker
        ORDER BY article_count DESC
        LIMIT 10
      ) t
    ),
    'top_topics', (
      SELECT COALESCE(json_agg(t), '[]'::json)
      FROM (
        SELECT topic, COUNT(*) as article_count
        FROM public.news_articles, UNNEST(topics) AS topic
        WHERE time_published >= NOW() - INTERVAL '24 hours'
        GROUP BY topic
        ORDER BY article_count DESC
        LIMIT 10
      ) t
    ),
    'health_status', CASE
      WHEN (SELECT articles_last_24h FROM public.get_news_cache_stats()) > 50 THEN 'HEALTHY'
      WHEN (SELECT articles_last_24h FROM public.get_news_cache_stats()) > 10 THEN 'PARTIAL'
      WHEN (SELECT articles_last_24h FROM public.get_news_cache_stats()) > 0 THEN 'STALE'
      ELSE 'EMPTY'
    END,
    'last_updated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Clean old news articles (keep last 30 days)
CREATE OR REPLACE FUNCTION public.clean_old_news_articles(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.news_articles
  WHERE time_published < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_refresh_log ENABLE ROW LEVEL SECURITY;

-- Public read access to news articles (authenticated users)
CREATE POLICY "Anyone can read news articles"
  ON public.news_articles
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert/update news articles
CREATE POLICY "Service role can manage news articles"
  ON public.news_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read refresh logs
CREATE POLICY "Authenticated users can read refresh logs"
  ON public.news_refresh_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage refresh logs
CREATE POLICY "Service role can manage refresh logs"
  ON public.news_refresh_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_news_articles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_news_cache_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_news_health_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_upsert_news_articles TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_news_articles TO service_role;

-- Grant table permissions
GRANT SELECT ON public.news_articles TO authenticated;
GRANT SELECT ON public.news_refresh_log TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
GRANT ALL ON public.news_refresh_log TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ News & Sentiment caching system created successfully';
  RAISE NOTICE '📊 Tables: news_articles, news_refresh_log';
  RAISE NOTICE '🔧 Functions: get_news_articles, bulk_upsert_news_articles, get_news_cache_stats, get_news_health_dashboard, clean_old_news_articles';
  RAISE NOTICE '🔐 RLS policies enabled for security';
END $$;

