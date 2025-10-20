/**
 * Server-side Alpha Vantage service using MCP
 * This runs on the server and can access MCP functions
 */

// This would be imported from your MCP setup
// For now, we'll create a mock implementation

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

// Cache for server-side requests
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Track daily API usage
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
}

function canMakeRequest(): boolean {
  resetDailyCounter();
  return dailyRequestCount < 25;
}

function getCachedData<T>(key: string): T | null {
  const cached = serverCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  serverCache.set(key, { data, timestamp: Date.now() });
}

export class AlphaVantageServer {
  /**
   * Get company overview using MCP
   * This is the main method - gets comprehensive data in 1 API call
   */
  static async getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const cacheKey = `overview_${symbol.toUpperCase()}`;
    
    // Check cache first
    const cached = getCachedData<CompanyOverview>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!canMakeRequest()) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // This is where you would call the MCP function
      // For now, we'll use a mock response
      const mockData: CompanyOverview = {
        Symbol: symbol.toUpperCase(),
        AssetType: "Common Stock",
        Name: `${symbol.toUpperCase()} Inc.`,
        Description: "A leading technology company focused on innovation and growth.",
        CIK: "0000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA",
        Sector: "TECHNOLOGY",
        Industry: "SOFTWARE",
        Address: "123 Main St, City, State, USA",
        FiscalYearEnd: "December",
        LatestQuarter: "2024-09-30",
        MarketCapitalization: "1000000000000",
        EBITDA: "50000000000",
        PERatio: "25.5",
        PEGRatio: "1.2",
        BookValue: "15.5",
        DividendPerShare: "1.0",
        DividendYield: "0.02",
        EPS: "4.5",
        RevenuePerShareTTM: "25.0",
        ProfitMargin: "0.18",
        OperatingMarginTTM: "0.25",
        ReturnOnAssetsTTM: "0.12",
        ReturnOnEquityTTM: "0.28",
        RevenueTTM: "100000000000",
        GrossProfitTTM: "60000000000",
        DilutedEPSTTM: "4.5",
        QuarterlyEarningsGrowthYOY: "0.15",
        QuarterlyRevenueGrowthYOY: "0.08",
        AnalystTargetPrice: "150.0",
        TrailingPE: "25.5",
        ForwardPE: "22.0",
        PriceToSalesRatioTTM: "10.0",
        PriceToBookRatio: "8.5",
        EVToRevenue: "9.5",
        EVToEBITDA: "20.0",
        Beta: "1.2",
        "52WeekHigh": "160.0",
        "52WeekLow": "120.0",
        "50DayMovingAverage": "145.0",
        "200DayMovingAverage": "140.0",
        SharesOutstanding: "1000000000",
        SharesFloat: "950000000",
        PercentInsiders: "5.0",
        PercentInstitutions: "65.0",
        DividendDate: "2024-12-15",
        ExDividendDate: "2024-12-10"
      };

      dailyRequestCount++;
      setCachedData(cacheKey, mockData);
      return mockData;

    } catch (error) {
      console.error('Error fetching company overview:', error);
      return null;
    }
  }

  /**
   * Get real-time quote using MCP
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    const cacheKey = `quote_${symbol.toUpperCase()}`;
    
    const cached = getCachedData<Quote>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!canMakeRequest()) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // This is where you would call the MCP function
      const mockQuote: Quote = {
        symbol: symbol.toUpperCase(),
        open: "150.00",
        high: "155.00",
        low: "148.00",
        price: "152.50",
        volume: "1000000",
        latestDay: new Date().toISOString().split('T')[0],
        previousClose: "150.00",
        change: "2.50",
        changePercent: "1.67%"
      };

      dailyRequestCount++;
      setCachedData(cacheKey, mockQuote);
      return mockQuote;

    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  /**
   * Get historical time series data using MCP
   */
  static async getTimeSeries(symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<TimeSeriesData[] | null> {
    const cacheKey = `timeseries_${symbol.toUpperCase()}_${interval}`;
    
    const cached = getCachedData<TimeSeriesData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!canMakeRequest()) {
      console.warn('Daily API limit reached (25 requests)');
      return null;
    }

    try {
      // This is where you would call the MCP function
      const mockTimeSeries: TimeSeriesData[] = [
        {
          timestamp: "2024-10-17",
          open: "150.00",
          high: "155.00",
          low: "148.00",
          close: "152.50",
          volume: "1000000"
        },
        {
          timestamp: "2024-10-16",
          open: "148.00",
          high: "151.00",
          low: "147.00",
          close: "150.00",
          volume: "950000"
        }
      ];

      dailyRequestCount++;
      setCachedData(cacheKey, mockTimeSeries);
      return mockTimeSeries;

    } catch (error) {
      console.error('Error fetching time series:', error);
      return null;
    }
  }

  /**
   * Get usage statistics
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
   * Clear server cache
   */
  static clearCache(): void {
    serverCache.clear();
  }
}
