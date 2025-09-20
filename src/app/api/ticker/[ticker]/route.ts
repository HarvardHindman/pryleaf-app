import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker: tickerParam } = await params;
    const ticker = tickerParam.toUpperCase();

    // Fetch quote data (price, change, market cap, etc.)
    const quote = await yahooFinance.quote(ticker);
    
    // Fetch additional summary profile data (company description, etc.)
    const summaryProfile = await yahooFinance.quoteSummary(ticker, {
      modules: ['summaryProfile', 'defaultKeyStatistics', 'financialData']
    });

    // Extract the data we need
    const quoteData = quote;
    const profile = summaryProfile.summaryProfile;
    const keyStats = summaryProfile.defaultKeyStatistics;
    const financialData = summaryProfile.financialData;

    // Consolidate all data into a clean response
    const consolidatedData = {
      // Header Section Data
      companyName: quoteData.displayName || quoteData.longName || quoteData.shortName,
      ticker: quoteData.symbol,
      currentPrice: quoteData.regularMarketPrice,
      dailyChange: quoteData.regularMarketChange,
      dailyChangePercent: quoteData.regularMarketChangePercent,
      currency: quoteData.currency,

      // Key Statistics
      marketCap: quoteData.marketCap,
      peRatio: quoteData.trailingPE,
      eps: quoteData.epsTrailingTwelveMonths,
      dividendYield: (quoteData as any).dividendYield,
      fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
      averageVolume: (quoteData as any).averageVolume,
      volume: quoteData.regularMarketVolume,

      // Company Profile
      businessSummary: profile?.longBusinessSummary,
      sector: profile?.sector,
      industry: profile?.industry,
      website: profile?.website,
      employees: profile?.fullTimeEmployees,

      // Additional financial data
      totalRevenue: financialData?.totalRevenue,
      grossMargins: financialData?.grossMargins,
      operatingMargins: financialData?.operatingMargins,
      profitMargins: financialData?.profitMargins,

      // Exchange info
      exchange: quoteData.fullExchangeName,
      exchangeTimezoneName: quoteData.exchangeTimezoneName,
      
      // Last updated
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(consolidatedData);

  } catch (error) {
    console.error('Error fetching ticker data:', error);
    
    // Return appropriate error response
    if (error instanceof Error && error.message.includes('No data found')) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}