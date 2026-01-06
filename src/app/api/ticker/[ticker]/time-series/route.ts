import { NextRequest, NextResponse } from 'next/server';
import { TimeSeriesCacheService } from '@/cache/services/timeSeriesCache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const interval = (searchParams.get('interval') || 'daily') as 'intraday' | 'daily' | 'weekly' | 'monthly';
    const outputsize = (searchParams.get('outputsize') || 'compact') as 'compact' | 'full';

    const symbol = ticker.toUpperCase();
    console.log(`[Server] Time series request for ${symbol} (${interval}, ${outputsize})`);

    const result = await TimeSeriesCacheService.getTimeSeries(symbol, interval, outputsize);

    return NextResponse.json({
      data: result.data,
      _cached: result.fromCache,
      _fallback: result.fallback,
      _source: result.source,
      _timestamp: result.timestamp,
    });

  } catch (error) {
    console.error('[Server] Error in time series route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback generation lives in cache/services/timeSeriesCache to keep caching logic centralized

