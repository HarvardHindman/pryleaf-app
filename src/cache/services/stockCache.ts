/**
 * Stock Cache Service
 * Handles Alpha Vantage API calls with Supabase caching
 * All users share the same cache, maximizing API efficiency
 */

import { createClient } from '@supabase/supabase-js';
import {
  CompanyOverview,
  Quote,
  TimeSeriesData,
  ApiUsageStats
} from '../types';
import { CACHE_TTL, DATA_TYPES } from '../constants';
import { throttleAlphaVantage } from './alphaVantageThrottle';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_QUOTE_CACHE_MINUTES = 24 * 60; // Daily cache by default

type QuoteOptions = {
  cacheMinutes?: number;
  allowStaleFallback?: boolean;
};

export class StockCacheService {
  /**
   * Fetch JSON with a small retry to handle transient upstream failures.
   */
  private static async fetchJsonWithRetry(
    url: string,
    validate: (data: any) => void,
    // Keep attempts to 1 by default to stay under Alpha Vantage's strict 5 req/min limit
    attempts: number = 1,
    delayMs: number = 600
  ): Promise<any | null> {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        if (json && json.error) {
          throw new Error(json.error);
        }
        validate(json);
        return json;
      } catch (err) {
        if (i === attempts - 1) {
          console.warn(`fetchJsonWithRetry failed for ${url}:`, err instanceof Error ? err.message : err);
          return null;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return null;
  }

  /**
   * Decide if we can make a live request (Alpha Vantage key present)
   */
  static async canMakeRequest(): Promise<boolean> {
    return Boolean(process.env.ALPHA_VANTAGE_API_KEY);
  }

  /**
   * Get cached data from Supabase
   */
  static async getCachedData<T>(symbol: string, dataType: string): Promise<T | null> {
    try {
      const { data, error } = await supabase.rpc('get_cached_stock_data', {
        p_symbol: symbol.toUpperCase(),
        p_data_type: dataType
      });

      if (error) {
        console.error('Error getting cached data:', error);
        return null;
      }

      return data && data !== 'null' ? data as T : null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Set cached data in Supabase
   */
  static async setCachedData<T>(
    symbol: string, 
    dataType: string, 
    data: T, 
    cacheDurationMinutes: number = 15
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_cached_stock_data', {
        p_symbol: symbol.toUpperCase(),
        p_data_type: dataType,
        p_data: data,
        p_cache_duration_minutes: cacheDurationMinutes
      });

      if (error) {
        console.error('Error setting cached data:', error);
      }
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  // API usage tracking disabled
  static async checkApiUsage(): Promise<{ remaining: number; used: number; limit: number } | null> {
    return { remaining: 0, used: 0, limit: 0 };
  }

  /**
   * Get ANY cached data (even expired) as last resort
   */
  static async getAnyCachedData<T>(symbol: string, dataType: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('stock_quotes_cache')
        .select('data')
        .eq('symbol', symbol.toUpperCase())
        .eq('data_type', dataType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.data as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get company overview with Supabase caching
   * This is our main method - gets comprehensive data in 1 API call
   */
  static async getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = DATA_TYPES.OVERVIEW;

    const cached = await this.getCachedData<CompanyOverview>(normalizedSymbol, dataType);
    if (cached) {
      console.log(`✅ Cache hit for ${normalizedSymbol} overview`);
      return cached;
    }

    // No cache; attempt live fetch if allowed
    const canRequest = await this.canMakeRequest();
    if (!canRequest) {
      console.warn(`⚠️ No cached overview for ${normalizedSymbol} and live fetch disabled (missing API key)`);
      return null;
    }

    try {
      // Throttle to avoid Alpha Vantage rate limits
      await throttleAlphaVantage();
      
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/company-overview?symbol=${normalizedSymbol}`;
      const apiData = await this.fetchJsonWithRetry(
        apiUrl,
        (d) => {
          if (!d.Symbol) {
            throw new Error('Missing Symbol in overview payload');
          }
        }
      );
      if (!apiData) {
        // Try stale cache as a last resort to avoid an empty first load
        const stale = await this.getAnyCachedData<CompanyOverview>(normalizedSymbol, dataType);
        if (stale) {
          console.warn(`Using stale overview cache for ${normalizedSymbol} after live fetch failure`);
          return stale;
        }
        return null;
      }
      
      const safe = (value: any, fallback: string = 'N/A') =>
        value === undefined || value === null || value === '' ? fallback : value;

      const overviewData: CompanyOverview = {
        Symbol: normalizedSymbol,
        AssetType: safe(apiData.AssetType),
        Name: safe(apiData.Name, `${normalizedSymbol} Inc.`),
        Description: safe(apiData.Description),
        CIK: safe(apiData.CIK),
        Exchange: safe(apiData.Exchange),
        Currency: safe(apiData.Currency, 'USD'),
        Country: safe(apiData.Country),
        Sector: safe(apiData.Sector),
        Industry: safe(apiData.Industry),
        Address: safe(apiData.Address),
        FiscalYearEnd: safe(apiData.FiscalYearEnd, 'December'),
        LatestQuarter: safe(apiData.LatestQuarter, new Date().toISOString().split('T')[0]),
        MarketCapitalization: safe(apiData.MarketCapitalization),
        EBITDA: safe(apiData.EBITDA),
        PERatio: safe(apiData.PERatio),
        PEGRatio: safe(apiData.PEGRatio),
        BookValue: safe(apiData.BookValue),
        DividendPerShare: safe(apiData.DividendPerShare),
        DividendYield: safe(apiData.DividendYield),
        EPS: safe(apiData.EPS),
        RevenuePerShareTTM: safe(apiData.RevenuePerShareTTM),
        ProfitMargin: safe(apiData.ProfitMargin),
        OperatingMarginTTM: safe(apiData.OperatingMarginTTM),
        ReturnOnAssetsTTM: safe(apiData.ReturnOnAssetsTTM),
        ReturnOnEquityTTM: safe(apiData.ReturnOnEquityTTM),
        RevenueTTM: safe(apiData.RevenueTTM),
        GrossProfitTTM: safe(apiData.GrossProfitTTM),
        DilutedEPSTTM: safe(apiData.DilutedEPSTTM),
        QuarterlyEarningsGrowthYOY: safe(apiData.QuarterlyEarningsGrowthYOY),
        QuarterlyRevenueGrowthYOY: safe(apiData.QuarterlyRevenueGrowthYOY),
        AnalystTargetPrice: safe(apiData.AnalystTargetPrice),
        TrailingPE: safe(apiData.TrailingPE),
        ForwardPE: safe(apiData.ForwardPE),
        PriceToSalesRatioTTM: safe(apiData.PriceToSalesRatioTTM),
        PriceToBookRatio: safe(apiData.PriceToBookRatio),
        EVToRevenue: safe(apiData.EVToRevenue),
        EVToEBITDA: safe(apiData.EVToEBITDA),
        Beta: safe(apiData.Beta),
        "52WeekHigh": safe(apiData["52WeekHigh"]),
        "52WeekLow": safe(apiData["52WeekLow"]),
        "50DayMovingAverage": safe(apiData["50DayMovingAverage"]),
        "200DayMovingAverage": safe(apiData["200DayMovingAverage"]),
        SharesOutstanding: safe(apiData.SharesOutstanding),
        SharesFloat: safe(apiData.SharesFloat),
        PercentInsiders: safe(apiData.PercentInsiders),
        PercentInstitutions: safe(apiData.PercentInstitutions),
        DividendDate: safe(apiData.DividendDate, 'N/A'),
        ExDividendDate: safe(apiData.ExDividendDate, 'N/A')
      };

      // Cache overview for 24 hours (slow-changing)
      await this.setCachedData(normalizedSymbol, dataType, overviewData, 24 * 60);
      console.log(`Real API call made for ${normalizedSymbol} overview`);
      return overviewData;

    } catch (error) {
      console.error('Error fetching company overview:', error);
      return null;
    }
  }

  /**
   * Get real-time quote with Supabase caching
   */
  static async getQuote(symbol: string, options: QuoteOptions = {}): Promise<Quote | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = DATA_TYPES.QUOTE;
    const cacheMinutes = options.cacheMinutes ?? DEFAULT_QUOTE_CACHE_MINUTES;
    const allowStaleFallback = options.allowStaleFallback ?? true;

    const cached = await this.getCachedData<Quote>(normalizedSymbol, dataType);
    if (cached) {
      console.log(`✅ Cache hit for ${normalizedSymbol} quote`);
      return cached;
    }

    const canRequest = await this.canMakeRequest();
    if (!canRequest) {
      console.warn(`⚠️ No cached quote for ${normalizedSymbol} and live fetch disabled (missing API key)`);
      if (allowStaleFallback) {
        const stale = await this.getAnyCachedData<Quote>(normalizedSymbol, dataType);
        if (stale) {
          console.warn(`Using stale quote cache for ${normalizedSymbol} because live fetch is unavailable`);
          return stale;
        }
      }
      return null;
    }

    try {
      // Throttle to avoid Alpha Vantage rate limits
      await throttleAlphaVantage();
      
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/quote?symbol=${normalizedSymbol}`;
      const apiData = await this.fetchJsonWithRetry(
        apiUrl,
        (d) => {
          if (!d.symbol) {
            throw new Error('Missing symbol in quote payload');
          }
        }
      );
      if (!apiData) {
        // Try stale cache as a last resort to avoid an empty first load
        if (allowStaleFallback) {
          const stale = await this.getAnyCachedData<Quote>(normalizedSymbol, dataType);
          if (stale) {
            console.warn(`Using stale quote cache for ${normalizedSymbol} after live fetch failure`);
            return stale;
          }
        }
        return null;
      }
      
      const quote: Quote = {
        symbol: apiData.symbol || normalizedSymbol,
        open: apiData.open ?? 'N/A',
        high: apiData.high ?? 'N/A',
        low: apiData.low ?? 'N/A',
        price: apiData.price ?? 'N/A',
        volume: apiData.volume ?? 'N/A',
        latestDay: apiData.latestTradingDay ?? new Date().toISOString().split('T')[0],
        previousClose: apiData.previousClose ?? 'N/A',
        change: apiData.change ?? 'N/A',
        changePercent: apiData.changePercent ?? 'N/A'
      };

      // Cache quote for the requested duration (default: daily)
      await this.setCachedData(normalizedSymbol, dataType, quote, cacheMinutes);
      console.log(`Real API call made for ${normalizedSymbol} quote`);
      return quote;

    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  /**
   * Get historical time series data with Supabase caching
   * Caches data for 1 hour as requested
   */
  static async getTimeSeries(
    symbol: string, 
    interval: 'daily' | 'weekly' | 'monthly' | 'intraday' = 'daily',
    outputsize: 'compact' | 'full' = 'compact'
  ): Promise<TimeSeriesData[] | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = `timeseries_${interval}_${outputsize}`;

    // Check cache first
    const cached = await this.getCachedData<TimeSeriesData[]>(normalizedSymbol, dataType);
    if (cached) {
      console.log(`Cache hit for ${normalizedSymbol} ${dataType}`);
      return cached;
    }

    // Check if we can make API request
    const canRequest = await this.canMakeRequest();
    if (!canRequest) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // Call Alpha Vantage Time Series API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/time-series?symbol=${normalizedSymbol}&interval=${interval}&outputsize=${outputsize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Time series API call failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      
      if (!apiData.data || !Array.isArray(apiData.data)) {
        throw new Error('Invalid time series data format');
      }

      const timeSeries: TimeSeriesData[] = apiData.data;

      // Cache historical data for 1 hour (60 minutes) as requested
      await this.setCachedData(normalizedSymbol, dataType, timeSeries, 60);
      
      console.log(`Real API call made for ${normalizedSymbol} ${dataType} - ${timeSeries.length} data points`);
      return timeSeries;

    } catch (error) {
      console.error('Error fetching time series:', error);
      return null;
    }
  }

  /**
   * Get API usage statistics
   */
  static async getUsageStats(): Promise<ApiUsageStats | null> {
    try {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (error) {
        console.error('Error getting usage stats:', error);
        return null;
      }

      return {
        used: data.requests_used,
        remaining: data.requests_limit - data.requests_used,
        limit: data.requests_limit,
        resetDate: data.date
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return null;
    }
  }

  /**
   * Clear cache for a specific symbol and data type
   */
  static async clearCache(symbol?: string, dataType?: string): Promise<void> {
    try {
      let query = supabase.from('stock_cache').delete();

      if (symbol) {
        query = query.eq('symbol', symbol.toUpperCase());
      }
      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { error } = await query;
      if (error) {
        console.error('Error clearing cache:', error);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Transform Alpha Vantage data to match your existing TickerData interface
   */
  static transformToTickerData(overview: CompanyOverview, quote?: Quote): any {
    const currentPrice = quote ? parseFloat(quote.price) : 
      (parseFloat(overview.MarketCapitalization) / parseFloat(overview.SharesOutstanding));

    return {
      symbol: overview.Symbol,
      name: overview.Name,
      price: currentPrice,
      change: quote ? parseFloat(quote.change) : 0,
      changePercent: quote ? parseFloat(quote.changePercent.replace('%', '')) : 0,
      volume: quote ? parseInt(quote.volume) : 0,
      marketCap: parseFloat(overview.MarketCapitalization),
      peRatio: parseFloat(overview.PERatio),
      week52High: parseFloat(overview["52WeekHigh"]),
      week52Low: parseFloat(overview["52WeekLow"]),
      avgVolume: 0, // Not available in overview
      open: quote ? parseFloat(quote.open) : 0,
      high: quote ? parseFloat(quote.high) : parseFloat(overview["52WeekHigh"]),
      low: quote ? parseFloat(quote.low) : parseFloat(overview["52WeekLow"]),
      previousClose: quote ? parseFloat(quote.previousClose) : 0,
      dividendYield: parseFloat(overview.DividendYield),
      earningsDate: overview.LatestQuarter,
      exDividendDate: overview.ExDividendDate,
      targetPrice: parseFloat(overview.AnalystTargetPrice),
      description: overview.Description,
      sector: overview.Sector,
      industry: overview.Industry,
      website: '', // Not in overview
      employees: 0, // Not in overview
      ceo: '', // Not in overview
      founded: '', // Not in overview
      headquarters: overview.Address,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export legacy name for backward compatibility during migration
export const AlphaVantageSupabase = StockCacheService;

