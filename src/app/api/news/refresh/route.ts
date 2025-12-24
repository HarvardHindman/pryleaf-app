/**
 * News Refresh API Route - POST endpoint for cron job
 * Refreshes news cache from Alpha Vantage API
 */

import { NextRequest, NextResponse } from 'next/server';
import { newsCache } from '@/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/news/refresh
 * Triggers news cache refresh from Alpha Vantage
 * 
 * Headers:
 * - x-api-key: CRON_SECRET for authentication
 * 
 * Body (optional):
 * - tickers: Array of tickers to filter (e.g., ["AAPL", "MSFT"])
 * - topics: Array of topics to filter (e.g., ["technology", "earnings"])
 * - limit: Max articles to fetch (default: 200)
 * 
 * Example cron job (hourly):
 * curl -X POST https://your-domain.com/api/news/refresh \
 *   -H "x-api-key: YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Optional authentication check - only enforce if CRON_SECRET is set
    const apiKey = request.headers.get('x-api-key');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && apiKey !== cronSecret) {
      console.error('❌ Unauthorized refresh attempt - wrong API key');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting news refresh...');

    // Parse request body (optional filters)
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON - use defaults
    }

    const options = {
      tickers: body.tickers || undefined,
      topics: body.topics || [
        'technology',
        'earnings',
        'ipo',
        'mergers_and_acquisitions',
        'financial_markets',
        'economy_fiscal',
        'economy_monetary',
        'retail_wholesale',
        'manufacturing'
      ], // Default to broad topics
      limit: body.limit || 200
    };

    // Trigger refresh
    const result = await newsCache.refreshNewsCache(options);

    if (!result.success) {
      console.error('❌ News refresh failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result
        },
        { status: 500 }
      );
    }

    console.log('✅ News refresh completed:', {
      inserted: result.articlesInserted,
      updated: result.articlesUpdated,
      total: result.totalArticles
    });

    return NextResponse.json({
      success: true,
      message: 'News cache refreshed successfully',
      data: {
        articlesInserted: result.articlesInserted,
        articlesUpdated: result.articlesUpdated,
        totalArticles: result.totalArticles,
        apiCallsMade: result.apiCallsMade
      }
    });
  } catch (error: any) {
    console.error('❌ Error in POST /api/news/refresh:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to refresh news cache'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news/refresh
 * Get refresh status and recent refresh logs
 */
export async function GET(request: NextRequest) {
  try {
    const dashboard = await newsCache.getHealthDashboard();
    
    return NextResponse.json({
      success: true,
      data: {
        health: dashboard,
        message: 'Use POST method to trigger refresh'
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching refresh status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch refresh status'
      },
      { status: 500 }
    );
  }
}

