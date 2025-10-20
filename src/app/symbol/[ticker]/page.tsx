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
import { TickerData } from '@/contexts/TickerCacheContext';
import TradingViewChart from '@/components/charts/TradingViewChart';
import { ChartData, createMockChartData } from '@/components/charts/TradingViewChart';
import FinancialChart from '@/components/charts/FinancialChart';
import IncomeStatementTable from '@/components/financials/IncomeStatementTable';

type FinancialTab = 'income-statement' | 'balance-sheet' | 'cash-flow' | 'ratios' | 'segments-kpis';

// Mock financial data - will be replaced with Alpha Vantage MCP calls
const mockIncomeStatementData = {
  periods: ['2024', '2023', '2022', '2021'],
  data: [
    { label: 'Total Revenues', values: [281720000000, 245122000000, 211915000000, 198270000000], isHeader: true, chartable: true },
    { label: 'Cost of Sales', values: [87831000000, 74114000000, 65863000000, 62650000000], isSubItem: true, chartable: true },
    { label: 'Gross Profit', values: [193889000000, 171008000000, 146052000000, 135620000000], isHeader: true, chartable: true },
    { label: 'Gross Margin', values: [0.688, 0.698, 0.689, 0.684], formatAsPercent: true, chartable: true },
    { label: 'Selling, General & Administrative', values: [32877000000, 32065000000, 30334000000, 27725000000], isSubItem: true, chartable: true },
    { label: 'Research & Development', values: [32488000000, 29510000000, 27195000000, 24512000000], isSubItem: true, chartable: true },
    { label: 'Operating Profit', values: [128528000000, 109433000000, 88523000000, 83383000000], isHeader: true, chartable: true },
    { label: 'Operating Margin', values: [0.456, 0.446, 0.418, 0.421], formatAsPercent: true, chartable: true },
    { label: 'Non-Operating Income', values: [-4901000000, -1646000000, 788000000, 333000000], isSubItem: true, chartable: true },
    { label: 'Total Non-Operating Income', values: [-4901000000, -1646000000, 788000000, 333000000], isSubItem: true },
    { label: 'Pre-Tax Income', values: [123627000000, 107787000000, 89311000000, 83716000000], isHeader: true, chartable: true },
    { label: 'Income Tax', values: [21916000000, 19296000000, 17155000000, 15963000000], isSubItem: true, chartable: true },
    { label: 'Net Income', values: [101711000000, 88491000000, 72156000000, 67753000000], isHeader: true, chartable: true },
    { label: 'Net Margin', values: [0.361, 0.361, 0.341, 0.342], formatAsPercent: true, chartable: true },
    { label: 'Diluted EPS', values: [13.45, 11.75, 9.70, 9.21], chartable: true },
    { label: 'Diluted Shares Outstanding', values: [7563000000, 7531000000, 7440000000, 7356000000], chartable: true },
  ]
};

export default function SymbolPage({ params }: { params: Promise<{ ticker: string }> }) {
  const [ticker, setTicker] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'technicals' | 'valuation' | 'news'>('overview');
  const [financialTab, setFinancialTab] = useState<FinancialTab>('income-statement');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [chartPeriod, setChartPeriod] = useState<'1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y'>('3M');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  
  // Use cached ticker data
  const { data, loading, error } = useTickerData(ticker);

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
          const periodDays = chartPeriod === '1D' ? 1 : chartPeriod === '5D' ? 5 : chartPeriod === '1M' ? 30 : chartPeriod === '3M' ? 90 : chartPeriod === '6M' ? 180 : chartPeriod === '1Y' ? 365 : 1825;
          
          // For now, always use mock data until Alpha Vantage time series is fully integrated
          console.log(`Loading chart data for ${ticker} with period ${chartPeriod}`);
          const mockData = createMockChartData(ticker, periodDays);
          setChartData(mockData);
          setChartLoading(false);
        } catch (error) {
          console.error('Error loading chart data:', error);
          const mockData = createMockChartData(ticker, 90);
          setChartData(mockData);
          setChartLoading(false);
        }
      };

      loadChartData();
    }
  }, [ticker, chartPeriod]);

  const formatCurrency = (value: number, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value: number) => {
    if (!value && value !== 0) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header Section */}
      <div className="border-b" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
          <div className="flex gap-1 mt-6 overflow-x-auto scrollbar-hide">
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

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Company Info & Statistics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Company Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }} className="text-sm">
                      {showFullDescription ? data.description : data.description?.substring(0, 200) + '...'}
                    </p>
                    {data.description && data.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-sm font-medium mt-2"
                        style={{ color: 'var(--interactive-primary)' }}
                      >
                        {showFullDescription ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Name</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.name}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CEO</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.ceo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Website</p>
                      {data.website ? (
                        <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--interactive-primary)' }}>
                          {data.website.replace('https://', '').replace('http://', '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>N/A</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sector</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.sector || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Year Founded</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.founded || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Employees</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.employees ? formatNumber(data.employees) : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Profile</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Market Cap</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatLargeNumber(data.marketCap)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatLargeNumber(data.totalRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Employees</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatNumber(data.employees)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Margins</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Gross</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercent(data.grossMargins || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>EBITDA</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercent(data.ebitdaMargins || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Operating</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercent(data.operatingMargins || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Net</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercent(data.profitMargins || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valuation */}
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Valuation (TTM)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>P/E</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.peRatio ? data.peRatio.toFixed(2) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>EPS</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.eps ? formatCurrency(data.eps) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Dividend Yield</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPercent(data.dividendYield)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Price Chart
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      {/* Chart Type Selector */}
                      <div className="flex items-center gap-2">
                        {(['candlestick', 'line', 'area'] as const).map((type) => (
                          <Button
                            key={type}
                            variant={chartType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType(type)}
                            className="capitalize"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                      {/* Period Selector */}
                      <div className="flex items-center gap-1">
                        {(['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'] as const).map((p) => (
                          <Button
                            key={p}
                            variant={chartPeriod === p ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setChartPeriod(p)}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {chartLoading ? (
                    <div className="h-[600px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--interactive-primary)' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Loading chart...</p>
                      </div>
                    </div>
                  ) : (
                    <TradingViewChart
                      data={chartData}
                      symbol={ticker}
                      type={chartType}
                      height={600}
                      className="w-full"
                      theme="dark"
                      autoSize={true}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Financial Tab Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'income-statement', label: 'Income Statement' },
                  { id: 'balance-sheet', label: 'Balance Sheet' },
                  { id: 'cash-flow', label: 'Cash Flow' },
                  { id: 'ratios', label: 'Ratios' },
                  { id: 'segments-kpis', label: 'Segments & KPIs' }
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

            {/* Income Statement */}
            {financialTab === 'income-statement' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>Income Statement</span>
                    </div>
                    <Badge variant="secondary">{period === 'annual' ? 'Annual' : 'Quarterly'}</Badge>
                  </CardTitle>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    Click the chart icon next to any metric to visualize trends
                  </p>
                </CardHeader>
                <CardContent>
                  <IncomeStatementTable 
                    periods={mockIncomeStatementData.periods}
                    data={mockIncomeStatementData.data}
                    period={period}
                  />
                </CardContent>
              </Card>
            )}

            {/* Other Financial Tabs - Placeholders */}
            {financialTab !== 'income-statement' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{financialTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    <Badge variant="secondary">{period === 'annual' ? 'Annual' : 'Quarterly'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      Coming Soon
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {financialTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} with interactive charting
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Technicals Tab (Placeholder) */}
        {activeTab === 'technicals' && (
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
        )}

        {/* Valuation Tab (Placeholder) */}
        {activeTab === 'valuation' && (
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
        )}

        {/* News Tab (Placeholder) */}
        {activeTab === 'news' && (
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Coming Soon</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Company news and sentiment analysis</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
