/**
 * Massive API Client (formerly Polygon.io)
 * Provides access to real-time stock data, company information, and news
 * with built-in in-memory caching
 */

// ============================================================================
// TypeScript Interfaces matching Massive API responses
// ============================================================================

export interface MassiveQuote {
  ticker: string;
  price: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: number;
  volume?: number;
}

export interface MassiveSnapshot {
  ticker: string;
  todaysChange: number;
  todaysChangePerc: number;
  updated: number;
  day: {
    o: number;  // open
    h: number;  // high
    l: number;  // low
    c: number;  // close
    v: number;  // volume
    vw: number; // volume weighted
  };
  prevDay: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  min?: {
    av: number;  // accumulated volume
    c: number;   // close
    h: number;   // high
    l: number;   // low
    o: number;   // open
    v: number;   // volume
    vw: number;  // volume weighted
  };
  lastQuote?: {
    p: number;  // bid
    P: number;  // ask
    s: number;  // bid size
    S: number;  // ask size
    t: number;  // timestamp
  };
  lastTrade?: {
    p: number;  // price
    s: number;  // size
    t: number;  // timestamp
    x: number;  // exchange
  };
}

export interface MassiveTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  description?: string;
  sic_code?: string;
  sic_description?: string;
  ticker_root?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
  round_lot?: number;
}

export interface MassiveAggregate {
  o: number;   // open
  h: number;   // high
  l: number;   // low
  c: number;   // close
  v: number;   // volume
  vw: number;  // volume weighted average
  t: number;   // timestamp (Unix milliseconds)
  n: number;   // number of transactions
  otc?: boolean;
}

export interface MassiveNewsArticle {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author?: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  amp_url?: string;
  image_url?: string;
  description?: string;
  keywords?: string[];
  insights?: Array<{
    ticker: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    sentiment_reasoning: string;
  }>;
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTLMinutes: number = 5) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLMinutes * 60 * 1000; // Convert to milliseconds
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// Massive API Client
// ============================================================================

export class MassiveClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.polygon.io';
  private cache: InMemoryCache;

  constructor(apiKey?: string, cacheTTLMinutes: number = 5) {
    this.apiKey = apiKey || process.env.MASSIVE_API_KEY || '';
    this.cache = new InMemoryCache(cacheTTLMinutes);

    if (!this.apiKey) {
      console.warn('⚠️  MASSIVE_API_KEY not provided. API calls will fail.');
    }

    // Run cleanup every 10 minutes
    setInterval(() => this.cache.cleanup(), 10 * 60 * 1000);
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.baseUrl);
    url.searchParams.append('apiKey', this.apiKey);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async fetch<T>(url: string, cacheKey?: string, cacheTTL?: number): Promise<T> {
    // Check cache first if cacheKey provided
    if (cacheKey) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        console.log(`[Massive] Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Massive API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ERROR') {
        throw new Error(`Massive API error: ${data.error || 'Unknown error'}`);
      }

      // Cache if cacheKey provided
      if (cacheKey) {
        this.cache.set(cacheKey, data, cacheTTL);
        console.log(`[Massive] Cached: ${cacheKey}`);
      }

      return data;
    } catch (error) {
      console.error('[Massive] API call failed:', error);
      throw error;
    }
  }

  /**
   * Get the most recent NBBO quote for a ticker
   * Endpoint: GET /v2/last/nbbo/{ticker}
   */
  async getQuote(ticker: string): Promise<MassiveQuote> {
    const normalizedTicker = ticker.toUpperCase();
    const url = this.buildUrl(`/v2/last/nbbo/${normalizedTicker}`);
    const cacheKey = `quote:${normalizedTicker}`;

    const response = await this.fetch<{
      status: string;
      results: {
        T: string;    // ticker
        p: number;    // bid price
        P: number;    // ask price
        s: number;    // bid size
        S: number;    // ask size
        t: number;    // timestamp
      };
    }>(url, cacheKey, 5);

    const r = response.results;
    
    return {
      ticker: r.T,
      bid: r.p,
      ask: r.P,
      price: (r.p + r.P) / 2, // Mid price
      bidSize: r.s,
      askSize: r.S,
      timestamp: r.t,
    };
  }

  /**
   * Get comprehensive snapshot for a single ticker
   * Includes: latest quote, day bar, minute bar, previous day
   * Endpoint: GET /v2/snapshot/locale/us/markets/stocks/tickers/{ticker}
   */
  async getSnapshot(ticker: string): Promise<MassiveSnapshot> {
    const normalizedTicker = ticker.toUpperCase();
    const url = this.buildUrl(`/v2/snapshot/locale/us/markets/stocks/tickers/${normalizedTicker}`);
    const cacheKey = `snapshot:${normalizedTicker}`;

    const response = await this.fetch<{
      status: string;
      ticker: MassiveSnapshot;
    }>(url, cacheKey, 5);

    return response.ticker;
  }

  /**
   * Get detailed ticker information (company overview)
   * Endpoint: GET /v3/reference/tickers/{ticker}
   */
  async getTickerDetails(ticker: string, date?: string): Promise<MassiveTickerDetails> {
    const normalizedTicker = ticker.toUpperCase();
    const params = date ? { date } : undefined;
    const url = this.buildUrl(`/v3/reference/tickers/${normalizedTicker}`, params);
    const cacheKey = `details:${normalizedTicker}${date ? `:${date}` : ''}`;

    const response = await this.fetch<{
      status: string;
      results: MassiveTickerDetails;
    }>(url, cacheKey, 60); // Cache for 60 minutes (changes infrequently)

    return response.results;
  }

  /**
   * Get aggregate bars (OHLC) for a ticker over a date range
   * Endpoint: GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
   */
  async getAggregates(
    ticker: string,
    multiplier: number,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    from: string, // YYYY-MM-DD or timestamp
    to: string,   // YYYY-MM-DD or timestamp
    options?: {
      adjusted?: boolean;
      sort?: 'asc' | 'desc';
      limit?: number;
    }
  ): Promise<MassiveAggregate[]> {
    const normalizedTicker = ticker.toUpperCase();
    const url = this.buildUrl(
      `/v2/aggs/ticker/${normalizedTicker}/range/${multiplier}/${timespan}/${from}/${to}`,
      {
        adjusted: options?.adjusted !== false, // Default true
        sort: options?.sort || 'asc',
        limit: options?.limit || 5000,
      }
    );
    const cacheKey = `aggs:${normalizedTicker}:${multiplier}${timespan}:${from}:${to}`;

    const response = await this.fetch<{
      status: string;
      ticker: string;
      results: MassiveAggregate[];
      resultsCount: number;
    }>(url, cacheKey, 30); // Cache for 30 minutes

    return response.results || [];
  }

  /**
   * Get news articles, optionally filtered by ticker
   * Endpoint: GET /v2/reference/news
   */
  async getNews(options?: {
    ticker?: string;
    published_utc?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }): Promise<MassiveNewsArticle[]> {
    const params: Record<string, any> = {
      order: options?.order || 'desc',
      limit: options?.limit || 10,
      sort: options?.sort || 'published_utc',
    };

    if (options?.ticker) {
      params.ticker = options.ticker.toUpperCase();
    }

    if (options?.published_utc) {
      params.published_utc = options.published_utc;
    }

    const url = this.buildUrl('/v2/reference/news', params);
    const cacheKey = `news:${options?.ticker || 'all'}:${options?.limit || 10}`;

    const response = await this.fetch<{
      status: string;
      results: MassiveNewsArticle[];
      count: number;
    }>(url, cacheKey, 10); // Cache for 10 minutes

    return response.results || [];
  }

  /**
   * Get multiple snapshots at once (batch operation)
   * Endpoint: GET /v2/snapshot/locale/us/markets/stocks/tickers
   */
  async getBatchSnapshots(tickers?: string[]): Promise<MassiveSnapshot[]> {
    const params: Record<string, any> = {};
    
    if (tickers && tickers.length > 0) {
      params.tickers = tickers.map(t => t.toUpperCase()).join(',');
    }

    const url = this.buildUrl('/v2/snapshot/locale/us/markets/stocks/tickers', params);
    const cacheKey = tickers ? `batch:${tickers.join(',')}` : 'batch:all';

    const response = await this.fetch<{
      status: string;
      tickers: MassiveSnapshot[];
      count: number;
    }>(url, cacheKey, 5);

    return response.tickers || [];
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[Massive] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: this.cache.size(),
    };
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

let massiveClientInstance: MassiveClient | null = null;

export function getMassiveClient(): MassiveClient {
  if (!massiveClientInstance) {
    massiveClientInstance = new MassiveClient();
  }
  return massiveClientInstance;
}

// Default export for convenience
export default MassiveClient;
