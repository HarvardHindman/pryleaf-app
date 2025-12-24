import { NextRequest, NextResponse } from 'next/server';
import { BulkQuoteCacheService } from '@/cache';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Refresh Stock Quotes
 * 
 * Triggers a bulk refresh of stock quotes for all active portfolio holdings
 * Uses Alpha Vantage's REALTIME_BULK_QUOTES API (Premium endpoint required)
 * 
 * This endpoint should be called:
 * - Via cron job every hour
 * - Manually for testing/debugging
 * - On-demand when cache is stale
 * 
 * Security: Requires API key authentication for automated calls
 */

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(req: NextRequest) {
  try {
    // Security: Check for API key (for cron/automated calls)
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key');
    
    // Allow requests with valid auth or from authenticated users
    const isAuthorized = 
      apiKey === process.env.CRON_SECRET ||
      authHeader?.includes(process.env.SUPABASE_SERVICE_ROLE_KEY || '') ||
      authHeader?.includes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - API key or auth token required' },
        { status: 401 }
      );
    }

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const { staleOnly = false, ageMinutes = 60 } = body;

    // Initialize service with service role key for elevated permissions
    const service = new BulkQuoteService(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.ALPHA_VANTAGE_API_KEY
    );

    // Refresh quotes
    let result;
    if (staleOnly) {
      console.log(`Refreshing stale quotes (older than ${ageMinutes} minutes)`);
      result = await service.refreshStaleQuotes(ageMinutes);
    } else {
      console.log('Refreshing all active portfolio quotes');
      result = await service.refreshAllQuotes();
    }

    // Return success response with stats
    return NextResponse.json({
      success: true,
      message: 'Stock quotes refreshed successfully',
      stats: {
        symbolsRequested: result.symbolsRequested,
        symbolsProcessed: result.symbolsProcessed,
        apiCallsMade: result.apiCallsMade,
        batches: result.batches,
        durationSeconds: Math.round(result.duration),
        status: result.status,
        errors: result.errors.length > 0 ? result.errors : undefined
      },
      timestamp: new Date().toISOString(),
      logId: result.logId
    }, {
      status: result.status === 'failed' ? 500 : 200
    });

  } catch (error) {
    console.error('Error refreshing stock quotes:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}

/**
 * GET endpoint - Returns cache statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Allow unauthenticated requests for cache stats (read-only)
    const service = new BulkQuoteService();
    
    const stats = await service.getCacheStats();
    
    if (!stats) {
      return NextResponse.json({
        error: 'Unable to fetch cache statistics'
      }, { status: 500 });
    }

    // Get recent refresh logs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: recentLogs } = await supabase
      .from('quote_refresh_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      cache: {
        totalSymbols: stats.total_symbols,
        freshQuotes: stats.fresh_quotes,
        staleQuotes: stats.stale_quotes,
        oldestQuote: stats.oldest_quote,
        newestQuote: stats.newest_quote,
        avgAgeMinutes: stats.avg_age_minutes
      },
      recentRefreshes: recentLogs?.map(log => ({
        id: log.id,
        startedAt: log.started_at,
        completedAt: log.completed_at,
        status: log.status,
        symbolsRequested: log.symbols_requested,
        symbolsProcessed: log.symbols_processed,
        apiCallsMade: log.api_calls_made,
        durationSeconds: log.duration_seconds,
        errorMessage: log.error_message
      })) || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, {
      status: 500
    });
  }
}

