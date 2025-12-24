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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class StockCacheService {
  /**
   * Check if we can make an API request (within daily limit)
   */
  static async canMakeRequest(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('increment_api_usage');
      
      if (error) {
        console.error('Error checking API usage:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error checking API usage:', error);
      return false;
    }
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

  /**
   * Get company overview with Supabase caching
   * This is our main method - gets comprehensive data in 1 API call
   */
  static async getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = DATA_TYPES.OVERVIEW;

    // Check cache first
    const cached = await this.getCachedData<CompanyOverview>(normalizedSymbol, dataType);
    if (cached) {
      console.log(`Cache hit for ${normalizedSymbol} overview`);
      return cached;
    }

    // Check if we can make API request
    const canRequest = await this.canMakeRequest();
    if (!canRequest) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // Call the real Alpha Vantage API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/company-overview?symbol=${normalizedSymbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MCP API call failed: ${response.statusText}`);
      }

      const mcpData = await response.json();
      
      // Transform the MCP response to our CompanyOverview format
      const overviewData: CompanyOverview = {
        Symbol: mcpData.Symbol || normalizedSymbol,
        AssetType: mcpData.AssetType || "Common Stock",
        Name: mcpData.Name || `${normalizedSymbol} Inc.`,
        Description: mcpData.Description || "Company description not available.",
        CIK: mcpData.CIK || "0000000000",
        Exchange: mcpData.Exchange || "NASDAQ",
        Currency: mcpData.Currency || "USD",
        Country: mcpData.Country || "USA",
        Sector: mcpData.Sector || "TECHNOLOGY",
        Industry: mcpData.Industry || "SOFTWARE",
        Address: mcpData.Address || "Address not available",
        FiscalYearEnd: mcpData.FiscalYearEnd || "December",
        LatestQuarter: mcpData.LatestQuarter || new Date().toISOString().split('T')[0],
        MarketCapitalization: mcpData.MarketCapitalization || "0",
        EBITDA: mcpData.EBITDA || "0",
        PERatio: mcpData.PERatio || "0",
        PEGRatio: mcpData.PEGRatio || "0",
        BookValue: mcpData.BookValue || "0",
        DividendPerShare: mcpData.DividendPerShare || "0",
        DividendYield: mcpData.DividendYield || "0",
        EPS: mcpData.EPS || "0",
        RevenuePerShareTTM: mcpData.RevenuePerShareTTM || "0",
        ProfitMargin: mcpData.ProfitMargin || "0",
        OperatingMarginTTM: mcpData.OperatingMarginTTM || "0",
        ReturnOnAssetsTTM: mcpData.ReturnOnAssetsTTM || "0",
        ReturnOnEquityTTM: mcpData.ReturnOnEquityTTM || "0",
        RevenueTTM: mcpData.RevenueTTM || "0",
        GrossProfitTTM: mcpData.GrossProfitTTM || "0",
        DilutedEPSTTM: mcpData.DilutedEPSTTM || "0",
        QuarterlyEarningsGrowthYOY: mcpData.QuarterlyEarningsGrowthYOY || "0",
        QuarterlyRevenueGrowthYOY: mcpData.QuarterlyRevenueGrowthYOY || "0",
        AnalystTargetPrice: mcpData.AnalystTargetPrice || "0",
        TrailingPE: mcpData.TrailingPE || "0",
        ForwardPE: mcpData.ForwardPE || "0",
        PriceToSalesRatioTTM: mcpData.PriceToSalesRatioTTM || "0",
        PriceToBookRatio: mcpData.PriceToBookRatio || "0",
        EVToRevenue: mcpData.EVToRevenue || "0",
        EVToEBITDA: mcpData.EVToEBITDA || "0",
        Beta: mcpData.Beta || "0",
        "52WeekHigh": mcpData["52WeekHigh"] || "0",
        "52WeekLow": mcpData["52WeekLow"] || "0",
        "50DayMovingAverage": mcpData["50DayMovingAverage"] || "0",
        "200DayMovingAverage": mcpData["200DayMovingAverage"] || "0",
        SharesOutstanding: mcpData.SharesOutstanding || "0",
        SharesFloat: mcpData.SharesFloat || "0",
        PercentInsiders: mcpData.PercentInsiders || "0",
        PercentInstitutions: mcpData.PercentInstitutions || "0",
        DividendDate: mcpData.DividendDate || "",
        ExDividendDate: mcpData.ExDividendDate || ""
      };

      // Cache the data for 15 minutes
      await this.setCachedData(normalizedSymbol, dataType, overviewData, 15);
      
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
  static async getQuote(symbol: string): Promise<Quote | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = DATA_TYPES.QUOTE;

    // Check cache first
    const cached = await this.getCachedData<Quote>(normalizedSymbol, dataType);
    if (cached) {
      console.log(`Cache hit for ${normalizedSymbol} quote`);
      return cached;
    }

    // Check if we can make API request
    const canRequest = await this.canMakeRequest();
    if (!canRequest) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // Call Alpha Vantage GLOBAL_QUOTE API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/quote?symbol=${normalizedSymbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Quote API call failed: ${response.statusText}`);
      }

      const apiData = await response.json();
      
      // Transform the response to our Quote format
      const quote: Quote = {
        symbol: apiData.symbol || normalizedSymbol,
        open: apiData.open || "0",
        high: apiData.high || "0",
        low: apiData.low || "0",
        price: apiData.price || "0",
        volume: apiData.volume || "0",
        latestDay: apiData.latestTradingDay || new Date().toISOString().split('T')[0],
        previousClose: apiData.previousClose || "0",
        change: apiData.change || "0",
        changePercent: apiData.changePercent || "0%"
      };

      // Cache the data for 5 minutes (quotes change more frequently)
      await this.setCachedData(normalizedSymbol, dataType, quote, 5);
      
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

