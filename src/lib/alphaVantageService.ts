/**
 * Alpha Vantage API Service
 * Optimized for 25 requests/day limit
 */

export interface AlphaVantageCompanyOverview {
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

export interface AlphaVantageQuote {
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

export interface AlphaVantageTimeSeries {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Cache for API responses (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Track daily API usage
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

// Reset daily counter if new day
function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
}

// Check if we can make API request
function canMakeRequest(): boolean {
  resetDailyCounter();
  return dailyRequestCount < 25;
}

// Get cached data if available and fresh
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Set cache data
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Make API request with rate limiting
async function makeApiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!canMakeRequest()) {
    console.warn('Daily API limit reached (25 requests)');
    return null;
  }

  try {
    // For now, we'll use the MCP function directly
    // In production, you'd call your API endpoint that uses Alpha Vantage
    console.log(`Making API request: ${endpoint}`, params);
    dailyRequestCount++;
    
    // This would be replaced with actual API call
    // const response = await fetch(`/api/alpha-vantage/${endpoint}?${new URLSearchParams(params)}`);
    // return await response.json();
    
    return null; // Placeholder
  } catch (error) {
    console.error('API request failed:', error);
    return null;
  }
}

export class AlphaVantageService {
  /**
   * Get comprehensive company data (1 API call gets everything)
   * This is our main method - use this instead of multiple calls
   */
  static async getCompanyOverview(symbol: string): Promise<AlphaVantageCompanyOverview | null> {
    const cacheKey = `overview_${symbol.toUpperCase()}`;
    
    // Check cache first
    const cached = getCachedData<AlphaVantageCompanyOverview>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make API request
    const data = await makeApiRequest<AlphaVantageCompanyOverview>('company-overview', { symbol });
    if (data) {
      setCachedData(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Get real-time quote (use sparingly - prefer company overview)
   */
  static async getQuote(symbol: string): Promise<AlphaVantageQuote | null> {
    const cacheKey = `quote_${symbol.toUpperCase()}`;
    
    const cached = getCachedData<AlphaVantageQuote>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await makeApiRequest<AlphaVantageQuote>('quote', { symbol });
    if (data) {
      setCachedData(cacheKey, data);
    }
    
    return data;
  }

  /**
   * Get historical data (use sparingly - cache for longer)
   */
  static async getTimeSeries(symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AlphaVantageTimeSeries[] | null> {
    const cacheKey = `timeseries_${symbol.toUpperCase()}_${interval}`;
    
    const cached = getCachedData<AlphaVantageTimeSeries[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await makeApiRequest<AlphaVantageTimeSeries[]>(`time-series-${interval}`, { symbol });
    if (data) {
      // Cache historical data for longer (1 hour)
      cache.set(cacheKey, { data, timestamp: Date.now() });
    }
    
    return data;
  }

  /**
   * Get remaining daily requests
   */
  static getRemainingRequests(): number {
    resetDailyCounter();
    return Math.max(0, 25 - dailyRequestCount);
  }

  /**
   * Get API usage stats
   */
  static getUsageStats() {
    resetDailyCounter();
    return {
      used: dailyRequestCount,
      remaining: 25 - dailyRequestCount,
      limit: 25,
      resetDate: lastResetDate
    };
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  static clearCache(): void {
    cache.clear();
  }
}

// Transform Alpha Vantage data to match your existing TickerData interface
export function transformToTickerData(overview: AlphaVantageCompanyOverview): any {
  return {
    symbol: overview.Symbol,
    name: overview.Name,
    price: parseFloat(overview.MarketCapitalization) / parseFloat(overview.SharesOutstanding), // Calculate from market cap
    change: 0, // Would need quote data for this
    changePercent: 0, // Would need quote data for this
    volume: 0, // Would need quote data for this
    marketCap: parseFloat(overview.MarketCapitalization),
    peRatio: parseFloat(overview.PERatio),
    week52High: parseFloat(overview["52WeekHigh"]),
    week52Low: parseFloat(overview["52WeekLow"]),
    avgVolume: 0, // Not available in overview
    open: 0, // Would need quote data
    high: parseFloat(overview["52WeekHigh"]),
    low: parseFloat(overview["52WeekLow"]),
    previousClose: 0, // Would need quote data
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
