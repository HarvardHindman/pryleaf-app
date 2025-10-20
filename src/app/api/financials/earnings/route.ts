import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Earnings Data
 * Uses Alpha Vantage MCP Integration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Call MCP Alpha Vantage Earnings API
    // This will use the mcp_alphavantage_EARNINGS tool
    
    // For now, return mock data - will be replaced with actual MCP call
    const mockEarnings = {
      symbol: symbol.toUpperCase(),
      annualEarnings: [
        {
          fiscalDateEnding: '2024-12-31',
          reportedEPS: '6.49',
          estimatedEPS: '6.45',
          surprise: '0.04',
          surprisePercentage: '0.62',
        },
        {
          fiscalDateEnding: '2023-12-31',
          reportedEPS: '6.13',
          estimatedEPS: '6.08',
          surprise: '0.05',
          surprisePercentage: '0.82',
        },
        {
          fiscalDateEnding: '2022-12-31',
          reportedEPS: '5.89',
          estimatedEPS: '5.84',
          surprise: '0.05',
          surprisePercentage: '0.86',
        },
        {
          fiscalDateEnding: '2021-12-31',
          reportedEPS: '5.55',
          estimatedEPS: '5.50',
          surprise: '0.05',
          surprisePercentage: '0.91',
        },
      ],
      quarterlyEarnings: [
        {
          fiscalDateEnding: '2024-09-30',
          reportedDate: '2024-10-31',
          reportedEPS: '1.64',
          estimatedEPS: '1.60',
          surprise: '0.04',
          surprisePercentage: '2.50',
        },
        {
          fiscalDateEnding: '2024-06-30',
          reportedDate: '2024-08-01',
          reportedEPS: '1.53',
          estimatedEPS: '1.50',
          surprise: '0.03',
          surprisePercentage: '2.00',
        },
        {
          fiscalDateEnding: '2024-03-31',
          reportedDate: '2024-05-02',
          reportedEPS: '1.46',
          estimatedEPS: '1.44',
          surprise: '0.02',
          surprisePercentage: '1.39',
        },
        {
          fiscalDateEnding: '2023-12-31',
          reportedDate: '2024-02-01',
          reportedEPS: '1.58',
          estimatedEPS: '1.56',
          surprise: '0.02',
          surprisePercentage: '1.28',
        },
      ],
    };

    return NextResponse.json(mockEarnings);
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    );
  }
}

