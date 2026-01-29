import { NextRequest, NextResponse } from 'next/server';
import { getMassiveClient } from '@/lib/massiveClient';

const toNumber = (value: any) => {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === 'string' ? Number(value.replace('%', '')) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Batch Price Quotes API Route
 * Uses Massive API with in-memory caching
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const tickers = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const massiveClient = getMassiveClient();
    
    const results: Record<string, any> = {};

    // Fetch all tickers using Massive's snapshot API (includes caching)
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          // Use snapshot API for comprehensive data
          const snapshot = await massiveClient.getSnapshot(ticker);
          
          if (snapshot && snapshot.day) {
            const quoteData = {
              symbol: snapshot.ticker,
              price: snapshot.day.c ?? 0,
              change: snapshot.todaysChange ?? 0,
              changePercent: snapshot.todaysChangePerc ?? 0,
              volume: snapshot.day.v,
              open: snapshot.day.o,
              high: snapshot.day.h,
              low: snapshot.day.l,
              previousClose: snapshot.prevDay?.c,
              bid: snapshot.lastQuote?.p,
              ask: snapshot.lastQuote?.P,
            };

            results[ticker] = quoteData;
          } else {
            results[ticker] = null;
          }
        } catch (e) {
          console.error(`Error fetching snapshot for ${ticker}:`, e);
          results[ticker] = null;
        }
      })
    );

    return NextResponse.json(results);
  } catch (e) {
    console.error('Prices API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickers } = body;
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const massiveClient = getMassiveClient();
    const results: Record<string, any> = {};

    // Fetch all tickers using Massive's snapshot API (includes caching)
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const snapshot = await massiveClient.getSnapshot(ticker);
          
          if (snapshot && snapshot.day) {
            const quoteData = {
              symbol: snapshot.ticker,
              regularMarketPrice: snapshot.day.c,
              regularMarketChange: snapshot.todaysChange,
              regularMarketChangePercent: snapshot.todaysChangePerc,
              regularMarketVolume: snapshot.day.v,
              regularMarketOpen: snapshot.day.o,
              regularMarketDayHigh: snapshot.day.h,
              regularMarketDayLow: snapshot.day.l,
              regularMarketPreviousClose: snapshot.prevDay?.c,
              bid: snapshot.lastQuote?.p,
              ask: snapshot.lastQuote?.P,
            };

            results[ticker] = quoteData;
          } else {
            results[ticker] = null;
          }
        } catch (e) {
          console.error(`Error fetching snapshot for ${ticker}:`, e);
          results[ticker] = null;
        }
      })
    );

    return NextResponse.json(results);
  } catch (e) {
    console.error('Prices API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
