import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// In-memory cache for demonstration (replace with Redis or Supabase for production)
const priceCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { tickers } = await req.json();
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const now = Date.now();
    const results: Record<string, any> = {};
    const toFetch: string[] = [];

    // Check cache
    for (const ticker of tickers) {
      const cached = priceCache[ticker];
      if (cached && now - cached.timestamp < CACHE_TTL) {
        results[ticker] = cached.data;
      } else {
        toFetch.push(ticker);
      }
    }

    // Fetch missing or stale tickers
    if (toFetch.length > 0) {
      const fetched = await Promise.all(
        toFetch.map(async (ticker) => {
          try {
            const quote = await yahooFinance.quote(ticker);
            priceCache[ticker] = { data: quote, timestamp: Date.now() };
            return { ticker, data: quote };
          } catch (e) {
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
