/**
 * Massive API Client (formerly Polygon.io)
 * Provides access to real-time stock data, company information, and news
 * with built-in in-memory caching and mock data fallback for development
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
// Mock Data Generators (for development/fallback)
// ============================================================================

function randomPrice(base: number = 100, variance: number = 20): number {
  return parseFloat((base + (Math.random() - 0.5) * variance).toFixed(2));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChange(): { change: number; changePerc: number } {
  const changePerc = parseFloat(((Math.random() - 0.5) * 10).toFixed(2));
  const change = parseFloat((changePerc * 2).toFixed(2));
  return { change, changePerc };
}

class MockDataGenerator {
  static generateQuote(ticker: string): MassiveQuote {
    const price = randomPrice(150, 50);
    return {
      ticker: ticker.toUpperCase(),
      price,
      bid: price - 0.05,
      ask: price + 0.05,
      bidSize: randomInt(100, 500),
      askSize: randomInt(100, 500),
      timestamp: Date.now(),
      volume: randomInt(1000000, 50000000),
    };
  }

  static generateSnapshot(ticker: string): MassiveSnapshot {
    const { change, changePerc } = randomChange();
    const prevClose = randomPrice(150, 50);
    const open = prevClose + change * 0.3;
    const close = prevClose + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * 0.5;
    const volume = randomInt(5000000, 100000000);

    return {
      ticker: ticker.toUpperCase(),
      todaysChange: change,
      todaysChangePerc: changePerc,
      updated: Date.now(),
      day: {
        o: parseFloat(open.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        c: parseFloat(close.toFixed(2)),
        v: volume,
        vw: parseFloat(((open + close) / 2).toFixed(2)),
      },
      prevDay: {
        o: parseFloat((prevClose - 2).toFixed(2)),
        h: parseFloat((prevClose + 1).toFixed(2)),
        l: parseFloat((prevClose - 1).toFixed(2)),
        c: parseFloat(prevClose.toFixed(2)),
        v: randomInt(4000000, 80000000),
        vw: parseFloat(prevClose.toFixed(2)),
      },
      min: {
        av: volume,
        c: parseFloat(close.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        o: parseFloat(open.toFixed(2)),
        v: randomInt(100000, 1000000),
        vw: parseFloat(((open + close) / 2).toFixed(2)),
      },
      lastQuote: {
        p: parseFloat((close - 0.05).toFixed(2)),
        P: parseFloat((close + 0.05).toFixed(2)),
        s: randomInt(100, 500),
        S: randomInt(100, 500),
        t: Date.now(),
      },
      lastTrade: {
        p: parseFloat(close.toFixed(2)),
        s: randomInt(10, 100),
        t: Date.now(),
        x: 1,
      },
    };
  }

  static generateTickerDetails(ticker: string): MassiveTickerDetails {
    const companies = [
      { name: 'Technology Corp', sector: 'Technology', sic: 'Software & Services' },
      { name: 'Financial Services Inc', sector: 'Financial', sic: 'Banking & Investment Services' },
      { name: 'Healthcare Solutions', sector: 'Healthcare', sic: 'Medical Devices & Services' },
      { name: 'Energy Group', sector: 'Energy', sic: 'Oil & Gas Production' },
      { name: 'Consumer Products Co', sector: 'Consumer', sic: 'Retail & Consumer Goods' },
    ];
    
    const company = companies[randomInt(0, companies.length - 1)];
    const price = randomPrice(150, 50);
    const shares = randomInt(100000000, 10000000000);
    
    return {
      ticker: ticker.toUpperCase(),
      name: `${ticker.toUpperCase()} ${company.name}`,
      market: 'stocks',
      locale: 'us',
      primary_exchange: ['NASDAQ', 'NYSE', 'AMEX'][randomInt(0, 2)],
      type: 'CS',
      active: true,
      currency_name: 'usd',
      cik: String(randomInt(1000000, 9999999)),
      composite_figi: `BBG${randomInt(100000000, 999999999)}`,
      share_class_figi: `BBG${randomInt(100000000, 999999999)}1`,
      market_cap: parseFloat((price * shares).toFixed(0)),
      phone_number: `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      address: {
        address1: `${randomInt(1, 9999)} Main Street`,
        city: ['New York', 'San Francisco', 'Boston', 'Austin', 'Seattle'][randomInt(0, 4)],
        state: ['NY', 'CA', 'MA', 'TX', 'WA'][randomInt(0, 4)],
        postal_code: String(randomInt(10000, 99999)),
      },
      description: `${ticker.toUpperCase()} is a leading company in the ${company.sector.toLowerCase()} sector, providing innovative solutions and services to customers worldwide. The company focuses on delivering value through technology, innovation, and customer satisfaction.`,
      sic_code: String(randomInt(1000, 9999)),
      sic_description: company.sic,
      ticker_root: ticker.toUpperCase(),
      homepage_url: `https://www.${ticker.toLowerCase()}.com`,
      total_employees: randomInt(500, 150000),
      list_date: `${randomInt(1990, 2020)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      branding: {
        logo_url: `https://api.polygon.io/v1/reference/company-branding/${ticker.toLowerCase()}/logo`,
        icon_url: `https://api.polygon.io/v1/reference/company-branding/${ticker.toLowerCase()}/icon`,
      },
      share_class_shares_outstanding: shares,
      weighted_shares_outstanding: shares,
      round_lot: 100,
    };
  }

  static generateAggregates(
    ticker: string,
    count: number = 30
  ): MassiveAggregate[] {
    const aggregates: MassiveAggregate[] = [];
    let basePrice = randomPrice(150, 50);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = count - 1; i >= 0; i--) {
      const dayChange = (Math.random() - 0.5) * 10;
      const open = basePrice;
      const close = basePrice + dayChange;
      const high = Math.max(open, close) + Math.abs(dayChange) * 0.5;
      const low = Math.min(open, close) - Math.abs(dayChange) * 0.5;

      aggregates.push({
        o: parseFloat(open.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        c: parseFloat(close.toFixed(2)),
        v: randomInt(5000000, 100000000),
        vw: parseFloat(((open + close) / 2).toFixed(2)),
        t: now - i * oneDayMs,
        n: randomInt(10000, 50000),
        otc: false,
      });

      basePrice = close;
    }

    return aggregates;
  }

  static generateNews(ticker?: string, limit: number = 10): MassiveNewsArticle[] {
    const publishers = [
      { name: 'Bloomberg', url: 'https://www.bloomberg.com', logo: 'https://logo.clearbit.com/bloomberg.com' },
      { name: 'Reuters', url: 'https://www.reuters.com', logo: 'https://logo.clearbit.com/reuters.com' },
      { name: 'CNBC', url: 'https://www.cnbc.com', logo: 'https://logo.clearbit.com/cnbc.com' },
      { name: 'Financial Times', url: 'https://www.ft.com', logo: 'https://logo.clearbit.com/ft.com' },
      { name: 'Wall Street Journal', url: 'https://www.wsj.com', logo: 'https://logo.clearbit.com/wsj.com' },
    ];

    const headlines = [
      'Reports Strong Quarterly Earnings',
      'Announces New Product Launch',
      'Shares Rise on Positive Outlook',
      'CEO Discusses Future Strategy',
      'Expands into New Markets',
      'Beats Analyst Expectations',
      'Faces Regulatory Challenges',
      'Partners with Industry Leader',
      'Stock Price Reaches New High',
      'Investors Await Key Announcement',
    ];

    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

    const articles: MassiveNewsArticle[] = [];
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    for (let i = 0; i < limit; i++) {
      const publisher = publishers[randomInt(0, publishers.length - 1)];
      const headline = headlines[randomInt(0, headlines.length - 1)];
      const sentiment = sentiments[randomInt(0, 2)];
      const targetTicker = ticker?.toUpperCase() || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'][randomInt(0, 4)];
      
      const publishedTime = new Date(now - i * oneHourMs * 2);

      articles.push({
        id: `mock-${randomInt(100000, 999999)}`,
        publisher: {
          name: publisher.name,
          homepage_url: publisher.url,
          logo_url: publisher.logo,
          favicon_url: `${publisher.logo}/favicon.ico`,
        },
        title: `${targetTicker} ${headline}`,
        author: ['John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Williams'][randomInt(0, 3)],
        published_utc: publishedTime.toISOString(),
        article_url: `${publisher.url}/article/${randomInt(1000, 9999)}`,
        tickers: [targetTicker],
        amp_url: `${publisher.url}/amp/article/${randomInt(1000, 9999)}`,
        image_url: `https://picsum.photos/800/600?random=${i}`,
        description: `${targetTicker} ${headline.toLowerCase()} as the company continues to show strong performance in the market. Analysts are closely watching the stock's movement.`,
        keywords: ['stocks', 'market', 'earnings', targetTicker.toLowerCase()],
        insights: [
          {
            ticker: targetTicker,
            sentiment,
            sentiment_reasoning: `The article discusses ${targetTicker}'s recent ${sentiment === 'positive' ? 'positive developments' : sentiment === 'negative' ? 'challenges' : 'news'} in the market.`,
          },
        ],
      });
    }

    return articles;
  }
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
  private useMockData: boolean;

  constructor(apiKey?: string, cacheTTLMinutes: number = 5) {
    this.apiKey = apiKey || process.env.MASSIVE_API_KEY || '';
    this.cache = new InMemoryCache(cacheTTLMinutes);
    
    // Enable mock data if explicitly set or if API key is missing
    this.useMockData = process.env.USE_MOCK_DATA === 'true' || !this.apiKey;

    if (!this.apiKey) {
      console.warn('⚠️  MASSIVE_API_KEY not provided. Using mock data.');
    }

    if (this.useMockData) {
      console.log('🎭 Mock data mode enabled - all API calls will return realistic mock data');
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

  private async fetch<T>(
    url: string, 
    cacheKey?: string, 
    cacheTTL?: number,
    mockDataFallback?: () => T
  ): Promise<T> {
    // Check cache first if cacheKey provided
    if (cacheKey) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        console.log(`[Massive] Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    // Return mock data if mock mode is enabled
    if (this.useMockData && mockDataFallback) {
      console.log(`[Massive] Mock data: ${cacheKey || 'unknown'}`);
      const mockData = mockDataFallback();
      
      // Cache mock data too
      if (cacheKey) {
        this.cache.set(cacheKey, mockData, cacheTTL);
      }
      
      return mockData;
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
      
      // Use mock data as fallback if available
      if (mockDataFallback) {
        console.log(`[Massive] Using mock data fallback for: ${cacheKey || 'unknown'}`);
        const mockData = mockDataFallback();
        
        // Cache the fallback data briefly (1 minute)
        if (cacheKey) {
          this.cache.set(cacheKey, mockData, 1);
        }
        
        return mockData;
      }
      
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
    }>(
      url, 
      cacheKey, 
      5,
      () => ({
        status: 'OK',
        results: {
          T: normalizedTicker,
          p: MockDataGenerator.generateQuote(normalizedTicker).bid,
          P: MockDataGenerator.generateQuote(normalizedTicker).ask,
          s: MockDataGenerator.generateQuote(normalizedTicker).bidSize,
          S: MockDataGenerator.generateQuote(normalizedTicker).askSize,
          t: Date.now(),
        }
      })
    );

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
    }>(
      url, 
      cacheKey, 
      5,
      () => ({
        status: 'OK',
        ticker: MockDataGenerator.generateSnapshot(normalizedTicker)
      })
    );

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
    }>(
      url, 
      cacheKey, 
      60, // Cache for 60 minutes (changes infrequently)
      () => ({
        status: 'OK',
        results: MockDataGenerator.generateTickerDetails(normalizedTicker)
      })
    );

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
    }>(
      url, 
      cacheKey, 
      30, // Cache for 30 minutes
      () => {
        const mockAggregates = MockDataGenerator.generateAggregates(normalizedTicker, options?.limit || 30);
        return {
          status: 'OK',
          ticker: normalizedTicker,
          results: mockAggregates,
          resultsCount: mockAggregates.length
        };
      }
    );

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
    }>(
      url, 
      cacheKey, 
      10, // Cache for 10 minutes
      () => {
        const mockNews = MockDataGenerator.generateNews(options?.ticker, options?.limit || 10);
        return {
          status: 'OK',
          results: mockNews,
          count: mockNews.length
        };
      }
    );

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
    }>(
      url, 
      cacheKey, 
      5,
      () => {
        const mockTickers = tickers || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
        const snapshots = mockTickers.map(t => MockDataGenerator.generateSnapshot(t));
        return {
          status: 'OK',
          tickers: snapshots,
          count: snapshots.length
        };
      }
    );

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
