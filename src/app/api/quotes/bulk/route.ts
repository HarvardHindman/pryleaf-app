import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Bulk Quote API - Fetches quotes using Alpha Vantage REALTIME_BULK_QUOTES
 * and caches them in Supabase for 10 minutes
 */
export async function POST(req: NextRequest) {
  try {
    const { symbols } = await req.json();
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 });
    }

    // Limit to 100 symbols per request (Alpha Vantage limit)
    if (symbols.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 symbols per request' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const now = new Date();
    const cacheExpiry = new Date(now.getTime() - CACHE_TTL_MS);

    // Step 1: Check cache for all symbols
    const { data: cachedQuotes, error: cacheError } = await supabase
      .from('stock_quotes')
      .select('*')
      .in('symbol', symbols)
      .gte('last_updated', cacheExpiry.toISOString());

    if (cacheError) {
      console.error('Error fetching cached quotes:', cacheError);
    }

    const cachedSymbols = new Set(cachedQuotes?.map(q => q.symbol) || []);
    const symbolsToFetch = symbols.filter(s => !cachedSymbols.has(s.toUpperCase()));

    let freshQuotes: any[] = [];

    // Step 2: Fetch missing symbols from Alpha Vantage
    if (symbolsToFetch.length > 0) {
      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
      
      if (!alphaVantageKey) {
        console.error('ALPHA_VANTAGE_API_KEY not configured');
        // Return cached data only if available
        if (cachedQuotes && cachedQuotes.length > 0) {
          return NextResponse.json({ 
            quotes: cachedQuotes, 
            cached: true,
            warning: 'Some quotes may be stale - API key not configured'
          });
        }
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
      }

      try {
        // Use REALTIME_BULK_QUOTES endpoint
        const symbolsParam = symbolsToFetch.join(',');
        const url = `https://www.alphavantage.co/query?function=REALTIME_BULK_QUOTES&symbol=${symbolsParam}&apikey=${alphaVantageKey}&datatype=json`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data['Error Message']) {
          console.error('Alpha Vantage error:', data['Error Message']);
          throw new Error(data['Error Message']);
        }

        if (data.Note) {
          console.warn('Alpha Vantage rate limit:', data.Note);
          // Return cached data if available
          if (cachedQuotes && cachedQuotes.length > 0) {
            return NextResponse.json({ 
              quotes: cachedQuotes, 
              cached: true,
              warning: 'Rate limit reached - returning cached data'
            });
          }
          return NextResponse.json({ error: 'API rate limit reached' }, { status: 429 });
        }

        // Parse the bulk quotes response
        const quotes = data['data'] || [];
        
        freshQuotes = quotes.map((quote: any) => ({
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']) || 0,
          open: parseFloat(quote['02. open']) || 0,
          high: parseFloat(quote['03. high']) || 0,
          low: parseFloat(quote['04. low']) || 0,
          volume: parseInt(quote['06. volume']) || 0,
          latest_trading_day: quote['07. latest trading day'] || now.toISOString().split('T')[0],
          previous_close: parseFloat(quote['08. previous close']) || 0,
          change: parseFloat(quote['09. change']) || 0,
          change_percent: quote['10. change percent'] || '0%',
          last_updated: now.toISOString()
        }));

        // Step 3: Upsert fresh quotes into cache
        if (freshQuotes.length > 0) {
          const { error: upsertError } = await supabase
            .from('stock_quotes')
            .upsert(freshQuotes, { onConflict: 'symbol' });

          if (upsertError) {
            console.error('Error upserting quotes:', upsertError);
          }
        }
      } catch (error) {
        console.error('Error fetching from Alpha Vantage:', error);
        // Return cached data if available
        if (cachedQuotes && cachedQuotes.length > 0) {
          return NextResponse.json({ 
            quotes: cachedQuotes, 
            cached: true,
            warning: 'Failed to fetch fresh data - returning cached data'
          });
        }
        throw error;
      }
    }

    // Step 4: Combine cached and fresh quotes
    const allQuotes = [...(cachedQuotes || []), ...freshQuotes];

    // Convert to a more user-friendly format
    const quotesMap = allQuotes.reduce((acc, quote) => {
      acc[quote.symbol] = {
        symbol: quote.symbol,
        price: parseFloat(quote.price),
        change: parseFloat(quote.change),
        changePercent: typeof quote.change_percent === 'string' 
          ? parseFloat(quote.change_percent.replace('%', ''))
          : parseFloat(quote.change_percent),
        volume: parseInt(quote.volume),
        open: parseFloat(quote.open),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        previousClose: parseFloat(quote.previous_close),
        latestTradingDay: quote.latest_trading_day,
        lastUpdated: quote.last_updated
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ 
      quotes: quotesMap,
      cached: symbolsToFetch.length === 0,
      fetchedCount: freshQuotes.length,
      cachedCount: cachedQuotes?.length || 0
    });

  } catch (error) {
    console.error('Bulk quotes API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

// Also support GET with query params
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    // Forward to POST handler
    return POST(new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ symbols })
    }));

  } catch (error) {
    console.error('Bulk quotes GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

