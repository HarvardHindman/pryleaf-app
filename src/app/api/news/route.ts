/**
 * News API Route - Uses Massive News API with built-in sentiment analysis
 * Simplified with in-memory caching only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMassiveClient } from '@/lib/massiveClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/news
 * Query parameters:
 * - ticker: Filter by ticker symbol (e.g., "AAPL")
 * - limit: Number of articles (default: 50, max: 1000)
 * - order: Sort order - 'asc' or 'desc' (default: 'desc')
 * - published_utc: Filter by date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const ticker = searchParams.get('ticker') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const published_utc = searchParams.get('published_utc') || undefined;

    console.log('📰 GET /api/news - Params:', { ticker, limit, order, published_utc });

    const massiveClient = getMassiveClient();

    // Fetch news from Massive (with automatic caching)
    const articles = await massiveClient.getNews({
      ticker,
      limit,
      order,
      published_utc,
    });

    // Transform articles to include sentiment data in a more accessible format
    const transformedArticles = articles.map(article => {
      // Find sentiment for requested ticker if specified
      const tickerSentiment = ticker && article.insights
        ? article.insights.find(insight => insight.ticker === ticker.toUpperCase())
        : null;

      return {
        id: article.id,
        title: article.title,
        author: article.author,
        description: article.description,
        url: article.article_url,
        image_url: article.image_url,
        published_utc: article.published_utc,
        tickers: article.tickers,
        keywords: article.keywords,
        
        // Publisher info
        publisher: {
          name: article.publisher.name,
          homepage_url: article.publisher.homepage_url,
          logo_url: article.publisher.logo_url,
          favicon_url: article.publisher.favicon_url,
        },
        
        // Sentiment analysis
        sentiment: tickerSentiment ? {
          ticker: tickerSentiment.ticker,
          sentiment: tickerSentiment.sentiment,
          sentiment_reasoning: tickerSentiment.sentiment_reasoning,
        } : null,
        
        // All insights (for multi-ticker articles)
        insights: article.insights,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedArticles,
      metadata: {
        count: transformedArticles.length,
        ticker,
        limit,
        source: 'massive',
        cached: true, // Massive client includes caching
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

