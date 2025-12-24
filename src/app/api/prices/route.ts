import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService } from '@/cache';
import { priceCache } from '@/cache';

/**
 * Batch Price Quotes API Route
 * Uses Alpha Vantage with Supabase caching
 * Replaces Yahoo Finance with cached Alpha Vantage data
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const tickers = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    const results: Record<string, any> = {};
    const toFetch: string[] = [];

    // Check in-memory cache first
    for (const ticker of tickers) {
      const cached = priceCache.get(ticker);
      if (cached) {
        results[ticker] = cached;
      } else {
        toFetch.push(ticker);
      }
    }

    // Fetch missing or stale tickers from Alpha Vantage (with Supabase caching)
    if (toFetch.length > 0) {
      const fetched = await Promise.all(
        toFetch.map(async (ticker) => {
          try {
            // Get quote from Alpha Vantage with Supabase caching
            const quote = await StockCacheService.getQuote(ticker);
            
            if (quote) {
              const quoteData = {
                symbol: quote.symbol,
                price: parseFloat(quote.price),
                change: parseFloat(quote.change),
                changePercent: parseFloat(quote.changePercent.replace('%', '')),
                volume: parseInt(quote.volume),
                open: parseFloat(quote.open),
                high: parseFloat(quote.high),
                low: parseFloat(quote.low),
                previousClose: parseFloat(quote.previousClose),
              };

              // Update in-memory cache
              priceCache.set(ticker, quoteData);
              return { ticker, data: quoteData };
            } else {
              return { ticker, data: null };
            }
          } catch (e) {
            console.error(`Error fetching quote for ${ticker}:`, e);
            return { ticker, data: null };
          }
        })
      );

      for (const { ticker, data } of fetched) {
        results[ticker] = data;
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    console.error('Prices API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tickers } = await req.json();
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const results: Record<string, any> = {};
    const toFetch: string[] = [];

    // Check in-memory cache first
    for (const ticker of tickers) {
      const cached = priceCache.get(ticker);
      if (cached) {
        results[ticker] = cached;
      } else {
        toFetch.push(ticker);
      }
    }

    // Fetch missing or stale tickers from Alpha Vantage (with Supabase caching)
    if (toFetch.length > 0) {
      const fetched = await Promise.all(
        toFetch.map(async (ticker) => {
          try {
            // Get quote from Alpha Vantage with Supabase caching
            const quote = await StockCacheService.getQuote(ticker);
            
            if (quote) {
              const quoteData = {
                symbol: quote.symbol,
                regularMarketPrice: parseFloat(quote.price),
                regularMarketChange: parseFloat(quote.change),
                regularMarketChangePercent: parseFloat(quote.changePercent.replace('%', '')),
                regularMarketVolume: parseInt(quote.volume),
                regularMarketOpen: parseFloat(quote.open),
                regularMarketDayHigh: parseFloat(quote.high),
                regularMarketDayLow: parseFloat(quote.low),
                regularMarketPreviousClose: parseFloat(quote.previousClose),
              };

              // Update in-memory cache
              priceCache.set(ticker, quoteData);
              return { ticker, data: quoteData };
            } else {
              return { ticker, data: null };
            }
          } catch (e) {
            console.error(`Error fetching quote for ${ticker}:`, e);
            return { ticker, data: null };
          }
        })
      );

      for (const { ticker, data } of fetched) {
        results[ticker] = data;
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    console.error('Prices API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
