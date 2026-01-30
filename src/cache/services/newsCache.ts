/**
 * News Cache Service
 * Handles fetching and caching news articles with sentiment
 * Uses Alpha Vantage NEWS_SENTIMENT API
 */

import { createClient } from '@supabase/supabase-js';
import { 
  NewsArticle, 
  NewsFilters, 
  NewsCacheStats, 
  NewsRefreshResult 
} from '../types';

// Initialize Supabase client with service role (server-side only)
// Lazy-loaded to avoid initialization errors
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseServiceClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    throw new Error('Missing Supabase credentials. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return supabaseClient;
};

export class NewsCacheService {
  private get supabase() {
    return getSupabaseServiceClient();
  }

  /**
   * Fetch news from cache with filters
   */
  async getNews(filters: NewsFilters = {}): Promise<NewsArticle[]> {
    const {
      ticker,
      topic,
      limit = 50,
      offset = 0,
      sentimentMin = -1.0,
      sentimentMax = 1.0,
      hoursAgo = 168 // 7 days default
    } = filters;

    const { data, error } = await this.supabase.rpc('get_news_articles', {
      p_ticker: ticker || null,
      p_topic: topic || null,
      p_limit: limit,
      p_offset: offset,
      p_sentiment_min: sentimentMin,
      p_sentiment_max: sentimentMax,
      p_hours_ago: hoursAgo
    });

    if (error) {
      console.error('Error fetching news:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get news cache statistics
   */
  async getCacheStats(): Promise<NewsCacheStats> {
    const { data, error } = await this.supabase.rpc('get_news_cache_stats');

    if (error) {
      console.error('Error fetching cache stats:', error);
      throw error;
    }

    return data[0] || {
      total_articles: 0,
      articles_last_24h: 0,
      articles_last_7d: 0,
      unique_tickers: 0,
      unique_sources: 0,
      avg_sentiment_score: 0,
      oldest_article: new Date().toISOString(),
      newest_article: new Date().toISOString(),
      bullish_count: 0,
      bearish_count: 0,
      neutral_count: 0
    };
  }

  /**
   * Get news health dashboard
   */
  async getHealthDashboard() {
    const { data, error } = await this.supabase.rpc('get_news_health_dashboard');

    if (error) {
      console.error('Error fetching health dashboard:', error);
      throw error;
    }

    return data;
  }

  /**
   * Fetch news from Alpha Vantage API (no MCP - direct API call)
   * MCP doesn't support all the parameters we need, so we call API directly
   */
  async fetchNewsFromAPI(options: {
    tickers?: string[];
    topics?: string[];
    limit?: number;
    timeFrom?: string;
    timeTo?: string;
    sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
  } = {}): Promise<any[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    const {
      tickers = [],
      topics = [],
      limit = 200, // Max from API
      timeFrom,
      timeTo,
      sort = 'LATEST'
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      apikey: apiKey,
      limit: limit.toString(),
      sort: sort
    });

    if (tickers.length > 0) {
      params.append('tickers', tickers.join(','));
    }

    if (topics.length > 0) {
      params.append('topics', topics.join(','));
    }

    if (timeFrom) {
      params.append('time_from', timeFrom);
    }

    if (timeTo) {
      params.append('time_to', timeTo);
    }

    const url = `https://www.alphavantage.co/query?${params.toString()}`;
    
    console.log('📰 Fetching news from Alpha Vantage:', {
      tickers: tickers.length,
      topics: topics.length,
      limit,
      sort
    });

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }

    return data.feed || [];
  }

  /**
   * Transform API response to our database format
   */
  private transformArticle(article: any): any {
    return {
      article_id: article.url, // Use URL as unique ID
      title: article.title,
      url: article.url,
      time_published: article.time_published,
      authors: article.authors || [],
      summary: article.summary,
      banner_image: article.banner_image || null,
      source: article.source,
      category_within_source: article.category_within_source || null,
      source_domain: article.source_domain,
      tickers: (article.ticker_sentiment || []).map((t: any) => t.ticker),
      topics: (article.topics || []).map((t: any) => t.topic),
      overall_sentiment_score: parseFloat(article.overall_sentiment_score) || 0,
      overall_sentiment_label: article.overall_sentiment_label || 'Neutral',
      ticker_sentiment: article.ticker_sentiment || []
    };
  }

  /**
   * Refresh news cache from Alpha Vantage
   */
  async refreshNewsCache(options: {
    tickers?: string[];
    topics?: string[];
    limit?: number;
  } = {}): Promise<NewsRefreshResult> {
    const startTime = Date.now();

    try {
      // Create refresh log entry
      const { data: logEntry, error: logError } = await this.supabase
        .from('news_refresh_log')
        .insert({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (logError) {
        console.error('Error creating refresh log:', logError);
      }

      // Fetch news from API
      const articles = await this.fetchNewsFromAPI({
        tickers: options.tickers,
        topics: options.topics,
        limit: options.limit || 200,
        sort: 'LATEST'
      });

      console.log(`📰 Fetched ${articles.length} articles from Alpha Vantage`);

      if (articles.length === 0) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        
        if (logEntry) {
          await this.supabase
            .from('news_refresh_log')
            .update({
              completed_at: new Date().toISOString(),
              status: 'completed',
              articles_fetched: 0,
              articles_inserted: 0,
              articles_updated: 0,
              api_calls_made: 1,
              duration_seconds: duration
            })
            .eq('id', logEntry.id);
        }

        return {
          success: true,
          articlesInserted: 0,
          articlesUpdated: 0,
          totalArticles: 0,
          apiCallsMade: 1
        };
      }

      // Transform articles
      const transformedArticles = articles.map(a => this.transformArticle(a));

      // Bulk upsert into database
      const { data: upsertResult, error: upsertError } = await this.supabase.rpc(
        'bulk_upsert_news_articles',
        { articles: transformedArticles }
      );

      if (upsertError) {
        throw upsertError;
      }

      const result = upsertResult[0] || { inserted: 0, updated: 0, total: 0 };
      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log('✅ News refresh completed:', {
        inserted: result.inserted,
        updated: result.updated,
        total: result.total,
        duration: `${duration}s`
      });

      // Update refresh log
      if (logEntry) {
        await this.supabase
          .from('news_refresh_log')
          .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            articles_fetched: articles.length,
            articles_inserted: result.inserted,
            articles_updated: result.updated,
            api_calls_made: 1,
            tickers_processed: options.tickers || [],
            topics_processed: options.topics || [],
            duration_seconds: duration
          })
          .eq('id', logEntry.id);
      }

      return {
        success: true,
        articlesInserted: result.inserted,
        articlesUpdated: result.updated,
        totalArticles: result.total,
        apiCallsMade: 1
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.error('❌ News refresh failed:', error);

      // Log the error
      await this.supabase
        .from('news_refresh_log')
        .insert({
          status: 'failed',
          error_message: error.message,
          duration_seconds: duration,
          completed_at: new Date().toISOString()
        });

      return {
        success: false,
        articlesInserted: 0,
        articlesUpdated: 0,
        totalArticles: 0,
        apiCallsMade: 1,
        error: error.message
      };
    }
  }

  /**
   * Clean old news articles (keep last N days)
   */
  async cleanOldArticles(daysToKeep: number = 30): Promise<number> {
    const { data, error } = await this.supabase.rpc('clean_old_news_articles', {
      days_to_keep: daysToKeep
    });

    if (error) {
      console.error('Error cleaning old articles:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Get trending tickers from news (last 24h)
   */
  async getTrendingTickers(limit: number = 10): Promise<Array<{ ticker: string; count: number }>> {
    const { data, error } = await this.supabase
      .from('news_articles')
      .select('tickers')
      .gte('time_published', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching trending tickers:', error);
      return [];
    }

    // Count ticker mentions
    const tickerCounts: { [key: string]: number } = {};
    
    data.forEach((article: any) => {
      if (article.tickers) {
        article.tickers.forEach((ticker: string) => {
          tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
        });
      }
    });

    // Sort and return top N
    return Object.entries(tickerCounts)
      .map(([ticker, count]) => ({ ticker, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Export singleton instance
export const newsCache = new NewsCacheService();

// Export legacy name for backward compatibility during migration
export const newsService = newsCache;
export const NewsService = NewsCacheService;

