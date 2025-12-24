import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService, CompanyOverview, Quote } from '@/cache';

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

    // Fetch company overview and quote from Alpha Vantage (with caching)
    const [overview, quote] = await Promise.all([
      StockCacheService.getCompanyOverview(ticker),
      StockCacheService.getQuote(ticker)
    ]);

    if (!overview && !quote) {
      return NextResponse.json(
        { error: 'Unable to fetch ticker data. Please try again later.' },
        { status: 404 }
      );
    }

    // Calculate current price from available data
    const currentPrice = quote ? parseFloat(quote.price) : 
      (overview && parseFloat(overview.MarketCapitalization) > 0 && parseFloat(overview.SharesOutstanding) > 0) ?
      (parseFloat(overview.MarketCapitalization) / parseFloat(overview.SharesOutstanding)) : 0;

    const dailyChange = quote ? parseFloat(quote.change) : 0;
    const dailyChangePercent = quote ? parseFloat(quote.changePercent.replace('%', '')) : 0;

    // Helper function to parse numeric values safely
    const parseNum = (value: string | undefined): number | undefined => {
      if (!value || value === 'None') return undefined;
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    };

    // Consolidate all data into a clean response matching the TickerData interface
    const consolidatedData = {
      // Basic identifiers
      symbol: ticker,
      name: overview?.Name || `${ticker} Inc.`,
      
      // Price data
      price: currentPrice,
      change: dailyChange,
      changePercent: dailyChangePercent,
      open: quote ? parseFloat(quote.open) : 0,
      high: quote ? parseFloat(quote.high) : 0,
      low: quote ? parseFloat(quote.low) : 0,
      previousClose: quote ? parseFloat(quote.previousClose) : 0,
      volume: quote ? parseInt(quote.volume) : 0,
      avgVolume: 0, // Not available in Alpha Vantage overview

      // Key Statistics
      marketCap: parseNum(overview?.MarketCapitalization) || 0,
      peRatio: parseNum(overview?.PERatio) || 0,
      eps: parseNum(overview?.EPS),
      dividendYield: parseNum(overview?.DividendYield) || 0,
      week52High: parseNum(overview?.["52WeekHigh"]) || 0,
      week52Low: parseNum(overview?.["52WeekLow"]) || 0,
      targetPrice: parseNum(overview?.AnalystTargetPrice) || 0,

      // Company Profile
      description: overview?.Description || 'No description available.',
      sector: overview?.Sector || 'N/A',
      industry: overview?.Industry || 'N/A',
      website: '', // Not in Alpha Vantage overview
      employees: 0, // Not in Alpha Vantage overview
      ceo: '', // Not in Alpha Vantage overview
      founded: '', // Not in Alpha Vantage overview
      headquarters: overview?.Address || '',
      earningsDate: overview?.LatestQuarter || '',
      exDividendDate: overview?.ExDividendDate || '',
      currency: overview?.Currency || 'USD',
      exchange: overview?.Exchange || 'NASDAQ',

      // Additional financial data
      totalRevenue: parseNum(overview?.RevenueTTM),
      grossMargins: overview && parseNum(overview.GrossProfitTTM) && parseNum(overview.RevenueTTM) 
        ? parseNum(overview.GrossProfitTTM)! / parseNum(overview.RevenueTTM)! : undefined,
      operatingMargins: parseNum(overview?.OperatingMarginTTM),
      profitMargins: parseNum(overview?.ProfitMargin),
      ebitdaMargins: overview && parseNum(overview.EBITDA) && parseNum(overview.RevenueTTM)
        ? parseNum(overview.EBITDA)! / parseNum(overview.RevenueTTM)! : undefined,

      // Extended company statistics
      sharesOutstanding: parseNum(overview?.SharesOutstanding),
      enterpriseValue: overview && parseNum(overview.MarketCapitalization) && parseNum(overview.EBITDA)
        ? parseNum(overview.MarketCapitalization) : undefined,
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
