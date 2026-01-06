'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TickerData } from '@/contexts/TickerCacheContext';
import { formatCurrency, formatLargeNumber, formatNumber, formatPercent } from '@/lib/formatters';

interface CompanyStatisticsProps {
  data: TickerData;
}

export function CompanyStatistics({ data }: CompanyStatisticsProps) {
  const asNum = (v: any): number | null => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
  const displayLarge = (v: any) => {
    const num = asNum(v);
    return num !== null ? formatLargeNumber(num) : 'N/A';
  };
  const displayNumber = (v: any, digits = 1) => {
    const num = asNum(v);
    return num !== null ? formatNumber(num, digits) : 'N/A';
  };
  const displayPercent = (v: any) => {
    const num = asNum(v);
    return num !== null ? formatPercent(num) : 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          {/* Column 1 */}
          <div className="space-y-6">
            {/* Profile */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Profile</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Market Cap</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayLarge(data.marketCap)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayLarge(data.enterpriseValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Shares Out</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {asNum(data.sharesOutstanding) !== null ? (data.sharesOutstanding / 1e9).toFixed(2) + 'B' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayLarge(data.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Employees</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayNumber(data.employees, 0)}</span>
                </div>
              </div>
            </div>

            {/* Margins */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Margins</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Gross</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.grossMargins)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EBITDA</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.ebitdaMargins)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Operating</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.operatingMargins)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Pre-Tax</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.preTaxMargin)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Net</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.profitMargins)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>FCF</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.fcfMargin)}</span>
                </div>
              </div>
            </div>

            {/* Returns (5Yr Avg) */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Returns (5Yr Avg)</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>ROA</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.returnOnAssets)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>ROTA</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>ROE</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayPercent(data.returnOnEquity)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>ROCE</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>ROIC</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            {/* Valuation (TTM) */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Valuation (TTM)</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>P/E</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.peRatio) !== null ? data.peRatio.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>P/B</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.priceToBook) !== null ? data.priceToBook.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV/Sales</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.evToRevenue) !== null ? data.evToRevenue.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV/EBITDA</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.evToEbitda) !== null ? data.evToEbitda.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>P/FCF</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.priceToFreeCashFlow) !== null ? data.priceToFreeCashFlow.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV/Gross Profit</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.evToGrossProfit) !== null ? data.evToGrossProfit.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Valuation (NTM) */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Valuation (NTM)</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Price Target</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.targetPrice) !== null ? formatCurrency(data.targetPrice) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>P/E</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.forwardPE) !== null ? data.forwardPE.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>PEG</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{asNum(data.pegRatio) !== null ? data.pegRatio.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV/Sales</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EV/EBITDA</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>P/FCF</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
              </div>
            </div>

            {/* Financial Health */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Financial Health</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Cash</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayLarge(data.cash)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Net Debt</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{displayLarge(data.netDebt)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Debt/Equity</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {asNum(data.debtToEquity) !== null ? data.debtToEquity.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EBIT/Interest</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            {/* Growth (CAGR) */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Growth (CAGR)</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rev 3Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rev 5Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rev 10Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Dil EPS 3Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Dil EPS 5Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Dil EPS 10Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Rev Fwd 2Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EBITDA Fwd 2Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EPS Fwd 2Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>EPS LT Growth Est</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
              </div>
            </div>

            {/* Dividends */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Dividends</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Yield</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.dividendYield ? formatPercent(data.dividendYield) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Payout</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.payoutRatio ? formatPercent(data.payoutRatio) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>DPS</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.dividendPerShare ? `$${data.dividendPerShare.toFixed(2)}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>DPS Growth 3Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>DPS Growth 5Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>DPS Growth 10Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>DPS Growth Fwd 2Yr</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

