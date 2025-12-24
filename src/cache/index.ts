/**
 * Cache System - Main Exports
 * Single import point for all caching functionality
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export cache services
export { StockCacheService, AlphaVantageSupabase } from './services/stockCache';
export { BulkQuoteCacheService, BulkQuoteService } from './services/bulkQuoteCache';
export { NewsCacheService, newsCache, newsService, NewsService } from './services/newsCache';
export { priceCache } from './services/priceCache';

// Re-export specific types for convenience
export type {
  CompanyOverview,
  Quote,
  TimeSeriesData,
  ApiUsageStats,
  BulkQuoteResult,
  RefreshStats,
  NewsArticle,
  TickerSentiment,
  NewsFilters,
  NewsCacheStats,
  NewsRefreshResult,
  CacheEntry,
  CacheOptions
} from './types';

