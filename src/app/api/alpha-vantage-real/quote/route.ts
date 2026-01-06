import { NextRequest, NextResponse } from 'next/server';

/**
 * Alpha Vantage Quote API Route
 * Fetches real-time quote data using Alpha Vantage GLOBAL_QUOTE API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`Alpha Vantage Quote API call for: ${symbol}`);

    // Get Alpha Vantage API key from environment
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found');
      return NextResponse.json(
        { error: 'Alpha Vantage API key missing' },
        { status: 503 }
      );
    }

    // Call the actual Alpha Vantage GLOBAL_QUOTE API
    const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    console.log(`Making Alpha Vantage API call to: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Pryleaf-App/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Alpha Vantage API error: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    
    // Check if Alpha Vantage returned an error
    if (data['Error Message']) {
      return NextResponse.json(
        { error: `Alpha Vantage API error: ${data['Error Message']}` },
        { status: 502 }
      );
    }
    
    if (data['Note']) {
      return NextResponse.json(
        { error: `Alpha Vantage API rate limit: ${data['Note']}` },
        { status: 502 }
      );
    }

    const globalQuote = data['Global Quote'];
    if (!globalQuote || !globalQuote['01. symbol']) {
      return NextResponse.json(
        { error: 'No quote data returned' },
        { status: 502 }
      );
    }

    // Transform to our format
    const quoteData = {
      symbol: globalQuote['01. symbol'],
      open: globalQuote['02. open'],
      high: globalQuote['03. high'],
      low: globalQuote['04. low'],
      price: globalQuote['05. price'],
      volume: globalQuote['06. volume'],
      latestTradingDay: globalQuote['07. latest trading day'],
      previousClose: globalQuote['08. previous close'],
      change: globalQuote['09. change'],
      changePercent: globalQuote['10. change percent']
    };

    console.log(`Successfully fetched Alpha Vantage quote for ${symbol}`);
    
    return NextResponse.json({
      ...quoteData,
      _realAPIData: true,
      _timestamp: new Date().toISOString(),
      _source: 'Alpha Vantage API'
    });

  } catch (error) {
    console.warn('Error in Alpha Vantage Quote API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

