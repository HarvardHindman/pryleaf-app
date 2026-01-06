/**
 * Shared constants for caching system
 */

// ============================================================================
// Cache TTLs (Time To Live) - in milliseconds
// ============================================================================

export const CACHE_TTL = {
  // Stock data
  STOCK_QUOTE: 5 * 60 * 1000,           // 5 minutes - realtime quotes
  STOCK_OVERVIEW: 15 * 60 * 1000,       // 15 minutes - company overview
  TIME_SERIES_DAILY: 60 * 60 * 1000,    // 1 hour - daily time series
  TIME_SERIES_WEEKLY: 60 * 60 * 1000,   // 1 hour - weekly time series
  TIME_SERIES_MONTHLY: 60 * 60 * 1000,  // 1 hour - monthly time series
  FINANCIALS: 24 * 60 * 60 * 1000,      // 24 hours - financial statements
  
  // Community data
  COMMUNITY_LIST: 5 * 60 * 1000,        // 5 minutes - all communities
  COMMUNITY_DETAILS: 5 * 60 * 1000,     // 5 minutes - community details
  COMMUNITY_STATS: 5 * 60 * 1000,       // 5 minutes - analytics stats
  COMMUNITY_ACTIVITY: 5 * 60 * 1000,    // 5 minutes - recent activities
  
  // Ticker data (client-side)
  TICKER_DATA: 2 * 60 * 1000,           // 2 minutes - ticker cache
  
  // News
  NEWS_ARTICLES: 7 * 24 * 60 * 60 * 1000, // 7 days - news articles
  
  // In-memory price cache
  PRICE_BATCH: 5 * 60 * 1000,           // 5 minutes - batch price quotes
} as const;

// ============================================================================
// API Rate Limits
// ============================================================================

export const API_LIMITS = {
  ALPHA_VANTAGE_FREE: 25,               // Free tier: 25 requests/day
  ALPHA_VANTAGE_PREMIUM: 500,           // Premium tier: 500+ requests/day
  BULK_QUOTE_BATCH_SIZE: 100,           // Max symbols per bulk quote request
  RATE_LIMIT_PER_MINUTE: 5,             // Alpha Vantage: 5 requests/minute
  RATE_LIMIT_DELAY: 12000,              // 12 seconds between batches (5 req/min)
} as const;

// ============================================================================
// Cache Invalidation Rules
// ============================================================================

export const CACHE_INVALIDATION = {
  // When to force refresh (trading hours)
  TRADING_HOURS_START: 9.5,             // 9:30 AM ET
  TRADING_HOURS_END: 16,                // 4:00 PM ET
  
  // Stale thresholds
  STALE_QUOTE_MINUTES: 60,              // Consider quote stale after 1 hour
  STALE_NEWS_DAYS: 30,                  // Clean news older than 30 days
} as const;

// ============================================================================
// Supabase Data Types (for stock_cache table)
// ============================================================================

export const DATA_TYPES = {
  OVERVIEW: 'overview',
  QUOTE: 'quote',
  TIMESERIES_DAILY_COMPACT: 'timeseries_daily_compact',
  TIMESERIES_DAILY_FULL: 'timeseries_daily_full',
  TIMESERIES_WEEKLY_COMPACT: 'timeseries_weekly_compact',
  TIMESERIES_WEEKLY_FULL: 'timeseries_weekly_full',
  TIMESERIES_MONTHLY_COMPACT: 'timeseries_monthly_compact',
  TIMESERIES_MONTHLY_FULL: 'timeseries_monthly_full',
  TIMESERIES_INTRADAY: 'timeseries_intraday',
  FINANCIALS_INCOME: 'financials_income_statement',
  FINANCIALS_BALANCE: 'financials_balance_sheet',
  FINANCIALS_CASHFLOW: 'financials_cash_flow',
  FINANCIALS_EARNINGS: 'financials_earnings',
} as const;

// ============================================================================
// Cache Status
// ============================================================================

export const CACHE_STATUS = {
  HIT: 'hit',           // Found in cache and fresh
  MISS: 'miss',         // Not in cache
  STALE: 'stale',       // In cache but expired
  ERROR: 'error',       // Cache error occurred
} as const;

// ============================================================================
// Export type helpers
// ============================================================================

export type CacheStatus = typeof CACHE_STATUS[keyof typeof CACHE_STATUS];
export type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

