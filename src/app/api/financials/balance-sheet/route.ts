import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Balance Sheet Data
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

    // Call MCP Alpha Vantage Balance Sheet API
    // This will use the mcp_alphavantage_BALANCE_SHEET tool
    
    // For now, return mock data - will be replaced with actual MCP call
    const mockBalanceSheet = {
      symbol: symbol.toUpperCase(),
      annualReports: [
        {
          fiscalDateEnding: '2024-12-31',
          reportedCurrency: 'USD',
          totalAssets: '352755000000',
          totalCurrentAssets: '143566000000',
          cashAndCashEquivalentsAtCarryingValue: '40760000000',
          cashAndShortTermInvestments: '63913000000',
          inventory: '7555000000',
          currentNetReceivables: '29508000000',
          totalNonCurrentAssets: '209189000000',
          propertyPlantEquipment: '44711000000',
          accumulatedDepreciationAmortizationPPE: '33600000000',
          intangibleAssets: '0',
          intangibleAssetsExcludingGoodwill: '0',
          goodwill: '0',
          investments: '147461000000',
          longTermInvestments: '127877000000',
          shortTermInvestments: '23153000000',
          otherCurrentAssets: '9822000000',
          otherNonCurrentAssets: '16778000000',
          totalLiabilities: '279414000000',
          totalCurrentLiabilities: '135405000000',
          currentAccountsPayable: '58146000000',
          deferredRevenue: '8820000000',
          currentDebt: '10936000000',
          shortTermDebt: '10936000000',
          totalNonCurrentLiabilities: '144009000000',
          capitalLeaseObligations: '0',
          longTermDebt: '106000000000',
          currentLongTermDebt: '10936000000',
          longTermDebtNoncurrent: '95000000000',
          shortLongTermDebtTotal: '105936000000',
          otherCurrentLiabilities: '57503000000',
          otherNonCurrentLiabilities: '37000000',
          totalShareholderEquity: '73341000000',
          treasuryStock: '-72100000000',
          retainedEarnings: '53516000000',
          commonStock: '73790000000',
          commonStockSharesOutstanding: '15115000000',
        },
      ],
      quarterlyReports: [
        {
          fiscalDateEnding: '2024-09-30',
          reportedCurrency: 'USD',
          totalAssets: '365725000000',
          totalCurrentAssets: '156458000000',
          cashAndCashEquivalentsAtCarryingValue: '61500000000',
          cashAndShortTermInvestments: '86000000000',
          inventory: '7500000000',
          currentNetReceivables: '32000000000',
          totalNonCurrentAssets: '209267000000',
          propertyPlantEquipment: '46000000000',
          accumulatedDepreciationAmortizationPPE: '34500000000',
          intangibleAssets: '0',
          intangibleAssetsExcludingGoodwill: '0',
          goodwill: '0',
          investments: '148000000000',
          longTermInvestments: '130000000000',
          shortTermInvestments: '24500000000',
          otherCurrentAssets: '10000000000',
          otherNonCurrentAssets: '17000000000',
          totalLiabilities: '286000000000',
          totalCurrentLiabilities: '142000000000',
          currentAccountsPayable: '62000000000',
          deferredRevenue: '8600000000',
          currentDebt: '11500000000',
          shortTermDebt: '11500000000',
          totalNonCurrentLiabilities: '144000000000',
          capitalLeaseObligations: '0',
          longTermDebt: '108000000000',
          currentLongTermDebt: '11500000000',
          longTermDebtNoncurrent: '96500000000',
          shortLongTermDebtTotal: '108000000000',
          otherCurrentLiabilities: '59900000000',
          otherNonCurrentLiabilities: '35000000',
          totalShareholderEquity: '79725000000',
          treasuryStock: '-74000000000',
          retainedEarnings: '62000000000',
          commonStock: '75000000000',
          commonStockSharesOutstanding: '15150000000',
        },
      ],
    };

    return NextResponse.json(mockBalanceSheet);
  } catch (error) {
    console.error('Balance sheet API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance sheet data' },
      { status: 500 }
    );
  }
}

