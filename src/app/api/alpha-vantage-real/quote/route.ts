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
      console.warn('Alpha Vantage API key not found, using fallback data');
      return NextResponse.json({
        ...getFallbackQuoteData(symbol),
        _realAPIData: false,
        _fallback: true,
        _reason: 'API key not configured',
        _timestamp: new Date().toISOString()
      });
    }

    try {
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
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if Alpha Vantage returned an error
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }
      
      if (data['Note']) {
        throw new Error(`Alpha Vantage API rate limit: ${data['Note']}`);
      }

      const globalQuote = data['Global Quote'];
      if (!globalQuote || !globalQuote['01. symbol']) {
        throw new Error('No quote data returned');
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

    } catch (apiError) {
      console.error('Alpha Vantage API call failed:', apiError);
      
      // Fallback to mock data if API fails
      return NextResponse.json({
        ...getFallbackQuoteData(symbol),
        _realAPIData: false,
        _fallback: true,
        _reason: apiError instanceof Error ? apiError.message : 'API call failed',
        _timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in Alpha Vantage Quote API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback quote data when Alpha Vantage API is not available
 */
function getFallbackQuoteData(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  const basePrice = getBasePrice(normalizedSymbol);
  
  // Generate random daily movement
  const change = (Math.random() - 0.5) * basePrice * 0.03; // ±3% change
  const changePercent = ((change / basePrice) * 100).toFixed(2) + '%';
  const price = basePrice + change;
  
  return {
    symbol: normalizedSymbol,
    open: (price * 0.99).toFixed(2),
    high: (price * 1.02).toFixed(2),
    low: (price * 0.97).toFixed(2),
    price: price.toFixed(2),
    volume: Math.floor(1000000 + Math.random() * 50000000).toString(),
    latestTradingDay: new Date().toISOString().split('T')[0],
    previousClose: basePrice.toFixed(2),
    change: change.toFixed(2),
    changePercent: changePercent
  };
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'AAPL': 175.00,
    'GOOGL': 140.00,
    'MSFT': 370.00,
    'AMZN': 145.00,
    'TSLA': 240.00,
    'META': 330.00,
    'NVDA': 480.00,
    'NFLX': 450.00,
    'AMD': 140.00,
    'INTC': 45.00
  };
  return prices[symbol] || 150.00;
}

