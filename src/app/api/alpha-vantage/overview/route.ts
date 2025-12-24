import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService } from '@/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Get company overview with Supabase caching
    const overview = await AlphaVantageSupabase.getCompanyOverview(symbol);

    if (!overview) {
      return NextResponse.json(
        { error: 'Failed to fetch company overview' },
        { status: 500 }
      );
    }

    // Get usage stats for debugging
    const usageStats = await AlphaVantageSupabase.getUsageStats();

    return NextResponse.json({
      data: overview,
      usage: usageStats,
      cached: true // This will be true if served from cache
    });

  } catch (error) {
    console.error('Error in overview API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
