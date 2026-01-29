import { NextRequest, NextResponse } from 'next/server';
import { getMassiveClient } from '@/lib/massiveClient';

/**
 * Get time series data using Massive aggregates API
 * More flexible than Alpha Vantage with custom date ranges
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse parameters - Massive uses different structure
    const interval = searchParams.get('interval') || 'daily';
    const from = searchParams.get('from') || getDefaultFromDate(interval);
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '5000');

    const symbol = ticker.toUpperCase();
    console.log(`[Server] Time series request for ${symbol} (${interval}, ${from} to ${to})`);

    const massiveClient = getMassiveClient();

    // Map interval to Massive's timespan and multiplier
    const { multiplier, timespan } = parseInterval(interval);

    // Get aggregates from Massive
    const aggregates = await massiveClient.getAggregates(
      symbol,
      multiplier,
      timespan,
      from,
      to,
      { limit, sort: 'asc' }
    );

    // Transform to format expected by frontend
    const data = aggregates.map(agg => ({
      timestamp: new Date(agg.t).toISOString(),
      open: agg.o.toString(),
      high: agg.h.toString(),
      low: agg.l.toString(),
      close: agg.c.toString(),
      volume: agg.v.toString(),
      vw: agg.vw, // volume weighted average - bonus data!
      transactions: agg.n, // number of transactions - bonus data!
    }));

    return NextResponse.json({
      data,
      _source: 'massive',
      _timestamp: new Date().toISOString(),
      _count: data.length,
    });

  } catch (error) {
    console.error('[Server] Error in time series route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Parse interval to Massive's multiplier and timespan
 */
function parseInterval(interval: string): { multiplier: number; timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' } {
  switch (interval.toLowerCase()) {
    case 'intraday':
    case '1min':
    case '5min':
    case '15min':
    case '30min':
      return { multiplier: parseInt(interval.replace('min', '')) || 5, timespan: 'minute' };
    case 'hourly':
    case '1hour':
      return { multiplier: 1, timespan: 'hour' };
    case 'daily':
    case 'day':
      return { multiplier: 1, timespan: 'day' };
    case 'weekly':
    case 'week':
      return { multiplier: 1, timespan: 'week' };
    case 'monthly':
    case 'month':
      return { multiplier: 1, timespan: 'month' };
    default:
      return { multiplier: 1, timespan: 'day' };
  }
}

/**
 * Get default from date based on interval
 */
function getDefaultFromDate(interval: string): string {
  const now = new Date();
  let daysBack = 365; // Default 1 year

  switch (interval.toLowerCase()) {
    case 'intraday':
    case '1min':
    case '5min':
    case '15min':
    case '30min':
      daysBack = 7; // Last week for intraday
      break;
    case 'hourly':
      daysBack = 30; // Last month for hourly
      break;
    case 'daily':
      daysBack = 365; // Last year for daily
      break;
    case 'weekly':
      daysBack = 365 * 2; // 2 years for weekly
      break;
    case 'monthly':
      daysBack = 365 * 5; // 5 years for monthly
      break;
  }

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - daysBack);
  return fromDate.toISOString().split('T')[0];
}

