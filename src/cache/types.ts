/**
 * Shared types for caching system
 */

// ============================================================================
// Stock/Ticker Types
// ============================================================================

export interface CompanyOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  SharesOutstanding: string;
  SharesFloat: string;
  PercentInsiders: string;
  PercentInstitutions: string;
  DividendDate: string;
  ExDividendDate: string;
}

export interface Quote {
  symbol: string;
  open: string;
  high: string;
  low: string;
  price: string;
  volume: string;
  latestDay: string;
  previousClose: string;
  change: string;
  changePercent: string;
}

export interface TimeSeriesData {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface ApiUsageStats {
  used: number;
  remaining: number;
  limit: number;
  resetDate: string;
}

// ============================================================================
// Bulk Quote Types
// ============================================================================

export interface BulkQuoteResult {
  symbol: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  change_percent: string;
  extended_hours_quote?: string;
  extended_hours_change?: string;
  extended_hours_change_percent?: string;
}

export interface RefreshStats {
  logId: string;
  symbolsRequested: number;
  symbolsProcessed: number;
  apiCallsMade: number;
  batches: number;
  duration: number;
  status: 'completed' | 'failed' | 'partial';
  errors: string[];
}

// ============================================================================
// News Types
// ============================================================================

export interface NewsArticle {
  article_id: string;
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  category_within_source?: string;
  source_domain: string;
  tickers: string[];
  topics: string[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: TickerSentiment[];
}

export interface TickerSentiment {
  ticker: string;
  relevance_score: string;
  ticker_sentiment_score: string;
  ticker_sentiment_label: string;
}

export interface NewsFilters {
  ticker?: string;
  topic?: string;
  limit?: number;
  offset?: number;
  sentimentMin?: number;
  sentimentMax?: number;
  hoursAgo?: number;
}

export interface NewsCacheStats {
  total_articles: number;
  articles_last_24h: number;
  articles_last_7d: number;
  unique_tickers: number;
  unique_sources: number;
  avg_sentiment_score: number;
  oldest_article: string;
  newest_article: string;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

export interface NewsRefreshResult {
  success: boolean;
  articlesInserted: number;
  articlesUpdated: number;
  totalArticles: number;
  apiCallsMade: number;
  error?: string;
}

// ============================================================================
// Cache Entry Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

