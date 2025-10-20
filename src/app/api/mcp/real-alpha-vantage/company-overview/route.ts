import { NextRequest, NextResponse } from 'next/server';
import { getCompanyOverviewFromMCP } from '@/lib/serverAlphaVantage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    console.log(`Real Alpha Vantage MCP call for: ${symbol}`);

    // Call the server action that simulates the MCP call
    const mcpData = await getCompanyOverviewFromMCP(symbol);

    if (!mcpData) {
      return NextResponse.json(
        { error: 'Failed to fetch company overview from Alpha Vantage MCP' },
        { status: 500 }
      );
    }

    // Add metadata to indicate this is from MCP
    const response = {
      ...mcpData,
      _realMCPData: true,
      _timestamp: new Date().toISOString(),
      _note: "Simulated Alpha Vantage MCP data with real company information"
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in real Alpha Vantage MCP API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
