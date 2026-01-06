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
      console.warn('Alpha Vantage API key not found');
      return NextResponse.json(
        { error: 'Alpha Vantage API key missing' },
        { status: 503 }
      );
    }

    // Direct Alpha Vantage API call (no MCP)
    const { fn, timeSeriesKey, queryParams } = getFunctionConfig(interval, outputsize);
    const url = `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&apikey=${apiKey}${queryParams}`;

    try {
      const apiResponse = await fetch(url);
      if (!apiResponse.ok) {
        return NextResponse.json(
          { error: `Alpha Vantage HTTP error: ${apiResponse.statusText}` },
          { status: 502 }
        );
      }

      const data = await apiResponse.json();

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

      const timeSeries = data[timeSeriesKey] || data.data;
      if (!timeSeries) {
        return NextResponse.json(
          { error: 'No time series data returned' },
          { status: 502 }
        );
      }

      const transformedData = Array.isArray(timeSeries)
        ? timeSeries
        : Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
            timestamp,
            open: values['1. open'],
            high: values['2. high'],
            low: values['3. low'],
            close: values['4. close'],
            volume: values['5. volume'],
          }));

      transformedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      console.log(`Successfully fetched ${transformedData.length} time series data points for ${symbol}`);

      return NextResponse.json({
        data: transformedData,
        metadata: data['Meta Data'] || {},
        _realAPIData: true,
        _timestamp: new Date().toISOString(),
        _source: 'Alpha Vantage',
      });
    } catch (apiError) {
      console.warn('Alpha Vantage API call failed:', apiError);
      return NextResponse.json(
        { error: apiError instanceof Error ? apiError.message : 'Alpha Vantage time series fetch failed' },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Error in Alpha Vantage Time Series API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getFunctionConfig(interval: string, outputsize: string) {
  if (interval === 'intraday') {
    return {
      fn: 'TIME_SERIES_INTRADAY',
      timeSeriesKey: 'Time Series (5min)',
      queryParams: `&interval=5min&outputsize=${outputsize}`,
    };
  }

  if (interval === 'weekly') {
    return {
      fn: 'TIME_SERIES_WEEKLY',
      timeSeriesKey: 'Weekly Time Series',
      queryParams: '',
    };
  }

  if (interval === 'monthly') {
    return {
      fn: 'TIME_SERIES_MONTHLY',
      timeSeriesKey: 'Monthly Time Series',
      queryParams: '',
    };
  }

  // default to daily
  return {
    fn: 'TIME_SERIES_DAILY',
    timeSeriesKey: 'Time Series (Daily)',
    queryParams: `&outputsize=${outputsize}`,
  };
}

// No synthetic fallback helpers; if Alpha Vantage returns nothing, we send a 502 JSON with an error.

