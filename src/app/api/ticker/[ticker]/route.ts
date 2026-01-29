import { NextRequest, NextResponse } from 'next/server';
import { getMassiveClient } from '@/lib/massiveClient';

/**
 * Generate placeholder ticker data when data is unavailable
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
    description: 'Data not currently available.',
    sector: 'N/A',
    industry: 'N/A',
    website: '',
    employees: null,
    ceo: 'N/A',
    founded: 'N/A',
    headquarters: 'N/A',
    lastUpdated: new Date().toISOString(),
    _placeholder: true,
    _message: 'Unable to fetch data from Massive API.'
  };
}

/**
 * Ticker API Route - Uses Massive API with in-memory caching
 * Gets comprehensive ticker data in a single efficient call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker: tickerParam } = await params;
    const ticker = tickerParam.toUpperCase();

    console.log(`[Ticker API] Fetching data for ${ticker} from Massive`);

    const massiveClient = getMassiveClient();

    // Fetch both snapshot and details in parallel - more efficient than Alpha Vantage!
    const [snapshot, details] = await Promise.all([
      massiveClient.getSnapshot(ticker).catch(() => null),
      massiveClient.getTickerDetails(ticker).catch(() => null),
    ]);

    // If no data available, return placeholder
    if (!snapshot && !details) {
      console.warn(`[Ticker API] No data available for ${ticker}`);
      return NextResponse.json(generatePlaceholderTickerData(ticker));
    }

    console.log(`[Ticker API] Successfully retrieved data for ${ticker}`);

    // Helper to safely parse numbers
    const parseNum = (value: any): number | null => {
      if (value === undefined || value === null) return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return Number.isFinite(num) ? num : null;
    };

    // Calculate market cap from shares outstanding and current price
    const currentPrice = snapshot?.day?.c ?? null;
    const sharesOutstanding = parseNum(details?.weighted_shares_outstanding);
    const marketCap = details?.market_cap ?? 
      (currentPrice && sharesOutstanding ? currentPrice * sharesOutstanding : null);

    // Build address string
    const address = details?.address 
      ? [
          details.address.address1,
          details.address.city,
          details.address.state,
          details.address.postal_code
        ].filter(Boolean).join(', ')
      : 'N/A';

    // Consolidate all data into a clean response
    const consolidatedData = {
      // Basic identifiers
      symbol: ticker,
      name: details?.name || `${ticker} Inc.`,
      
      // Price data from snapshot
      price: currentPrice,
      change: snapshot?.todaysChange ?? null,
      changePercent: snapshot?.todaysChangePerc ?? null,
      open: snapshot?.day?.o ?? null,
      high: snapshot?.day?.h ?? null,
      low: snapshot?.day?.l ?? null,
      previousClose: snapshot?.prevDay?.c ?? null,
      volume: parseNum(snapshot?.day?.v),
      avgVolume: null, // Not directly available
      
      // Bid/Ask from live quote
      bid: snapshot?.lastQuote?.p ?? null,
      ask: snapshot?.lastQuote?.P ?? null,

      // Key Statistics from details
      marketCap,
      peRatio: null, // Not in basic Massive data - would need fundamentals API
      eps: null, // Not in basic Massive data
      dividendYield: null, // Not in basic Massive data
      week52High: null, // Could calculate from historical data if needed
      week52Low: null, // Could calculate from historical data if needed
      targetPrice: null, // Not available in Massive

      // Company Profile
      description: details?.description || 'No description available.',
      sector: details?.sic_description || 'N/A',
      industry: details?.sic_description || 'N/A',
      website: details?.homepage_url || '',
      employees: parseNum(details?.total_employees),
      ceo: 'N/A', // Not in Massive ticker details
      founded: 'N/A', // Not in Massive ticker details
      headquarters: address,
      earningsDate: 'N/A', // Not in basic Massive data
      exDividendDate: 'N/A', // Not in basic Massive data
      currency: details?.currency_name?.toUpperCase() || 'USD',
      exchange: details?.primary_exchange || 'UNKNOWN',

      // Additional company info
      ticker_type: details?.type,
      active: details?.active ?? true,
      cik: details?.cik,
      composite_figi: details?.composite_figi,
      share_class_figi: details?.share_class_figi,
      list_date: details?.list_date,
      locale: details?.locale,
      market: details?.market,
      
      // Branding
      logo_url: details?.branding?.logo_url,
      icon_url: details?.branding?.icon_url,

      // Additional financial data - would need fundamentals API for these
      totalRevenue: null,
      grossMargins: null,
      operatingMargins: null,
      profitMargins: null,
      ebitdaMargins: null,
      sharesOutstanding,
      enterpriseValue: marketCap,
      bookValue: null,
      priceToBook: null,
      evToRevenue: null,
      evToEbitda: null,
      pegRatio: null,
      forwardPE: null,
      returnOnAssets: null,
      returnOnEquity: null,
      quarterlyRevenueGrowthYOY: null,
      quarterlyEarningsGrowthYOY: null,
      ebitda: null,
      dividendPerShare: null,
      
      // SIC code for industry classification
      sic_code: details?.sic_code,
      
      // Phone number
      phone: details?.phone_number,
      
      // Last updated
      lastUpdated: new Date().toISOString(),
      
      // Timestamp of data
      updated: snapshot?.updated ?? Date.now(),
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
