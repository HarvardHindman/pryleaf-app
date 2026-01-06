import { NextRequest, NextResponse } from 'next/server';
import { FinancialsCacheService, FinancialStatementType } from '@/cache/services/financialsCache';
import { CACHE_TTL } from '@/cache/constants';

/**
 * Financials API
 * - Shared Supabase cache (24h TTL) for all users
 * - Falls back to zeros when fields are missing
 * - Fetches fresh data from Alpha Vantage when cache is stale/missing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'income') as FinancialStatementType; // income, balance, cashflow, earnings

    const symbol = ticker.toUpperCase();
    console.log(`[Server] Financial data request for ${symbol} (${type})`);

    const result = await FinancialsCacheService.getFinancials(symbol, type);

    return NextResponse.json({
      data: result.data,
      _cached: result.fromCache,
      _fallback: result.fallback,
      _source: result.source,
      _timestamp: result.timestamp,
      _ttlMs: CACHE_TTL.FINANCIALS,
    });
  } catch (error) {
    console.error('[Server] Error in financials route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

