import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // For now, we'll return a mock response since we can't directly call MCP from API routes
    // In production, you'd integrate with Alpha Vantage API directly
    const mockData = {
      Symbol: symbol.toUpperCase(),
      AssetType: "Common Stock",
      Name: `${symbol.toUpperCase()} Inc.`,
      Description: "A leading technology company focused on innovation and growth.",
      CIK: "0000000000",
      Exchange: "NASDAQ",
      Currency: "USD",
      Country: "USA",
      Sector: "TECHNOLOGY",
      Industry: "SOFTWARE",
      Address: "123 Main St, City, State, USA",
      FiscalYearEnd: "December",
      LatestQuarter: "2024-09-30",
      MarketCapitalization: "1000000000000",
      EBITDA: "50000000000",
      PERatio: "25.5",
      PEGRatio: "1.2",
      BookValue: "15.5",
      DividendPerShare: "1.0",
      DividendYield: "0.02",
      EPS: "4.5",
      RevenuePerShareTTM: "25.0",
      ProfitMargin: "0.18",
      OperatingMarginTTM: "0.25",
      ReturnOnAssetsTTM: "0.12",
      ReturnOnEquityTTM: "0.28",
      RevenueTTM: "100000000000",
      GrossProfitTTM: "60000000000",
      DilutedEPSTTM: "4.5",
      QuarterlyEarningsGrowthYOY: "0.15",
      QuarterlyRevenueGrowthYOY: "0.08",
      AnalystTargetPrice: "150.0",
      TrailingPE: "25.5",
      ForwardPE: "22.0",
      PriceToSalesRatioTTM: "10.0",
      PriceToBookRatio: "8.5",
      EVToRevenue: "9.5",
      EVToEBITDA: "20.0",
      Beta: "1.2",
      "52WeekHigh": "160.0",
      "52WeekLow": "120.0",
      "50DayMovingAverage": "145.0",
      "200DayMovingAverage": "140.0",
      SharesOutstanding: "1000000000",
      SharesFloat: "950000000",
      PercentInsiders: "5.0",
      PercentInstitutions: "65.0",
      DividendDate: "2024-12-15",
      ExDividendDate: "2024-12-10"
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Error fetching company overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company overview' },
      { status: 500 }
    );
  }
}
