import { NextRequest, NextResponse } from 'next/server';
import { FinancialsCacheService } from '@/cache/services/financialsCache';
import { CACHE_TTL } from '@/cache/constants';

/**
 * Cash flow API with shared Supabase cache
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const result = await FinancialsCacheService.getFinancials(symbol, 'cashflow');

    return NextResponse.json({
      data: result.data,
      _cached: result.fromCache,
      _fallback: result.fallback,
      _source: result.source,
      _timestamp: result.timestamp,
      _ttlMs: CACHE_TTL.FINANCIALS,
    });
  } catch (error) {
    console.error('Cash flow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' },
      { status: 500 }
    );
  }
}

