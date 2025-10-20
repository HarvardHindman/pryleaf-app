import { NextRequest, NextResponse } from 'next/server';
import { AlphaVantageSupabase, CompanyOverview, Quote } from '@/lib/alphaVantageSupabase';

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
      AlphaVantageSupabase.getCompanyOverview(ticker),
      AlphaVantageSupabase.getQuote(ticker)
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

    // Consolidate all data into a clean response matching the existing interface
    const consolidatedData = {
      // Header Section Data
      companyName: overview?.Name || `${ticker} Inc.`,
      ticker: ticker,
      currentPrice: currentPrice,
      dailyChange: dailyChange,
      dailyChangePercent: dailyChangePercent,
      currency: overview?.Currency || 'USD',

      // Key Statistics
      marketCap: overview ? parseFloat(overview.MarketCapitalization) : 0,
      peRatio: overview ? parseFloat(overview.PERatio) : 0,
      eps: overview ? parseFloat(overview.EPS) : 0,
      dividendYield: overview ? parseFloat(overview.DividendYield) : 0,
      fiftyTwoWeekHigh: overview ? parseFloat(overview["52WeekHigh"]) : 0,
      fiftyTwoWeekLow: overview ? parseFloat(overview["52WeekLow"]) : 0,
      averageVolume: 0, // Not available in Alpha Vantage overview
      volume: quote ? parseInt(quote.volume) : 0,

      // Company Profile
      businessSummary: overview?.Description || 'No description available.',
      sector: overview?.Sector || 'N/A',
      industry: overview?.Industry || 'N/A',
      website: '', // Not in Alpha Vantage overview
      employees: 0, // Not in Alpha Vantage overview

      // Additional financial data
      totalRevenue: overview ? parseFloat(overview.RevenueTTM) : 0,
      grossMargins: overview ? parseFloat(overview.GrossProfitTTM) / parseFloat(overview.RevenueTTM) : 0,
      operatingMargins: overview ? parseFloat(overview.OperatingMarginTTM) : 0,
      profitMargins: overview ? parseFloat(overview.ProfitMargin) : 0,

      // Exchange info
      exchange: overview?.Exchange || 'NASDAQ',
      exchangeTimezoneName: 'America/New_York', // Default
      
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
