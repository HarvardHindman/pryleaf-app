"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Building2,
  Users,
  Globe,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  LineChart,
  Calendar,
  TrendingUp as TrendUp,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTickerData } from '@/hooks/useTickerData';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TickerData } from '@/contexts/TickerCacheContext';
import TradingViewChart from '@/components/charts/TradingViewChart';
import { ChartData, createMockChartData } from '@/components/charts/TradingViewChart';
import FinancialChart from '@/components/charts/FinancialChart';
import IncomeStatementTable from '@/components/financials/IncomeStatementTable';
import { CompanyOverview, CompanyStatistics, SymbolChart, ChartType, ChartPeriod, NewsTab } from '@/components/research';
import { IncomeStatement, BalanceSheet, CashFlowStatement } from '@/components/research/FinancialStatements';
import { formatCurrency, formatLargeNumber, formatNumber, formatPercent } from '@/lib/formatters';

type FinancialTab = 'income-statement' | 'balance-sheet' | 'cash-flow' | 'earnings';

export default function SymbolPage({ params }: { params: Promise<{ ticker: string }> }) {
  const [ticker, setTicker] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'technicals' | 'valuation' | 'news'>('overview');
  const [financialTab, setFinancialTab] = useState<FinancialTab>('income-statement');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  
  // Use cached ticker data
  const { data, loading, error } = useTickerData(ticker);
  
  // Fetch financial data based on selected tab
  const financialType = financialTab === 'income-statement' ? 'income' :
                       financialTab === 'balance-sheet' ? 'balance' :
                       financialTab === 'cash-flow' ? 'cashflow' :
                       financialTab === 'earnings' ? 'earnings' : 'income';
  
  const { data: financialData, loading: financialLoading } = useFinancialData(ticker, financialType);

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      setTicker(resolvedParams.ticker);
    };

    initializePage();
  }, [params]);

  // Load chart data when ticker or period changes
  useEffect(() => {
    if (ticker) {
      const loadChartData = async () => {
        setChartLoading(true);
        try {
          console.log(`Loading chart data for ${ticker} with period ${chartPeriod}`);
          
          // Determine interval and outputsize based on chart period
          let interval: 'daily' | 'weekly' | 'monthly' | 'intraday' = 'daily';
          let outputsize: 'compact' | 'full' = 'compact';
          
          if (chartPeriod === '1D' || chartPeriod === '5D') {
            interval = 'intraday';
            outputsize = 'compact';
          } else if (chartPeriod === '1M' || chartPeriod === '3M') {
            interval = 'daily';
            outputsize = 'compact';
          } else if (chartPeriod === '6M' || chartPeriod === '1Y') {
            interval = 'daily';
            outputsize = 'full';
          } else if (chartPeriod === '5Y') {
            interval = 'weekly';
            outputsize = 'full';
          }

          // Call server-side API that handles ALL caching logic
          const response = await fetch(`/api/ticker/${ticker}/time-series?interval=${interval}&outputsize=${outputsize}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch time series data');
          }
          
          const result = await response.json();
          const timeSeriesData = result.data;
          
          console.log('API Response:', { 
            hasData: !!timeSeriesData, 
            dataLength: timeSeriesData?.length, 
            cached: result._cached,
            sampleData: timeSeriesData?.slice(0, 2)
          });
          
          if (timeSeriesData && timeSeriesData.length > 0) {
            // Transform to chart format
            const chartDataFormatted: ChartData[] = timeSeriesData.map((item: any) => ({
              time: item.timestamp,
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
            }));
            
            console.log('Transformed chart data:', {
              length: chartDataFormatted.length,
              first: chartDataFormatted[0],
              last: chartDataFormatted[chartDataFormatted.length - 1]
            });
            
            setChartData(chartDataFormatted);
            console.log(`✅ Loaded ${chartDataFormatted.length} data points for ${ticker} (cached: ${result._cached})`);
          } else {
            // Fallback to mock data if API fails
            console.warn('No data from API, using mock data');
            const periodDays = chartPeriod === '1D' ? 1 : chartPeriod === '5D' ? 5 : chartPeriod === '1M' ? 30 : chartPeriod === '3M' ? 90 : chartPeriod === '6M' ? 180 : chartPeriod === '1Y' ? 365 : 1825;
            const mockData = createMockChartData(ticker, periodDays);
            setChartData(mockData);
          }
          
          setChartLoading(false);
        } catch (error) {
          console.error('Error loading chart data:', error);
          // Fallback to mock data on error
          const periodDays = chartPeriod === '1D' ? 1 : chartPeriod === '5D' ? 5 : chartPeriod === '1M' ? 30 : chartPeriod === '3M' ? 90 : chartPeriod === '6M' ? 180 : chartPeriod === '1Y' ? 365 : 1825;
          const mockData = createMockChartData(ticker, periodDays);
          setChartData(mockData);
          setChartLoading(false);
        }
      };

      loadChartData();
    }
  }, [ticker, chartPeriod]);

  const toggleMetricChart = (metricId: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--interactive-primary)' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading {ticker} data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle style={{ color: 'var(--danger-text)' }}>Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--text-secondary)' }}>
              {error || 'Unable to load ticker data. Please try again.'}
            </p>
            <Link href="/research">
              <Button className="mt-4">Back to Research</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header Section - Fixed at top, no scroll */}
      <div className="flex-shrink-0 border-b" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/research" className="mr-2">
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded flex items-center justify-center text-xl font-bold" style={{ backgroundColor: 'var(--surface-tertiary)', color: 'var(--text-primary)' }}>
                  {ticker.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{data.exchange || 'NASDAQ'}:{ticker}</span>
                    {data.sector && (
                      <Badge variant="secondary" className="text-xs">
                        {data.sector}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(data.price, data.currency || 'USD')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold flex items-center gap-1 ${(data.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.change || 0) >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {formatCurrency(Math.abs(data.change || 0), data.currency || 'USD')}
                  </span>
                  <span className={`text-lg font-semibold ${(data.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({(data.changePercent || 0) >= 0 ? '+' : ''}{(data.changePercent || 0).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide">
            {(['overview', 'financials', 'technicals', 'valuation', 'news'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2'
                    : ''
                }`}
                style={{
                  color: activeTab === tab ? 'var(--interactive-primary)' : 'var(--text-secondary)',
                  borderColor: activeTab === tab ? 'var(--interactive-primary)' : 'transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Takes remaining height */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-[1800px] mx-auto px-6 py-4 flex gap-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Left Side - Company Info & Statistics (Scrollable) */}
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-6 pb-16">
                <CompanyOverview data={data} />
                <CompanyStatistics data={data} />
              </div>

              {/* Right Side - Chart (Fixed height, no scroll) */}
              <div className="w-1/2 flex-shrink-0 overflow-hidden h-full">
                <SymbolChart
                  ticker={ticker}
                  chartData={chartData}
                  chartType={chartType}
                  chartPeriod={chartPeriod}
                  chartLoading={chartLoading}
                  onChartTypeChange={setChartType}
                  onChartPeriodChange={setChartPeriod}
                />
              </div>
            </>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="flex-1 overflow-y-auto space-y-6 w-full scrollbar-thin pb-16">
            {/* Financial Tab Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'income-statement', label: 'Income Statement' },
                  { id: 'balance-sheet', label: 'Balance Sheet' },
                  { id: 'cash-flow', label: 'Cash Flow' },
                  { id: 'earnings', label: 'Earnings' }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={financialTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFinancialTab(tab.id as FinancialTab)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={period === 'annual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('annual')}
                >
                  Annual
                </Button>
                <Button
                  variant={period === 'quarterly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('quarterly')}
                >
                  Quarterly
                </Button>
              </div>
            </div>

            {/* Financial Data Display */}
            {financialLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--interactive-primary)' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>Loading financial data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : financialData ? (
              <>
                {/* Income Statement - Comprehensive 10-K Style */}
                {financialTab === 'income-statement' && (
                  <IncomeStatement data={financialData} period={period} />
                )}
                
                {/* Balance Sheet - Comprehensive 10-K Style */}
                {financialTab === 'balance-sheet' && (
                  <BalanceSheet data={financialData} period={period} />
                )}
                
                {/* Cash Flow Statement - Comprehensive 10-K Style */}
                {financialTab === 'cash-flow' && (
                  <CashFlowStatement data={financialData} period={period} />
                )}
                
                {/* Earnings - Keep existing display */}
                {financialTab === 'earnings' && financialData.annualEarnings && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          <span>Earnings</span>
                        </div>
                        <Badge variant="secondary">Historical Data</Badge>
                      </CardTitle>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                        EPS data • Cached server-side
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Annual Earnings</h3>
                          <div className="grid grid-cols-4 gap-4">
                            {financialData.annualEarnings.map((earning: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{earning.fiscalDateEnding}</div>
                                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>${earning.reportedEPS}</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>EPS</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Quarterly Earnings</h3>
                          <div className="space-y-2">
                            {financialData.quarterlyEarnings?.map((earning: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                                <div>
                                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{earning.fiscalDateEnding}</div>
                                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    Estimated: ${earning.estimatedEPS}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>${earning.reportedEPS}</div>
                                  <div className={`text-xs ${parseFloat(earning.surprise) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {parseFloat(earning.surprise) >= 0 ? '+' : ''}{earning.surprise} ({earning.surprisePercentage}%)
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>No financial data available</p>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {/* Technicals Tab (Placeholder) */}
          {activeTab === 'technicals' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <Card>
            <CardHeader>
              <CardTitle>Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Coming Soon</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Technical indicators and analysis</p>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

          {/* Valuation Tab (Placeholder) */}
          {activeTab === 'valuation' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <Card>
            <CardHeader>
              <CardTitle>Valuation Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Coming Soon</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Detailed valuation analysis</p>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

          {/* News Tab - Live with Sentiment Analysis */}
          {activeTab === 'news' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin pb-16">
            <NewsTab ticker={ticker} />
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
