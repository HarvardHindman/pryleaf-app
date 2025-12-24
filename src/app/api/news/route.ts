/**
 * News API Route - GET endpoint with caching
 * Fetches news articles from cache with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { newsCache, NewsFilters } from '@/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory rate limiter - only refresh once per hour
let lastRefreshTime = 0;
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * GET /api/news
 * Query parameters:
 * - ticker: Filter by ticker symbol (e.g., "AAPL")
 * - topic: Filter by topic (e.g., "technology", "earnings")
 * - limit: Number of articles (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * - sentimentMin: Min sentiment score (default: -1.0)
 * - sentimentMax: Max sentiment score (default: 1.0)
 * - hoursAgo: Only articles from last N hours (default: 168 = 7 days)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: NewsFilters = {
      ticker: searchParams.get('ticker') || undefined,
      topic: searchParams.get('topic') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sentimentMin: parseFloat(searchParams.get('sentimentMin') || '-1.0'),
      sentimentMax: parseFloat(searchParams.get('sentimentMax') || '1.0'),
      hoursAgo: parseInt(searchParams.get('hoursAgo') || '168')
    };

    // Validate limits
    if (filters.limit && filters.limit > 200) {
      filters.limit = 200;
    }

    console.log('📰 GET /api/news - Filters:', filters);

    // Check cache stats to see if we need to refresh
    const stats = await newsService.getCacheStats();
    const cacheIsEmpty = stats.total_articles === 0;
    const cacheIsStale = stats.articles_last_24h === 0 && stats.total_articles > 0;
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const canRefresh = timeSinceLastRefresh >= REFRESH_INTERVAL_MS;
    
    // Auto-refresh if cache is empty or stale AND we haven't refreshed recently
    if ((cacheIsEmpty || cacheIsStale) && canRefresh) {
      console.log('🔄 Cache is stale or empty, refreshing... (last refresh: ' + 
        Math.round(timeSinceLastRefresh / 60000) + ' mins ago)');
      
      lastRefreshTime = now; // Mark refresh as in progress to prevent concurrent refreshes
      
      try {
        const refreshResult = await newsService.refreshNewsCache({
          topics: ['technology', 'earnings', 'financial_markets', 'economy_fiscal'],
          limit: 100
        });
        
        console.log('✅ Auto-refresh completed:', {
          inserted: refreshResult.articlesInserted,
          updated: refreshResult.articlesUpdated
        });
      } catch (refreshError) {
        console.error('⚠️ Auto-refresh failed (continuing with cached data):', refreshError);
        // Continue anyway - return whatever is in cache
      }
    } else if (!canRefresh) {
      console.log('⏳ Skipping refresh - last refresh was ' + 
        Math.round(timeSinceLastRefresh / 60000) + ' mins ago (min: 60 mins)');
    }

    // Fetch from cache
    const articles = await newsCache.getNews(filters);

    return NextResponse.json({
      success: true,
      data: articles,
      metadata: {
        count: articles.length,
        filters: filters,
        cached: true,
        cache_stats: await newsService.getCacheStats() // Get updated stats
      }
    });
  } catch (error: any) {
    console.error('❌ Error in GET /api/news:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch news',
        data: []
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news/stats
 * Get cache statistics and health dashboard
 */
export async function HEAD(request: NextRequest) {
  try {
    const dashboard = await newsService.getHealthDashboard();
    
    return NextResponse.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    console.error('❌ Error fetching news stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch news stats'
      },
      { status: 500 }
    );
  }
}

