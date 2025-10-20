import { NextRequest, NextResponse } from 'next/server';
import { AlphaVantageSupabase } from '@/lib/alphaVantageSupabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker: tickerParam } = await params;
    const ticker = tickerParam.toUpperCase();

    // Get both overview and quote data
    const [overview, quote] = await Promise.all([
      AlphaVantageSupabase.getCompanyOverview(ticker),
      AlphaVantageSupabase.getQuote(ticker)
    ]);

    if (!overview) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    // Transform to your existing TickerData format
    const tickerData = AlphaVantageSupabase.transformToTickerData(overview, quote);

    // Get usage stats
    const usageStats = await AlphaVantageSupabase.getUsageStats();

    return NextResponse.json({
      ...tickerData,
      usage: usageStats
    });

  } catch (error) {
    console.error('Error fetching ticker data:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
