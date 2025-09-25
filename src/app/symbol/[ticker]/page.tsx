"use client";

// AppLayout is now handled at the root level
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
  Globe
} from 'lucide-react';

interface TickerData {
  companyName: string;
  ticker: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  currency: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  averageVolume: number;
  volume: number;
  businessSummary: string;
  sector: string;
  industry: string;
  website: string;
  employees: number;
  totalRevenue: number;
  grossMargins: number;
  operatingMargins: number;
  profitMargins: number;
  exchange: string;
  exchangeTimezoneName: string;
  lastUpdated: string;
}

export default function SymbolPage({ params }: { params: Promise<{ ticker: string }> }) {
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string>('');

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      setTicker(resolvedParams.ticker);
      
      const fetchTickerData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch(`/api/ticker/${resolvedParams.ticker}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Ticker not found');
            }
            throw new Error('Failed to fetch data');
          }
          
          const tickerData = await response.json();
          setData(tickerData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchTickerData();
    };

    initializePage();
  }, [params]);

  const formatCurrency = (value: number, currency = 'USD') => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--clr-info-a40)] mx-auto mb-4"></div>
          <p className="text-[var(--clr-primary-a30)]">Loading ticker data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-[var(--clr-danger-a10)] border border-[var(--clr-danger-a20)] p-6 rounded-lg mb-6">
            <p className="text-[var(--clr-danger-a50)] font-semibold">Error: {error}</p>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--clr-surface-a30)] hover:bg-[var(--clr-surface-a35)] text-[var(--clr-primary-a45)] rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositiveChange = data.dailyChange >= 0;

  return (
    <>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Company Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-3xl font-bold text-[var(--clr-primary-a50)]">
                {data.companyName}
              </h1>
              <Badge variant="secondary" className="text-sm bg-[var(--clr-surface-a10)] text-[var(--clr-primary-a40)]">
                {data.ticker}
              </Badge>
              {data.sector && (
                <Badge variant="outline" className="text-xs text-[var(--clr-primary-a30)] border-[var(--clr-surface-a25)]">
                  {data.sector}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl font-bold text-[var(--clr-primary-a50)]">
                  {formatCurrency(data.currentPrice, data.currency)}
                </span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                  isPositiveChange 
                    ? 'bg-[var(--clr-success-a10)] text-[var(--clr-success-a50)] border border-[var(--clr-success-a20)]' 
                    : 'bg-[var(--clr-danger-a10)] text-[var(--clr-danger-a50)] border border-[var(--clr-danger-a20)]'
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span className="font-semibold text-lg">
                    {formatCurrency(Math.abs(data.dailyChange), data.currency)} 
                    ({formatPercentage(Math.abs(data.dailyChangePercent / 100))})
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-[var(--clr-primary-a30)]">
                {data.exchange} • {data.exchangeTimezoneName}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Key Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--clr-primary-a50)]">
                  <Building2 className="h-5 w-5 text-[var(--clr-info-a40)]" />
                  Key Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Market Cap</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatLargeNumber(data.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">P/E Ratio</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{data.peRatio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">EPS (TTM)</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatCurrency(data.eps, data.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Dividend Yield</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatPercentage(data.dividendYield)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Volume</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatLargeNumber(data.volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Avg Volume</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatLargeNumber(data.averageVolume)}</span>
                </div>
              </CardContent>
            </Card>

            {/* 52-Week Range Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[var(--clr-primary-a50)]">52-Week Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">52W High</span>
                  <span className="font-semibold text-[var(--clr-success-a45)]">
                    {formatCurrency(data.fiftyTwoWeekHigh, data.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">52W Low</span>
                  <span className="font-semibold text-[var(--clr-danger-a45)]">
                    {formatCurrency(data.fiftyTwoWeekLow, data.currency)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--clr-primary-a25)]">Current Position</span>
                    <span className="text-[var(--clr-primary-a30)]">
                      {((data.currentPrice - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--clr-surface-a20)] rounded-full h-2">
                    <div 
                      className="bg-[var(--clr-info-a40)] h-2 rounded-full transition-all duration-500" 
                      style={{
                        width: `${((data.currentPrice - data.fiftyTwoWeekLow) / (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--clr-primary-a25)]">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Metrics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[var(--clr-primary-a50)]">Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Revenue (TTM)</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatLargeNumber(data.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Gross Margin</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatPercentage(data.grossMargins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Operating Margin</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatPercentage(data.operatingMargins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clr-primary-a30)]">Profit Margin</span>
                  <span className="font-semibold text-[var(--clr-primary-a50)]">{formatPercentage(data.profitMargins)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Profile */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--clr-primary-a50)]">
                <Globe className="h-5 w-5 text-[var(--clr-info-a35)]" />
                Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[var(--clr-primary-a50)] mb-3">Business Description</h4>
                    <p className="text-[var(--clr-primary-a35)] text-sm leading-relaxed">
                      {data.businessSummary || 'No business description available.'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--clr-primary-a30)]">Sector</span>
                    <span className="font-semibold text-[var(--clr-primary-a50)]">{data.sector || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--clr-primary-a30)]">Industry</span>
                    <span className="font-semibold text-[var(--clr-primary-a50)]">{data.industry || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--clr-primary-a30)]">Employees</span>
                    <span className="font-semibold text-[var(--clr-primary-a50)] flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {data.employees ? formatLargeNumber(data.employees) : 'N/A'}
                    </span>
                  </div>
                  {data.website && (
                    <div className="flex justify-between">
                      <span className="text-[var(--clr-primary-a30)]">Website</span>
                      <a 
                        href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--clr-info-a40)] hover:text-[var(--clr-info-a45)] flex items-center gap-1 transition-colors"
                      >
                        Visit Site
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-[var(--clr-primary-a25)] border-t border-[var(--clr-surface-a20)] pt-6">
            Data last updated: {new Date(data.lastUpdated).toLocaleString()} • 
            Powered by Yahoo Finance
          </div>
        </div>
      </div>
    </>
  );
}