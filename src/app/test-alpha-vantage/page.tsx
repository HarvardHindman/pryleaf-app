'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ApiUsageStats from '@/components/ApiUsageStats';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  DollarSign,
  Users,
  Globe,
  Activity
} from 'lucide-react';

interface CompanyData {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  EPS: string;
  RevenueTTM: string;
  ProfitMargin: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  Exchange: string;
  Currency: string;
  Address: string;
  usage?: {
    used: number;
    remaining: number;
    limit: number;
  };
}

export default function TestAlphaVantagePage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyData = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alpha-vantage/overview?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string, currency = 'USD') => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Alpha Vantage Integration Test
          </h1>
          <p className="text-gray-600">
            Test the Alpha Vantage API with Supabase caching
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Company Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter symbol (e.g., AAPL, GOOGL, MSFT)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && fetchCompanyData()}
                  className="flex-1"
                />
                <Button 
                  onClick={fetchCompanyData}
                  disabled={loading || !symbol.trim()}
                  className="px-8"
                >
                  {loading ? 'Loading...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Usage Stats */}
          <div className="lg:col-span-1">
            <ApiUsageStats />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <Activity className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Data Display */}
        {data && (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <Card className={`${data._realAPIData ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardContent className="pt-6">
                <div className={`flex items-center gap-2 ${data._realAPIData ? 'text-green-700' : 'text-yellow-700'}`}>
                  <Activity className="h-5 w-5" />
                  <span className="font-medium">
                    {data._realAPIData ? '✅ Live Alpha Vantage API Data' : '⚠️ Enhanced Fallback Data'}
                  </span>
                  <span className="text-sm">
                    {data._realAPIData 
                      ? '• Real-time Alpha Vantage API • Live financial data • Direct API integration'
                      : '• Realistic company data • Accurate metrics • API fallback mode'
                    }
                  </span>
                </div>
                {data._fallback && (
                  <div className="mt-2 text-xs text-gray-600">
                    Fallback reason: {data._reason}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{data.Name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{data.Symbol}</Badge>
                      <Badge variant="outline">{data.Exchange}</Badge>
                      <Badge variant="outline">{data.Sector}</Badge>
                      <Badge variant="default" className={data._realAPIData ? "bg-green-600" : "bg-yellow-600"}>
                        {data._realAPIData ? "Live API" : "Fallback"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Market Cap</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(data.MarketCapitalization)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {data.Description}
                </p>
              </CardContent>
            </Card>

            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">P/E Ratio</span>
                    <span className="font-semibold">{data.PERatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">EPS</span>
                    <span className="font-semibold">${data.EPS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dividend Yield</span>
                    <span className="font-semibold">{formatPercentage(data.DividendYield)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue (TTM)</span>
                    <span className="font-semibold">{formatCurrency(data.RevenueTTM)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Margin</span>
                    <span className="font-semibold">{formatPercentage(data.ProfitMargin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">52W High</span>
                    <span className="font-semibold text-green-600">${data["52WeekHigh"]}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry</span>
                    <span className="font-semibold text-right">{data.Industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currency</span>
                    <span className="font-semibold">{data.Currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">52W Low</span>
                    <span className="font-semibold text-red-600">${data["52WeekLow"]}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-orange-600" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    {data.Address}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Usage Info */}
            {data.usage && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Activity className="h-5 w-5" />
                    <span className="font-medium">API Usage:</span>
                    <span>{data.usage.used} requests used today ({data.usage.remaining} remaining)</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works - Real Alpha Vantage API Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <strong>Real API Call:</strong> Calls actual Alpha Vantage API (https://www.alphavantage.co/query) for live data
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <strong>Fallback Mode:</strong> If API key missing or API fails, uses enhanced realistic data (what you're seeing now)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <strong>Smart Caching:</strong> Caches data in Supabase for 15 minutes regardless of source
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <strong>Shared Cache:</strong> All users benefit from the same cached data, maximizing efficiency
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
              <div>
                <strong>Rate Limiting:</strong> Tracks daily usage (25 requests/day) and shows remaining quota
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">6</div>
              <div>
                <strong>Data Quality:</strong> Even fallback data is realistic with real company names, sectors, and financial metrics
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">7</div>
              <div>
                <strong>Production Ready:</strong> Add ALPHA_VANTAGE_API_KEY environment variable to use live API data
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
