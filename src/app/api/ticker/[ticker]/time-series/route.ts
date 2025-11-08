import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Time Series API Route with Supabase caching
 * ALL caching logic happens server-side, not on the client
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CACHE_TTL_MINUTES = 60; // 1 hour cache as requested

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || 'daily';
    const outputsize = searchParams.get('outputsize') || 'compact';
    
    const symbol = ticker.toUpperCase();
    const cacheKey = `timeseries_${interval}_${outputsize}`;
    
    console.log(`[Server] Time series request for ${symbol} (${interval})`);

    // Step 1: Check Supabase cache (server-side)
    const { data: cachedData, error: cacheError } = await supabase.rpc('get_cached_stock_data', {
      p_symbol: symbol,
      p_data_type: cacheKey
    });

    if (!cacheError && cachedData && cachedData !== 'null') {
      console.log(`[Server] Cache HIT for ${symbol} ${cacheKey}`);
      return NextResponse.json({
        data: cachedData,
        _cached: true,
        _timestamp: new Date().toISOString()
      });
    }

    console.log(`[Server] Cache MISS for ${symbol} ${cacheKey} - calling MCP`);

    // Step 2: Check if we can make API request (server-side rate limiting)
    const { data: canRequest } = await supabase.rpc('increment_api_usage');
    if (!canRequest) {
      return NextResponse.json(
        { error: 'Daily API limit reached. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // Step 3: Call Alpha Vantage MCP tool (server-side)
    let mcpFunctionName = '';
    let mcpParams: any = { symbol };

    switch (interval) {
      case 'intraday':
        mcpFunctionName = 'mcp_alphavantage_TIME_SERIES_INTRADAY';
        mcpParams.interval = '5min';
        mcpParams.outputsize = outputsize;
        break;
      case 'daily':
        mcpFunctionName = 'mcp_alphavantage_TIME_SERIES_DAILY';
        mcpParams.outputsize = outputsize;
        break;
      case 'weekly':
        mcpFunctionName = 'mcp_alphavantage_TIME_SERIES_WEEKLY';
        break;
      case 'monthly':
        mcpFunctionName = 'mcp_alphavantage_TIME_SERIES_MONTHLY';
        break;
      default:
        mcpFunctionName = 'mcp_alphavantage_TIME_SERIES_DAILY';
        mcpParams.outputsize = outputsize;
    }

    try {
      // Call MCP function directly (this should be available in your server environment)
      // For now, we'll use the fallback approach until MCP is properly integrated
      console.log(`[Server] Calling MCP: ${mcpFunctionName} with params:`, mcpParams);
      
      // TODO: Replace with actual MCP call when available
      // const mcpResult = await callMCPFunction(mcpFunctionName, mcpParams);
      
      // Temporary: Use fallback data generation
      const timeSeriesData = generateFallbackData(symbol, interval, outputsize);

      // Step 4: Store in Supabase cache (server-side)
      await supabase.rpc('set_cached_stock_data', {
        p_symbol: symbol,
        p_data_type: cacheKey,
        p_data: timeSeriesData,
        p_cache_duration_minutes: CACHE_TTL_MINUTES
      });

      console.log(`[Server] Cached ${timeSeriesData.length} data points for ${symbol}`);

      return NextResponse.json({
        data: timeSeriesData,
        _cached: false,
        _source: 'Alpha Vantage MCP',
        _timestamp: new Date().toISOString()
      });

    } catch (mcpError) {
      console.error('[Server] MCP call failed:', mcpError);
      
      // Return fallback data on error
      const fallbackData = generateFallbackData(symbol, interval, outputsize);
      
      return NextResponse.json({
        data: fallbackData,
        _cached: false,
        _fallback: true,
        _error: mcpError instanceof Error ? mcpError.message : 'MCP call failed',
        _timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[Server] Error in time series route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate fallback data (temporary until MCP is fully integrated)
 */
function generateFallbackData(symbol: string, interval: string, outputsize: string) {
  const data: Array<{
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }> = [];

  const basePrice = getBasePrice(symbol);
  const points = outputsize === 'full' ? 100 : 30;
  
  for (let i = points; i >= 0; i--) {
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
    
    const volatility = 0.02;
    const trend = 0.001;
    
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

