'use client';

import React, { useEffect, useRef, useState } from 'react';
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

function formatPeriodLabel(period: any, periodType: 'annual' | 'quarterly') {
  const date = new Date(period.fiscalDateEnding);
  const year = date.getFullYear();
  if (Number.isNaN(year)) return '—';
  if (periodType === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${year}`;
  }
  return `${year}`;
}

// Auto scroll horizontally to the right so the most recent period is in view
function AutoScrollContainer({ children, deps }: { children: React.ReactNode; deps: any[] }) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);

  // Keep newest data in view
  useEffect(() => {
    const main = mainRef.current;
    const top = topRef.current;
    if (!main || !top) return;
    requestAnimationFrame(() => {
      const width = main.scrollWidth;
      setContentWidth(width);
      const maxScroll = Math.max(0, width - main.clientWidth);
      main.scrollLeft = maxScroll;
      top.scrollLeft = maxScroll;
    });
  }, deps);

  const syncScroll = (source: HTMLDivElement | null, target: HTMLDivElement | null) => {
    if (!source || !target) return;
    target.scrollLeft = source.scrollLeft;
  };

  return (
    <div>
      {/* Top scrollbar placed directly under headers */}
      <div
        ref={topRef}
        className="scrollbar-thin"
        style={{ overflowX: 'auto', maxWidth: '100%', height: 12, marginBottom: 4 }}
        onScroll={() => syncScroll(topRef.current, mainRef.current)}
      >
        <div style={{ width: contentWidth || '100%', height: 1 }} />
      </div>
      <div
        ref={mainRef}
        className="overflow-x-auto scrollbar-thin"
        style={{ maxWidth: '100%' }}
        onScroll={() => syncScroll(mainRef.current, topRef.current)}
      >
        {children}
      </div>
    </div>
  );
}

interface IncomeStatementProps {
  data: any;
  period: 'annual' | 'quarterly';
}

export function IncomeStatement({ data, period }: IncomeStatementProps) {
  const reports = period === 'annual' ? data.annualReports : data.quarterlyReports || [];
  const isMock = (data as any)._mock === true;
  
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

  // Show all available periods and reverse so NEWEST is on RIGHT
  const periods = [...reports].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Income Statement</span>
            {isMock && <Badge variant="outline" style={{ color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>Example Data</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AutoScrollContainer deps={[periods.length]}>
          <table className="w-full text-sm" style={{ paddingRight: '48px' }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th
                  className="text-left py-3 px-2 font-semibold"
                  style={{
                    color: 'var(--text-primary)',
                    minWidth: '240px',
                    paddingRight: '32px',
                    paddingLeft: '12px',
                    position: 'sticky',
                    left: 0,
                    zIndex: 30,
                    backgroundColor: 'var(--surface-primary)'
                  }}
                >
                  Line Item
                </th>
                {periods.map((report: any) => (
                  <th
                    key={report.fiscalDateEnding}
                    className="py-3 px-2 font-semibold"
                    style={{
                      color: 'var(--text-primary)',
                      minWidth: '140px',
                      paddingLeft: '8px',
                      paddingRight: '32px',
                      textAlign: 'right',
                    }}
                  >
                    {formatPeriodLabel(report, period)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <SectionRow
                label="REVENUE"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Total Revenue" periods={periods} field="totalRevenue" bold />
              
              {/* Cost and Gross Profit */}
              <SectionRow
                label="COST & GROSS PROFIT"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Cost of Revenue" periods={periods} field="costOfRevenue" />
              <FinancialRow label="Gross Profit" periods={periods} field="grossProfit" bold />
              
              {/* Operating Expenses */}
              <SectionRow
                label="OPERATING EXPENSES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Research & Development" periods={periods} field="researchAndDevelopment" />
              <FinancialRow label="Selling, General & Administrative" periods={periods} field="sellingGeneralAndAdministrative" />
              <FinancialRow label="Operating Expenses" periods={periods} field="operatingExpenses" bold />
              
              {/* Operating Income */}
              <SectionRow
                label="OPERATING INCOME"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Operating Income (EBIT)" periods={periods} field="operatingIncome" bold />
              <FinancialRow label="EBITDA" periods={periods} field="ebitda" />
              <FinancialRow label="Depreciation & Amortization" periods={periods} field="depreciationAndAmortization" />
              
              {/* Non-Operating Items */}
              <SectionRow
                label="NON-OPERATING ITEMS"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Interest Income" periods={periods} field="interestIncome" />
              <FinancialRow label="Interest Expense" periods={periods} field="interestExpense" negative />
              <FinancialRow label="Net Interest Income" periods={periods} field="netInterestIncome" />
              <FinancialRow label="Other Non-Operating Income" periods={periods} field="otherNonOperatingIncome" />
              
              {/* Income Before Tax */}
              <SectionRow
                label="INCOME & TAXES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Income Before Tax" periods={periods} field="incomeBeforeTax" bold />
              <FinancialRow label="Income Tax Expense" periods={periods} field="incomeTaxExpense" negative />
              
              {/* Net Income */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Net Income
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--interactive-primary)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.netIncome)}
                  </td>
                ))}
              </tr>
              <FinancialRow label="Comprehensive Income" periods={periods} field="comprehensiveIncomeNetOfTax" />
            </tbody>
          </table>
        </AutoScrollContainer>
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
  const isMock = (data as any)._mock === true;
  
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

  // Show all available periods and reverse so NEWEST is on RIGHT
  const periods = [...reports].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Balance Sheet</span>
            {isMock && <Badge variant="outline" style={{ color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>Example Data</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AutoScrollContainer deps={[periods.length]}>
          <table className="text-sm" style={{ minWidth: '100%', width: 'max-content', paddingRight: '48px' }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th
                  className="text-left py-3 px-2 font-semibold sticky left-0 z-30"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-primary)',
                    minWidth: '240px',
                    paddingRight: '32px',
                    paddingLeft: '12px',
                  }}
                >
                  Line Item
                </th>
                {periods.map((report: any) => (
                  <th
                    key={report.fiscalDateEnding}
                    className="py-3 px-2 font-semibold"
                    style={{
                      color: 'var(--text-primary)',
                      minWidth: '140px',
                      paddingLeft: '8px',
                      paddingRight: '32px',
                      textAlign: 'right',
                    }}
                  >
                    {formatPeriodLabel(report, period)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Assets Header */}
              <SectionRow
                label="ASSETS"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
              
              {/* Current Assets */}
              <SectionRow
                label="Current Assets"
                periods={periods}
                background="var(--surface-tertiary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Cash & Cash Equivalents" periods={periods} field="cashAndCashEquivalentsAtCarryingValue" />
              <FinancialRow label="Short-term Investments" periods={periods} field="shortTermInvestments" />
              <FinancialRow label="Cash & Short-term Investments" periods={periods} field="cashAndShortTermInvestments" bold />
              <FinancialRow label="Receivables" periods={periods} field="currentNetReceivables" />
              <FinancialRow label="Inventory" periods={periods} field="inventory" />
              <FinancialRow label="Other Current Assets" periods={periods} field="otherCurrentAssets" />
              <FinancialRow label="Total Current Assets" periods={periods} field="totalCurrentAssets" bold />
              
              {/* Non-Current Assets */}
              <SectionRow
                label="Non-Current Assets"
                periods={periods}
                background="var(--surface-tertiary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Property, Plant & Equipment (Net)" periods={periods} field="propertyPlantEquipment" />
              <FinancialRow label="Accumulated Depreciation" periods={periods} field="accumulatedDepreciationAmortizationPPE" negative />
              <FinancialRow label="Goodwill" periods={periods} field="goodwill" />
              <FinancialRow label="Intangible Assets" periods={periods} field="intangibleAssets" />
              <FinancialRow label="Long-term Investments" periods={periods} field="longTermInvestments" />
              <FinancialRow label="Other Non-Current Assets" periods={periods} field="otherNonCurrentAssets" />
              <FinancialRow label="Total Non-Current Assets" periods={periods} field="totalNonCurrentAssets" bold />
              
              {/* Total Assets */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Total Assets
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--interactive-primary)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.totalAssets)}
                  </td>
                ))}
              </tr>
              
              {/* Liabilities Header */}
              <SectionRow
                label="LIABILITIES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
              
              {/* Current Liabilities */}
              <SectionRow
                label="Current Liabilities"
                periods={periods}
                background="var(--surface-tertiary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Accounts Payable" periods={periods} field="currentAccountsPayable" />
              <FinancialRow label="Short-term Debt" periods={periods} field="shortTermDebt" />
              <FinancialRow label="Current Portion of Long-term Debt" periods={periods} field="currentLongTermDebt" />
              <FinancialRow label="Other Current Liabilities" periods={periods} field="otherCurrentLiabilities" />
              <FinancialRow label="Total Current Liabilities" periods={periods} field="totalCurrentLiabilities" bold />
              
              {/* Non-Current Liabilities */}
              <SectionRow
                label="Non-Current Liabilities"
                periods={periods}
                background="var(--surface-tertiary)"
                textColor="var(--text-secondary)"
              />
              <FinancialRow label="Long-term Debt" periods={periods} field="longTermDebt" />
              <FinancialRow label="Deferred Revenue" periods={periods} field="deferredRevenue" />
              <FinancialRow label="Other Non-Current Liabilities" periods={periods} field="otherNonCurrentLiabilities" />
              <FinancialRow label="Total Non-Current Liabilities" periods={periods} field="totalNonCurrentLiabilities" bold />
              
              {/* Total Liabilities */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Total Liabilities
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--text-primary)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.totalLiabilities)}
                  </td>
                ))}
              </tr>
              
              {/* Shareholders' Equity */}
              <SectionRow
                label="SHAREHOLDERS' EQUITY"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
              <FinancialRow label="Common Stock" periods={periods} field="commonStock" />
              <FinancialRow label="Retained Earnings" periods={periods} field="retainedEarnings" />
              <FinancialRow label="Accumulated Other Comprehensive Income" periods={periods} field="accumulatedOtherComprehensiveIncomeLoss" />
              <FinancialRow label="Treasury Stock" periods={periods} field="treasuryStock" negative />
              
              {/* Total Equity */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Total Shareholders' Equity
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--interactive-primary)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.totalShareholderEquity)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </AutoScrollContainer>
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
  const isMock = (data as any)._mock === true;
  
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

  // Show all available periods and reverse so NEWEST is on RIGHT
  const periods = [...reports].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Cash Flow Statement</span>
            {isMock && <Badge variant="outline" style={{ color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>Example Data</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AutoScrollContainer deps={[periods.length]}>
          <table className="text-sm" style={{ minWidth: '100%', width: 'max-content', paddingRight: '48px' }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: 'var(--border-default)' }}>
                <th
                  className="text-left py-3 px-2 font-semibold sticky left-0 z-30"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-primary)',
                    minWidth: '240px',
                    paddingRight: '32px',
                    paddingLeft: '12px',
                  }}
                >
                  Line Item
                </th>
                {periods.map((report: any) => (
                  <th
                    key={report.fiscalDateEnding}
                    className="py-3 px-2 font-semibold"
                    style={{
                      color: 'var(--text-primary)',
                      minWidth: '140px',
                      paddingLeft: '8px',
                      paddingRight: '32px',
                      textAlign: 'right',
                    }}
                  >
                    {formatPeriodLabel(report, period)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Operating Activities */}
              <SectionRow
                label="OPERATING ACTIVITIES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
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
              <SectionRow
                label="INVESTING ACTIVITIES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
              <FinancialRow label="Capital Expenditures" periods={periods} field="capitalExpenditures" negative />
              <FinancialRow label="Investments in Property, Plant & Equipment" periods={periods} field="investmentsInPropertyPlantAndEquipment" negative />
              <FinancialRow label="Acquisitions (Net)" periods={periods} field="acquisitionsNet" negative />
              <FinancialRow label="Purchases of Investments" periods={periods} field="purchasesOfInvestments" negative />
              <FinancialRow label="Sales/Maturities of Investments" periods={periods} field="salesMaturitiesOfInvestments" />
              <FinancialRow label="Investing Cash Flow" periods={periods} field="cashflowFromInvestment" bold />
              
              {/* Financing Activities */}
              <SectionRow
                label="FINANCING ACTIVITIES"
                periods={periods}
                background="var(--surface-secondary)"
                textColor="var(--text-primary)"
                bold
              />
              <FinancialRow label="Dividends Paid" periods={periods} field="dividendsPaid" negative />
              <FinancialRow label="Debt Issuance" periods={periods} field="proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet" />
              <FinancialRow label="Stock Repurchase" periods={periods} field="repurchaseOfCommonStock" negative />
              <FinancialRow label="Stock Issuance" periods={periods} field="proceedsFromSaleOfTreasuryStock" />
              <FinancialRow label="Financing Cash Flow" periods={periods} field="cashflowFromFinancing" bold />
              
              {/* Net Change */}
              <tr className="border-t-2" style={{ borderColor: 'var(--border-default)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Net Change in Cash
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--interactive-primary)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.changeInCashAndCashEquivalents)}
                  </td>
                ))}
              </tr>
              
              {/* Free Cash Flow */}
              <tr className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="py-3 px-2 font-bold sticky left-0 z-10" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-primary)', paddingRight: '32px', paddingLeft: '12px' }}>
                  Free Cash Flow
                </td>
                {periods.map((period: any) => (
                  <td key={period.fiscalDateEnding} className="text-right py-3 px-2 font-bold" style={{ color: 'var(--success-default)', paddingLeft: '8px', paddingRight: '32px' }}>
                    {formatCurrency(period.freeCashFlow)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </AutoScrollContainer>
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
  const toNumber = (input: any) => {
    const num = typeof input === 'number' ? input : parseFloat(input);
    return Number.isFinite(num) ? num : null;
  };

  const calculateYoYChange = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  return (
    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <td className={`py-2 px-2 ${bold ? 'font-semibold' : ''} sticky left-0 z-25`} style={{ 
        color: 'var(--text-primary)',
        backgroundColor: 'var(--surface-primary)',
        minWidth: '240px',
        paddingRight: '32px',
        paddingLeft: '12px',
      }}>
        {label}
      </td>
      {periods.map((period: any, idx: number) => {
        const value = toNumber(period[field]);
        // With newest on the right, the previous year is the column to the left
        const prevValue = idx > 0 ? toNumber(periods[idx - 1][field]) : null;
        const yoyChange = value !== null && prevValue !== null ? calculateYoYChange(value, prevValue) : null;
        
        return (
          <td key={period.fiscalDateEnding} className={`py-2 px-2 ${bold ? 'font-semibold' : ''}`} style={{ paddingLeft: '8px', paddingRight: '32px', textAlign: 'right' }}>
            <div style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(value ?? 'N/A')}
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

function SectionRow({
  label,
  periods,
  background,
  textColor,
  bold = false,
}: {
  label: string;
  periods: any[];
  background: string;
  textColor: string;
  bold?: boolean;
}) {
  return (
    <tr className="bg-opacity-50" style={{ backgroundColor: background }}>
      <td
        className={`py-2 px-3 ${bold ? 'font-bold text-sm' : 'font-semibold text-xs'} sticky left-0 z-22`}
        style={{
          color: textColor,
          backgroundColor: background,
          minWidth: '240px',
        paddingRight: '32px',
        }}
      >
        {label}
      </td>
      <td colSpan={periods.length} />
    </tr>
  );
}

export function FinancialSkeletonTable({
  title,
  periodLabel,
  columns = 8,
  rows = 10,
}: {
  title: string;
  periodLabel: string;
  columns?: number;
  rows?: number;
}) {
  const columnArray = Array.from({ length: columns });
  const rowArray = Array.from({ length: rows });
  const barStyle = {
    backgroundColor: 'var(--surface-tertiary)',
    opacity: 0.7,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </div>
          <Badge variant="secondary">{periodLabel}</Badge>
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
                {columnArray.map((_, idx) => (
                  <th key={idx} className="text-right py-3 px-3 font-semibold">
                    <div className="h-4 w-16 rounded animate-pulse" style={barStyle}></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowArray.map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="py-2 px-3 sticky left-0 z-10" style={{ backgroundColor: 'var(--surface-primary)' }}>
                    <div className="h-4 w-32 rounded animate-pulse" style={barStyle}></div>
                  </td>
                  {columnArray.map((__, colIdx) => (
                    <td key={`${rowIdx}-${colIdx}`} className="text-right py-2 px-3">
                      <div className="h-4 w-16 rounded animate-pulse ml-auto" style={barStyle}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

