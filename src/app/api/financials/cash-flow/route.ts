import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Cash Flow Statement Data
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

    // Call MCP Alpha Vantage Cash Flow API
    // This will use the mcp_alphavantage_CASH_FLOW tool
    
    // For now, return mock data - will be replaced with actual MCP call
    const mockCashFlow = {
      symbol: symbol.toUpperCase(),
      annualReports: [
        {
          fiscalDateEnding: '2024-12-31',
          reportedCurrency: 'USD',
          operatingCashflow: '118254000000',
          paymentsForOperatingActivities: '223546000000',
          proceedsFromOperatingActivities: '394328000000',
          changeInOperatingLiabilities: '15247000000',
          changeInOperatingAssets: '-12342000000',
          depreciationDepletionAndAmortization: '11519000000',
          capitalExpenditures: '11189000000',
          changeInReceivables: '-4572000000',
          changeInInventory: '-1618000000',
          profitLoss: '95686000000',
          cashflowFromInvestment: '-6137000000',
          cashflowFromFinancing: '-99772000000',
          proceedsFromRepaymentsOfShortTermDebt: '0',
          paymentsForRepurchaseOfCommonStock: '-77775000000',
          paymentsForRepurchaseOfEquity: '-77775000000',
          paymentsForRepurchaseOfPreferredStock: '0',
          dividendPayout: '-15008000000',
          dividendPayoutCommonStock: '-15008000000',
          dividendPayoutPreferredStock: '0',
          proceedsFromIssuanceOfCommonStock: '1250000000',
          proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: '0',
          proceedsFromIssuanceOfPreferredStock: '0',
          proceedsFromRepurchaseOfEquity: '-77775000000',
          proceedsFromSaleOfTreasuryStock: '0',
          changeInCashAndCashEquivalents: '12345000000',
          changeInExchangeRate: '0',
          netIncome: '95686000000',
        },
      ],
      quarterlyReports: [
        {
          fiscalDateEnding: '2024-09-30',
          reportedCurrency: 'USD',
          operatingCashflow: '27970000000',
          paymentsForOperatingActivities: '52849000000',
          proceedsFromOperatingActivities: '94930000000',
          changeInOperatingLiabilities: '3800000000',
          changeInOperatingAssets: '-2900000000',
          depreciationDepletionAndAmortization: '2900000000',
          capitalExpenditures: '2800000000',
          changeInReceivables: '-1100000000',
          changeInInventory: '-400000000',
          profitLoss: '22782000000',
          cashflowFromInvestment: '-1500000000',
          cashflowFromFinancing: '-22500000000',
          proceedsFromRepaymentsOfShortTermDebt: '0',
          paymentsForRepurchaseOfCommonStock: '-18500000000',
          paymentsForRepurchaseOfEquity: '-18500000000',
          paymentsForRepurchaseOfPreferredStock: '0',
          dividendPayout: '-3750000000',
          dividendPayoutCommonStock: '-3750000000',
          dividendPayoutPreferredStock: '0',
          proceedsFromIssuanceOfCommonStock: '300000000',
          proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: '0',
          proceedsFromIssuanceOfPreferredStock: '0',
          proceedsFromRepurchaseOfEquity: '-18500000000',
          proceedsFromSaleOfTreasuryStock: '0',
          changeInCashAndCashEquivalents: '3970000000',
          changeInExchangeRate: '0',
          netIncome: '22782000000',
        },
      ],
    };

    return NextResponse.json(mockCashFlow);
  } catch (error) {
    console.error('Cash flow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' },
      { status: 500 }
    );
  }
}

