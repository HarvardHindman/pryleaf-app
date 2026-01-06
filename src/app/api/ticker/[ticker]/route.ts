import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService, CompanyOverview, Quote } from '@/cache';

/**
 * Generate placeholder ticker data when cache is empty
 */
function generatePlaceholderTickerData(ticker: string) {
  return {
    symbol: ticker,
    name: `${ticker} Inc.`,
    price: null,
    change: null,
    changePercent: null,
    volume: null,
    marketCap: null,
    peRatio: null,
    week52High: null,
    week52Low: null,
    avgVolume: null,
    open: null,
    high: null,
    low: null,
    previousClose: null,
    dividendYield: null,
    earningsDate: null,
    exDividendDate: null,
    targetPrice: null,
    description: 'Data not currently available. This ticker has not been cached yet.',
    sector: 'N/A',
    industry: 'N/A',
    website: '',
    employees: null,
    ceo: 'N/A',
    founded: 'N/A',
    headquarters: 'N/A',
    lastUpdated: new Date().toISOString(),
    _placeholder: true,
    _message: 'Data not cached. Real-time API fetching is currently disabled.'
  };
}

/**
 * Ticker API Route - Uses Alpha Vantage with Supabase caching
 * Replaces Yahoo Finance with cached Alpha Vantage data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker: tickerParam } = await params;
    const ticker = tickerParam.toUpperCase();

    console.log(`[Ticker API] Fetching data for ${ticker}`);

    // Fetch company overview and quote with cache; tolerate partial failures
    const [overviewResult, quoteResult] = await Promise.allSettled([
      StockCacheService.getCompanyOverview(ticker),
      StockCacheService.getQuote(ticker)
    ]);

    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;

    // If no data at all (not even cached), return placeholder data
    if (!overview && !quote) {
      console.warn(`[Ticker API] No cached data found for ${ticker} - returning placeholder`);
      const placeholderData = generatePlaceholderTickerData(ticker);
      return NextResponse.json(placeholderData);
    }

    console.log(`[Ticker API] Successfully retrieved data for ${ticker}`);

    // Helper to parse numeric values safely
    const parseNum = (value: string | undefined): number | null => {
      if (!value || value === 'None' || value === 'N/A') return null;
      const num = parseFloat(value);
      return Number.isFinite(num) ? num : null;
    };
    const safeMul = (a: number | null, b: number | null): number | null =>
      a !== null && b !== null && Number.isFinite(a) && Number.isFinite(b) ? a * b : null;

    // Calculate current price from available data
    const currentPrice = quote && quote.price !== 'N/A'
      ? parseFloat(quote.price)
      : (overview && parseFloat(overview.MarketCapitalization) > 0 && parseFloat(overview.SharesOutstanding) > 0)
        ? parseFloat(overview.MarketCapitalization) / parseFloat(overview.SharesOutstanding)
        : null;

    const dailyChange = quote && quote.change !== 'N/A' ? parseFloat(quote.change) : null;
    const dailyChangePercent = quote && quote.changePercent && quote.changePercent !== 'N/A'
      ? parseFloat(quote.changePercent.replace('%', ''))
      : null;

    const sharesOutstanding = parseNum(overview?.SharesOutstanding);
    const overviewCap = parseNum(overview?.MarketCapitalization);
    const marketCapFromPrice = safeMul(sharesOutstanding, currentPrice);
    // Prefer live price * shares if available; otherwise fall back to overview cap
    const marketCap = marketCapFromPrice ?? overviewCap;

    // Consolidate all data into a clean response matching the TickerData interface
    const consolidatedData = {
      // Basic identifiers
      symbol: ticker,
      name: overview?.Name || `${ticker} Inc.`,
      
      // Price data
      price: currentPrice,
      change: dailyChange,
      changePercent: dailyChangePercent,
      open: quote && quote.open !== 'N/A' ? parseFloat(quote.open) : null,
      high: quote && quote.high !== 'N/A' ? parseFloat(quote.high) : null,
      low: quote && quote.low !== 'N/A' ? parseFloat(quote.low) : null,
      previousClose: quote && quote.previousClose !== 'N/A' ? parseFloat(quote.previousClose) : null,
      volume: quote && quote.volume !== 'N/A' ? parseInt(quote.volume) : null,
      avgVolume: null, // Not available in Alpha Vantage overview

      // Key Statistics
      marketCap,
      peRatio: parseNum(overview?.PERatio),
      eps: parseNum(overview?.EPS),
      dividendYield: parseNum(overview?.DividendYield),
      week52High: parseNum(overview?.["52WeekHigh"]),
      week52Low: parseNum(overview?.["52WeekLow"]),
      targetPrice: parseNum(overview?.AnalystTargetPrice),

      // Company Profile
      description: overview?.Description || 'No description available.',
      sector: overview?.Sector || 'N/A',
      industry: overview?.Industry || 'N/A',
      website: '', // Not in Alpha Vantage overview
      employees: overview ? parseNum(overview.Employees as unknown as string) : null, // likely unavailable
      ceo: 'N/A', // Not in Alpha Vantage overview
      founded: 'N/A', // Not in Alpha Vantage overview
      headquarters: overview?.Address || 'N/A',
      earningsDate: overview?.LatestQuarter || 'N/A',
      exDividendDate: overview?.ExDividendDate || 'N/A',
      currency: overview?.Currency || 'USD',
      exchange: overview?.Exchange || 'NASDAQ',

      // Additional financial data
      totalRevenue: parseNum(overview?.RevenueTTM),
      grossMargins: overview && parseNum(overview.GrossProfitTTM) && parseNum(overview.RevenueTTM) 
        ? parseNum(overview.GrossProfitTTM)! / parseNum(overview.RevenueTTM)! : null,
      operatingMargins: parseNum(overview?.OperatingMarginTTM),
      profitMargins: parseNum(overview?.ProfitMargin),
      ebitdaMargins: overview && parseNum(overview.EBITDA) && parseNum(overview.RevenueTTM)
        ? parseNum(overview.EBITDA)! / parseNum(overview.RevenueTTM)! : null,

      // Extended company statistics
      sharesOutstanding,
      enterpriseValue: marketCap ?? null,
      bookValue: parseNum(overview?.BookValue),
      priceToBook: parseNum(overview?.PriceToBookRatio),
      evToRevenue: parseNum(overview?.EVToRevenue),
      evToEbitda: parseNum(overview?.EVToEBITDA),
      pegRatio: parseNum(overview?.PEGRatio),
      forwardPE: parseNum(overview?.ForwardPE),
      
      // Returns
      returnOnAssets: parseNum(overview?.ReturnOnAssetsTTM),
      returnOnEquity: parseNum(overview?.ReturnOnEquityTTM),
      
      // Growth metrics
      quarterlyRevenueGrowthYOY: parseNum(overview?.QuarterlyRevenueGrowthYOY),
      quarterlyEarningsGrowthYOY: parseNum(overview?.QuarterlyEarningsGrowthYOY),
      
      // Financial health
      ebitda: parseNum(overview?.EBITDA),
      
      // Dividends
      dividendPerShare: parseNum(overview?.DividendPerShare),
      
      // Last updated
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(consolidatedData);

  } catch (error) {
    console.error('Error fetching ticker data:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
