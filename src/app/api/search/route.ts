import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ results: [] });
    }

    // Search for tickers using yahoo-finance2
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 8,
      newsCount: 0,
    });

    // Format the results for our autocomplete
    const formattedResults = searchResults.quotes.map((result: any) => ({
      symbol: result.symbol,
      name: result.longname || result.shortname,
      type: result.quoteType,
      exchange: result.exchange,
    }));

    return NextResponse.json({ results: formattedResults });

  } catch (error) {
    console.error('Error searching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}