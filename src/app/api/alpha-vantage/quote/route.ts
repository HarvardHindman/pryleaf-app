import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // This endpoint would be called from your server-side code that has access to MCP
    // For now, return a placeholder response
    const mockQuote = {
      symbol: symbol.toUpperCase(),
      open: "150.00",
      high: "155.00",
      low: "148.00",
      price: "152.50",
      volume: "1000000",
      latestDay: new Date().toISOString().split('T')[0],
      previousClose: "150.00",
      change: "2.50",
      changePercent: "1.67%"
    };

    return NextResponse.json(mockQuote);

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
