'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';

// Utility function to format currency
function formatCurrency(value: number | string | undefined, currency: string = 'USD'): string {
  if (value === undefined || value === null || value === '' || value === 'None') return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';
  
  // For values in billions/millions
  if (Math.abs(numValue) >= 1_000_000_000) {
    return `$${(numValue / 1_000_000_000).toFixed(2)}B`;
  } else if (Math.abs(numValue) >= 1_000_000) {
    return `$${(numValue / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(numValue) >= 1_000) {
    return `$${(numValue / 1_000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

interface IncomeStatementProps {
  data: any;
  period: 'annual' | 'quarterly';
}

export function IncomeStatement({ data, period }: IncomeStatementProps) {
  const reports = period === 'annual' ? data.annualReports : data.quarterlyReports || [];
  
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-primary)' }}>No income statement data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take up to 5 years and reverse so NEWEST is on RIGHT
  const periods = reports.slice(0, 5).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Income Statement</span>
          </div>
          <Badge variant="secondary">{period === 'annual' ? 'Annual' : 'Quarterly'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: '100%' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th className="text-left py-3 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Line Item
                </th>
                {periods.map((period: any) => (
                  <th key={period.fiscalDateEnding} className="text-right py-3 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {new Date(period.fiscalDateEnding).getFullYear()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  REVENUE
                </td>
              </tr>
              <FinancialRow label="Total Revenue" periods={periods} field="totalRevenue" bold />
              
              {/* Cost and Gross Profit */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  COST & GROSS PROFIT
                </td>
              </tr>
              <FinancialRow label="Cost of Revenue" periods={periods} field="costOfRevenue" />
              <FinancialRow label="Gross Profit" periods={periods} field="grossProfit" bold />
              
              {/* Operating Expenses */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  OPERATING EXPENSES
                </td>
              </tr>
              <FinancialRow label="Research & Development" periods={periods} field="researchAndDevelopment" />
              <FinancialRow label="Selling, General & Administrative" periods={periods} field="sellingGeneralAndAdministrative" />
              <FinancialRow label="Operating Expenses" periods={periods} field="operatingExpenses" bold />
              
              {/* Operating Income */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  OPERATING INCOME
                </td>
              </tr>
              <FinancialRow label="Operating Income (EBIT)" periods={periods} field="operatingIncome" bold />
              <FinancialRow label="EBITDA" periods={periods} field="ebitda" />
              <FinancialRow label="Depreciation & Amortization" periods={periods} field="depreciationAndAmortization" />
              
              {/* Non-Operating Items */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  NON-OPERATING ITEMS
                </td>
              </tr>
              <FinancialRow label="Interest Income" periods={periods} field="interestIncome" />
              <FinancialRow label="Interest Expense" periods={periods} field="interestExpense" negative />
              <FinancialRow label="Net Interest Income" periods={periods} field="netInterestIncome" />
              <FinancialRow label="Other Non-Operating Income" periods={periods} field="otherNonOperatingIncome" />
              
              {/* Income Before Tax */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  INCOME & TAXES
                </td>
              </tr>
              <FinancialRow label="Income Before Tax" periods={periods} field="incomeBeforeTax" bold />
              <FinancialRow label="Income Tax Expense" periods={periods} field="incomeTaxExpense" negative />
              
              {/* Net Income */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Net Income
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--interactive-primary)' }}>
                    {formatCurrency(period.netIncome)}
                  </td>
                ))}
              </tr>
              <FinancialRow label="Comprehensive Income" periods={periods} field="comprehensiveIncomeNetOfTax" />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface BalanceSheetProps {
  data: any;
  period: 'annual' | 'quarterly';
}

export function BalanceSheet({ data, period }: BalanceSheetProps) {
  const reports = period === 'annual' ? data.annualReports : data.quarterlyReports || [];
  
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-primary)' }}>No balance sheet data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take up to 5 years and reverse so NEWEST is on RIGHT
  const periods = reports.slice(0, 5).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Balance Sheet</span>
          </div>
          <Badge variant="secondary">{period === 'annual' ? 'Annual' : 'Quarterly'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: '100%' }}>
          <table className="text-sm" style={{ minWidth: '100%', width: 'max-content' }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th className="text-left py-3 px-3 font-semibold sticky left-0 z-10" style={{ 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--surface-primary)',
                  minWidth: '200px'
                }}>
                  Line Item
                </th>
                {periods.map((period: any) => (
                  <th key={period.fiscalDateEnding} className="text-right py-3 px-3 font-semibold" style={{ 
                    color: 'var(--text-primary)',
                    minWidth: '120px'
                  }}>
                    {new Date(period.fiscalDateEnding).getFullYear()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Assets Header */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  ASSETS
                </td>
              </tr>
              
              {/* Current Assets */}
              <tr className="bg-opacity-30" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Current Assets
                </td>
              </tr>
              <FinancialRow label="Cash & Cash Equivalents" periods={periods} field="cashAndCashEquivalentsAtCarryingValue" />
              <FinancialRow label="Short-term Investments" periods={periods} field="shortTermInvestments" />
              <FinancialRow label="Cash & Short-term Investments" periods={periods} field="cashAndShortTermInvestments" bold />
              <FinancialRow label="Receivables" periods={periods} field="currentNetReceivables" />
              <FinancialRow label="Inventory" periods={periods} field="inventory" />
              <FinancialRow label="Other Current Assets" periods={periods} field="otherCurrentAssets" />
              <FinancialRow label="Total Current Assets" periods={periods} field="totalCurrentAssets" bold />
              
              {/* Non-Current Assets */}
              <tr className="bg-opacity-30" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Non-Current Assets
                </td>
              </tr>
              <FinancialRow label="Property, Plant & Equipment (Net)" periods={periods} field="propertyPlantEquipment" />
              <FinancialRow label="Accumulated Depreciation" periods={periods} field="accumulatedDepreciationAmortizationPPE" negative />
              <FinancialRow label="Goodwill" periods={periods} field="goodwill" />
              <FinancialRow label="Intangible Assets" periods={periods} field="intangibleAssets" />
              <FinancialRow label="Long-term Investments" periods={periods} field="longTermInvestments" />
              <FinancialRow label="Other Non-Current Assets" periods={periods} field="otherNonCurrentAssets" />
              <FinancialRow label="Total Non-Current Assets" periods={periods} field="totalNonCurrentAssets" bold />
              
              {/* Total Assets */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Total Assets
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--interactive-primary)' }}>
                    {formatCurrency(period.totalAssets)}
                  </td>
                ))}
              </tr>
              
              {/* Liabilities Header */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  LIABILITIES
                </td>
              </tr>
              
              {/* Current Liabilities */}
              <tr className="bg-opacity-30" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Current Liabilities
                </td>
              </tr>
              <FinancialRow label="Accounts Payable" periods={periods} field="currentAccountsPayable" />
              <FinancialRow label="Short-term Debt" periods={periods} field="shortTermDebt" />
              <FinancialRow label="Current Portion of Long-term Debt" periods={periods} field="currentLongTermDebt" />
              <FinancialRow label="Other Current Liabilities" periods={periods} field="otherCurrentLiabilities" />
              <FinancialRow label="Total Current Liabilities" periods={periods} field="totalCurrentLiabilities" bold />
              
              {/* Non-Current Liabilities */}
              <tr className="bg-opacity-30" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Non-Current Liabilities
                </td>
              </tr>
              <FinancialRow label="Long-term Debt" periods={periods} field="longTermDebt" />
              <FinancialRow label="Deferred Revenue" periods={periods} field="deferredRevenue" />
              <FinancialRow label="Other Non-Current Liabilities" periods={periods} field="otherNonCurrentLiabilities" />
              <FinancialRow label="Total Non-Current Liabilities" periods={periods} field="totalNonCurrentLiabilities" bold />
              
              {/* Total Liabilities */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Total Liabilities
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(period.totalLiabilities)}
                  </td>
                ))}
              </tr>
              
              {/* Shareholders' Equity */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  SHAREHOLDERS' EQUITY
                </td>
              </tr>
              <FinancialRow label="Common Stock" periods={periods} field="commonStock" />
              <FinancialRow label="Retained Earnings" periods={periods} field="retainedEarnings" />
              <FinancialRow label="Accumulated Other Comprehensive Income" periods={periods} field="accumulatedOtherComprehensiveIncomeLoss" />
              <FinancialRow label="Treasury Stock" periods={periods} field="treasuryStock" negative />
              
              {/* Total Equity */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Total Shareholders' Equity
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--interactive-primary)' }}>
                    {formatCurrency(period.totalShareholderEquity)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface CashFlowStatementProps {
  data: any;
  period: 'annual' | 'quarterly';
}

export function CashFlowStatement({ data, period }: CashFlowStatementProps) {
  const reports = period === 'annual' ? data.annualReports : data.quarterlyReports || [];
  
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-primary)' }}>No cash flow data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take up to 5 years and reverse so NEWEST is on RIGHT
  const periods = reports.slice(0, 5).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Cash Flow Statement</span>
          </div>
          <Badge variant="secondary">{period === 'annual' ? 'Annual' : 'Quarterly'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: '100%' }}>
          <table className="text-sm" style={{ minWidth: '100%', width: 'max-content' }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th className="text-left py-3 px-3 font-semibold sticky left-0 z-10" style={{ 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--surface-primary)',
                  minWidth: '200px'
                }}>
                  Line Item
                </th>
                {periods.map((period: any) => (
                  <th key={period.fiscalDateEnding} className="text-right py-3 px-3 font-semibold" style={{ 
                    color: 'var(--text-primary)',
                    minWidth: '120px'
                  }}>
                    {new Date(period.fiscalDateEnding).getFullYear()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Operating Activities */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  OPERATING ACTIVITIES
                </td>
              </tr>
              <FinancialRow label="Net Income" periods={periods} field="netIncome" />
              <FinancialRow label="Depreciation & Amortization" periods={periods} field="depreciationDepletionAndAmortization" />
              <FinancialRow label="Stock-Based Compensation" periods={periods} field="stockBasedCompensation" />
              <FinancialRow label="Deferred Income Tax" periods={periods} field="deferredIncomeTax" />
              <FinancialRow label="Change in Receivables" periods={periods} field="changeInReceivables" />
              <FinancialRow label="Change in Inventory" periods={periods} field="changeInInventory" />
              <FinancialRow label="Change in Accounts Payable" periods={periods} field="changeInAccountsPayable" />
              <FinancialRow label="Change in Operating Assets" periods={periods} field="changeInOperatingAssets" />
              <FinancialRow label="Change in Operating Liabilities" periods={periods} field="changeInOperatingLiabilities" />
              <FinancialRow label="Operating Cash Flow" periods={periods} field="operatingCashflow" bold />
              
              {/* Investing Activities */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  INVESTING ACTIVITIES
                </td>
              </tr>
              <FinancialRow label="Capital Expenditures" periods={periods} field="capitalExpenditures" negative />
              <FinancialRow label="Investments in Property, Plant & Equipment" periods={periods} field="investmentsInPropertyPlantAndEquipment" negative />
              <FinancialRow label="Acquisitions (Net)" periods={periods} field="acquisitionsNet" negative />
              <FinancialRow label="Purchases of Investments" periods={periods} field="purchasesOfInvestments" negative />
              <FinancialRow label="Sales/Maturities of Investments" periods={periods} field="salesMaturitiesOfInvestments" />
              <FinancialRow label="Investing Cash Flow" periods={periods} field="cashflowFromInvestment" bold />
              
              {/* Financing Activities */}
              <tr className="bg-opacity-50" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <td colSpan={periods.length + 1} className="py-2 px-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  FINANCING ACTIVITIES
                </td>
              </tr>
              <FinancialRow label="Dividends Paid" periods={periods} field="dividendsPaid" negative />
              <FinancialRow label="Debt Issuance" periods={periods} field="proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet" />
              <FinancialRow label="Stock Repurchase" periods={periods} field="repurchaseOfCommonStock" negative />
              <FinancialRow label="Stock Issuance" periods={periods} field="proceedsFromSaleOfTreasuryStock" />
              <FinancialRow label="Financing Cash Flow" periods={periods} field="cashflowFromFinancing" bold />
              
              {/* Net Change */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Net Change in Cash
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--interactive-primary)' }}>
                    {formatCurrency(period.changeInCashAndCashEquivalents)}
                  </td>
                ))}
              </tr>
              
              {/* Free Cash Flow */}
              <tr className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                  Free Cash Flow
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-3 font-bold" style={{ color: 'var(--success-default)' }}>
                    {formatCurrency(period.freeCashFlow)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for table rows
interface FinancialRowProps {
  label: string;
  periods: any[];
  field: string;
  bold?: boolean;
  negative?: boolean;
}

function FinancialRow({ label, periods, field, bold = false, negative = false }: FinancialRowProps) {
  const calculateYoYChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <td className={`py-2 px-3 ${bold ? 'font-semibold' : ''} sticky left-0 z-10`} style={{ 
        color: 'var(--text-primary)',
        backgroundColor: 'var(--surface-primary)'
      }}>
        {label}
      </td>
      {periods.map((period: any, idx: number) => {
        const value = parseFloat(period[field]);
        // Since array is reversed (newest first), compare to next index (previous year chronologically)
        const prevValue = idx < periods.length - 1 ? parseFloat(periods[idx + 1][field]) : null;
        const yoyChange = prevValue ? calculateYoYChange(value, prevValue) : null;
        
        return (
          <td key={period.fiscalDateEnding} className={`text-right py-2 px-3 ${bold ? 'font-semibold' : ''}`}>
            <div style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(value)}
            </div>
            {yoyChange !== null && (
              <div className="text-xs flex items-center justify-end gap-1 mt-0.5">
                {yoyChange > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={yoyChange > 0 ? 'text-green-600' : 'text-red-600'}>
                  {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                </span>
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

