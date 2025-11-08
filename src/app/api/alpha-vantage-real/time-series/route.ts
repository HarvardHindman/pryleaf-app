import { NextRequest, NextResponse } from 'next/server';

/**
 * Alpha Vantage Time Series API Route
 * Fetches historical stock price data using Alpha Vantage API
 * Supports daily, weekly, and monthly intervals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || 'daily'; // daily, weekly, monthly, or intraday
    const outputsize = searchParams.get('outputsize') || 'compact'; // compact or full

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`Alpha Vantage Time Series API call for: ${symbol} (${interval})`);

    // Get Alpha Vantage API key from environment
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found, using fallback data');
      return NextResponse.json({
        data: getFallbackTimeSeriesData(symbol, interval),
        _realAPIData: false,
        _fallback: true,
        _reason: 'API key not configured',
        _timestamp: new Date().toISOString()
      });
    }

    try {
      // Use MCP Alpha Vantage tools for API calls
      console.log(`Using MCP Alpha Vantage tool for ${symbol} ${interval}`);
      
      let mcpResponse;
      
      if (interval === 'intraday') {
        // Call MCP TIME_SERIES_INTRADAY
        mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/alpha-vantage/time-series-intraday`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            interval: '5min',
            outputsize
          })
        });
      } else if (interval === 'daily') {
        // Call MCP TIME_SERIES_DAILY
        mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/alpha-vantage/time-series-daily`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            outputsize
          })
        });
      } else if (interval === 'weekly') {
        // Call MCP TIME_SERIES_WEEKLY
        mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/alpha-vantage/time-series-weekly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        });
      } else if (interval === 'monthly') {
        // Call MCP TIME_SERIES_MONTHLY
        mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp/alpha-vantage/time-series-monthly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        });
      }

      if (!mcpResponse || !mcpResponse.ok) {
        throw new Error(`MCP API call failed: ${mcpResponse?.statusText || 'Unknown error'}`);
      }

      const data = await mcpResponse.json();
      
      // Check if Alpha Vantage returned an error
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }
      
      if (data['Note']) {
        throw new Error(`Alpha Vantage API rate limit: ${data['Note']}`);
      }

      // Extract time series data based on the function
      let timeSeriesKey = 'Time Series (Daily)';
      if (interval === 'weekly') {
        timeSeriesKey = 'Weekly Time Series';
      } else if (interval === 'monthly') {
        timeSeriesKey = 'Monthly Time Series';
      } else if (interval === 'intraday') {
        timeSeriesKey = 'Time Series (5min)';
      }

      const timeSeries = data[timeSeriesKey] || data.data;
      if (!timeSeries) {
        throw new Error('No time series data returned');
      }

      // Transform to our format
      let transformedData;
      if (Array.isArray(timeSeries)) {
        // Already in array format
        transformedData = timeSeries;
      } else {
        // Object format from Alpha Vantage
        transformedData = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
          timestamp,
          open: values['1. open'],
          high: values['2. high'],
          low: values['3. low'],
          close: values['4. close'],
          volume: values['5. volume']
        }));
      }
      
      transformedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      console.log(`Successfully fetched ${transformedData.length} time series data points for ${symbol} via MCP`);
      
      return NextResponse.json({
        data: transformedData,
        metadata: data['Meta Data'] || {},
        _realAPIData: true,
        _timestamp: new Date().toISOString(),
        _source: 'Alpha Vantage MCP'
      });

    } catch (apiError) {
      console.error('Alpha Vantage API call failed:', apiError);
      
      // Fallback to mock data if API fails
      return NextResponse.json({
        data: getFallbackTimeSeriesData(symbol, interval),
        _realAPIData: false,
        _fallback: true,
        _reason: apiError instanceof Error ? apiError.message : 'API call failed',
        _timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error in Alpha Vantage Time Series API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback time series data when Alpha Vantage API is not available
 */
function getFallbackTimeSeriesData(symbol: string, interval: string) {
  const data: Array<{
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }> = [];

  // Generate realistic price data based on symbol
  const basePrice = getBasePrice(symbol);
  const days = interval === 'intraday' ? 100 : interval === 'weekly' ? 52 : interval === 'monthly' ? 24 : 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    
    if (interval === 'intraday') {
      date.setMinutes(date.getMinutes() - (i * 5));
    } else if (interval === 'weekly') {
      date.setDate(date.getDate() - (i * 7));
    } else if (interval === 'monthly') {
      date.setMonth(date.getMonth() - i);
    } else {
      date.setDate(date.getDate() - i);
    }
    
    const timestamp = interval === 'intraday' 
      ? date.toISOString().slice(0, 16).replace('T', ' ')
      : date.toISOString().split('T')[0];
    
    const volatility = 0.02; // 2% daily volatility
    const trend = 0.001; // Slight upward trend
    
    const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const close = open * (1 + (Math.random() - 0.5) * volatility + trend);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    data.push({
      timestamp,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: volume.toString()
    });
  }
  
  return data;
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

