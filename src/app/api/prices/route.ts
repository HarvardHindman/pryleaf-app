import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService, priceCache } from '@/cache';

const DEFAULT_CACHE_MINUTES = 24 * 60; // Daily refresh
const MAX_CACHE_MINUTES = 24 * 60; // Clamp to 1 day until we need finer granularity

const parseCacheTtl = (value?: string | number | null) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.min(asNumber, MAX_CACHE_MINUTES);
  }
  return DEFAULT_CACHE_MINUTES;
};

const toNumber = (value: any) => {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === 'string' ? Number(value.replace('%', '')) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Batch Price Quotes API Route
 * Uses Alpha Vantage with Supabase caching
 * Replaces Yahoo Finance with cached Alpha Vantage data
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    const cacheTtlMinutes = parseCacheTtl(searchParams.get('cacheTtlMinutes'));
    
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
            const quote = await StockCacheService.getQuote(ticker, { cacheMinutes: cacheTtlMinutes });
            
            if (quote) {
              const quoteData = {
                symbol: quote.symbol,
                price: toNumber(quote.price) ?? 0,
                change: toNumber(quote.change) ?? 0,
                changePercent: toNumber(quote.changePercent) ?? 0,
                volume: toNumber(quote.volume),
                open: toNumber(quote.open),
                high: toNumber(quote.high),
                low: toNumber(quote.low),
                previousClose: toNumber(quote.previousClose),
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
    const body = await req.json();
    const { tickers, cacheTtlMinutes: bodyCacheTtl } = body;
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const cacheTtlMinutes = parseCacheTtl(bodyCacheTtl);

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
            const quote = await StockCacheService.getQuote(ticker, { cacheMinutes: cacheTtlMinutes });
            
            if (quote) {
              const quoteData = {
                symbol: quote.symbol,
                regularMarketPrice: toNumber(quote.price),
                regularMarketChange: toNumber(quote.change),
                regularMarketChangePercent: toNumber(quote.changePercent),
                regularMarketVolume: toNumber(quote.volume),
                regularMarketOpen: toNumber(quote.open),
                regularMarketDayHigh: toNumber(quote.high),
                regularMarketDayLow: toNumber(quote.low),
                regularMarketPreviousClose: toNumber(quote.previousClose),
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
