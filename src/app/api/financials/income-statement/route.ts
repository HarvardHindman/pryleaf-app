import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Income Statement Data
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

    // Call MCP Alpha Vantage Income Statement API
    // This will use the mcp_alphavantage_INCOME_STATEMENT tool
    
    // For now, return mock data - will be replaced with actual MCP call
    const mockIncomeStatement = {
      symbol: symbol.toUpperCase(),
      annualReports: [
        {
          fiscalDateEnding: '2024-12-31',
          reportedCurrency: 'USD',
          totalRevenue: '394328000000',
          costOfRevenue: '223546000000',
          grossProfit: '170782000000',
          researchAndDevelopment: '29915000000',
          sellingGeneralAndAdministrative: '26094000000',
          operatingExpenses: '56009000000',
          operatingIncome: '114773000000',
          interestIncome: '4818000000',
          interestExpense: '3933000000',
          netInterestIncome: '885000000',
          otherNonOperatingIncome: '269000000',
          incomeBeforeTax: '115927000000',
          incomeTaxExpense: '20241000000',
          netIncome: '95686000000',
          netIncomeAvailableToCommonShareholders: '95686000000',
          ebitda: '123176000000',
        },
        {
          fiscalDateEnding: '2023-12-31',
          reportedCurrency: 'USD',
          totalRevenue: '383285000000',
          costOfRevenue: '214137000000',
          grossProfit: '169148000000',
          researchAndDevelopment: '29503000000',
          sellingGeneralAndAdministrative: '24932000000',
          operatingExpenses: '54435000000',
          operatingIncome: '114713000000',
          interestIncome: '3750000000',
          interestExpense: '3933000000',
          netInterestIncome: '-183000000',
          otherNonOperatingIncome: '-565000000',
          incomeBeforeTax: '113965000000',
          incomeTaxExpense: '16741000000',
          netIncome: '97224000000',
          netIncomeAvailableToCommonShareholders: '97224000000',
          ebitda: '122901000000',
        },
      ],
      quarterlyReports: [
        {
          fiscalDateEnding: '2024-09-30',
          reportedCurrency: 'USD',
          totalRevenue: '94930000000',
          costOfRevenue: '52849000000',
          grossProfit: '42081000000',
          researchAndDevelopment: '8176000000',
          sellingGeneralAndAdministrative: '7049000000',
          operatingExpenses: '15225000000',
          operatingIncome: '26856000000',
          interestIncome: '1256000000',
          interestExpense: '1007000000',
          netInterestIncome: '249000000',
          otherNonOperatingIncome: '15000000',
          incomeBeforeTax: '27120000000',
          incomeTaxExpense: '4338000000',
          netIncome: '22782000000',
          netIncomeAvailableToCommonShareholders: '22782000000',
          ebitda: '30651000000',
        },
        {
          fiscalDateEnding: '2024-06-30',
          reportedCurrency: 'USD',
          totalRevenue: '91800000000',
          costOfRevenue: '51000000000',
          grossProfit: '40800000000',
          researchAndDevelopment: '7900000000',
          sellingGeneralAndAdministrative: '6800000000',
          operatingExpenses: '14700000000',
          operatingIncome: '26100000000',
          interestIncome: '1200000000',
          interestExpense: '950000000',
          netInterestIncome: '250000000',
          otherNonOperatingIncome: '20000000',
          incomeBeforeTax: '26370000000',
          incomeTaxExpense: '4200000000',
          netIncome: '22170000000',
          netIncomeAvailableToCommonShareholders: '22170000000',
          ebitda: '29700000000',
        },
      ],
    };

    return NextResponse.json(mockIncomeStatement);
  } catch (error) {
    console.error('Income statement API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income statement data' },
      { status: 500 }
    );
  }
}

