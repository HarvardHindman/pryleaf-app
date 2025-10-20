import { NextRequest, NextResponse } from 'next/server';

/**
 * Symbol Search API Route
 * Uses Alpha Vantage SYMBOL_SEARCH MCP tool
 * This will be replaced with actual MCP call when available
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ results: [] });
    }

    // TODO: Implement Alpha Vantage SYMBOL_SEARCH MCP tool
    // For now, using a curated list of popular symbols
    const popularSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'INTC', name: 'Intel Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'EQUITY', exchange: 'NYSE' },
      { symbol: 'V', name: 'Visa Inc.', type: 'EQUITY', exchange: 'NYSE' },
      { symbol: 'WMT', name: 'Walmart Inc.', type: 'EQUITY', exchange: 'NYSE' },
      { symbol: 'DIS', name: 'The Walt Disney Company', type: 'EQUITY', exchange: 'NYSE' },
      { symbol: 'BA', name: 'The Boeing Company', type: 'EQUITY', exchange: 'NYSE' },
    ];

    // Filter symbols based on query
    const queryLower = query.toLowerCase();
    const formattedResults = popularSymbols
      .filter(stock => 
        stock.symbol.toLowerCase().includes(queryLower) ||
        stock.name.toLowerCase().includes(queryLower)
      )
      .slice(0, 8) // Limit to 8 results
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        type: stock.type,
        exchange: stock.exchange,
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
