import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`Alpha Vantage API call for: ${symbol}`);

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found');
      return NextResponse.json(
        { error: 'Alpha Vantage API key missing' },
        { status: 503 }
      );
    }

    const apiUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
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
    if (!data.Symbol || data.Symbol === 'None') {
      return NextResponse.json(
        { error: 'Invalid symbol or no data returned' },
        { status: 502 }
      );
    }

    console.log(`Successfully fetched Alpha Vantage data for ${symbol}`);

    return NextResponse.json({
      ...data,
      _realAPIData: true,
      _timestamp: new Date().toISOString(),
      _source: 'Alpha Vantage API'
    });

  } catch (error) {
    console.warn('Error in Alpha Vantage API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 502 }
    );
  }
}

