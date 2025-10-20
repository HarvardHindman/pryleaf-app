import { NextRequest, NextResponse } from 'next/server';
import { MCPAlphaVantage } from '@/lib/mcpAlphaVantage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`MCP Alpha Vantage Company Overview called for: ${symbol}`);
    
    // Call the MCP Alpha Vantage service
    const mcpData = await MCPAlphaVantage.getCompanyOverview(symbol);

    if (!mcpData) {
      return NextResponse.json(
        { error: 'Failed to fetch company overview from Alpha Vantage' },
        { status: 500 }
      );
    }

    // Add metadata to indicate this is real MCP data
    const response = {
      ...mcpData,
      _mcpSource: true,
      _timestamp: new Date().toISOString(),
      _dataSource: 'Alpha Vantage MCP'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in MCP company overview API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
