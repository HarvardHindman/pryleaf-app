'use client';

import { useState, useEffect } from 'react';

import yahooFinance from 'yahoo-finance2';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, Globe, Plus, Search, X, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import TickerSearch from '@/components/TickerSearch';

interface PortfolioStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares?: number;
  costBasis?: number;
  addedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  // Pie chart hover state
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([
    // Mock data for demonstration
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      changePercent: 1.24,
      shares: 10,
      costBasis: 150.00,
      addedAt: '2024-01-15'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: -1.45,
      changePercent: -0.38,
      shares: 5,
      costBasis: 320.00,
      addedAt: '2024-01-10'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.56,
      change: 0.89,
      changePercent: 0.63,
      shares: 7,
      costBasis: 130.00,
      addedAt: '2024-01-08'
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real price data for portfolio tickers (must be after state declarations)
  useEffect(() => {
    async function fetchPrices() {
      if (portfolioStocks.length === 0) return;
      try {
        const symbols = portfolioStocks.map((s: PortfolioStock) => s.symbol);
        const results = await Promise.all(symbols.map((symbol: string) =>
          yahooFinance.quote(symbol)
        ));
        setPortfolioStocks((prev: PortfolioStock[]) => prev.map((stock, i) => {
          const quote = results[i];
          if (!quote || !quote.regularMarketPrice) return stock;
          return {
            ...stock,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            name: quote.shortName || stock.name,
          };
        }));
      } catch (e) {
        // Ignore errors for now
      }
    }
    fetchPrices();
    // Optionally, refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [portfolioStocks.length]);

  const marketData = [
    { symbol: '^IXIC', name: 'NASDAQ Composite', price: 22631.477, change: 160.75, changePercent: 0.72 },
    { symbol: '^RUT', name: 'Russell 2000', price: 2448.769, change: -18.93, changePercent: -0.77 },
    { symbol: '^FTSE', name: 'FTSE 100', price: 9216.67, change: -11.44, changePercent: -0.12 },
    { symbol: '^N225', name: 'Nikkei 225', price: 45045.81, change: -257.62, changePercent: -0.57 },
    { symbol: '^GSPTSE', name: 'S&P/TSX 60 Index', price: 1761.78, change: 18.35, changePercent: 1.05 },
    { symbol: '^GSPC', name: 'S&P 500', price: 6664.36, change: 32.40, changePercent: 0.49 },
    { symbol: '^DJI', name: 'Dow Jones Industrial Average', price: 46315.27, change: 0, changePercent: 0 },
  ];

  // Portfolio functions
  const handleAddStock = async (symbolArg?: string) => {
    const symbol = symbolArg ? symbolArg.trim().toUpperCase() : searchQuery.trim().toUpperCase();
    if (!symbol) return;
    // In a real app, this would search for the stock and add it
    // For now, we'll just show the UI flow
    const randomPrice = Math.random() * 200 + 50;
    const newStock: PortfolioStock = {
      symbol,
      name: `${symbol} Company`,
      price: randomPrice,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      shares: 1,
      costBasis: randomPrice, // Set cost basis to current price
      addedAt: new Date().toISOString().split('T')[0]
    };
    setPortfolioStocks([...portfolioStocks, newStock]);
    setSearchQuery('');
  };

  const handleRemoveStock = (symbol: string) => {
    setPortfolioStocks(portfolioStocks.filter(stock => stock.symbol !== symbol));
  };

  const calculateTotalValue = (stock: PortfolioStock) => {
    return (stock.shares || 0) * stock.price;
  };

  const getTotalPortfolioValue = () => {
    return portfolioStocks.reduce((total, stock) => total + calculateTotalValue(stock), 0);
  };

  const getTotalPortfolioChange = () => {
    return portfolioStocks.reduce((total, stock) => total + (stock.change * (stock.shares || 0)), 0);
  };

  const getPortfolioPercentage = (stock: PortfolioStock) => {
    const totalValue = getTotalPortfolioValue();
    if (totalValue === 0) return 0;
    return (calculateTotalValue(stock) / totalValue) * 100;
  };

  const handleSharesChange = (symbol: string, newShares: number) => {
    setPortfolioStocks(portfolioStocks.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, shares: Math.max(0, newShares) }
        : stock
    ));
  };

  const handleCostBasisChange = (symbol: string, newCostBasis: number) => {
    setPortfolioStocks(portfolioStocks.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, costBasis: Math.max(0, newCostBasis) }
        : stock
    ));
  };

  const calculatePnL = (stock: PortfolioStock) => {
    if (!stock.costBasis || !stock.shares) return 0;
    return (stock.price - stock.costBasis) * stock.shares;
  };

  const calculatePnLPercentage = (stock: PortfolioStock) => {
    if (!stock.costBasis) return 0;
    return ((stock.price - stock.costBasis) / stock.costBasis) * 100;
  };

  const getTotalPnL = () => {
    return portfolioStocks.reduce((total, stock) => total + calculatePnL(stock), 0);
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatCurrencyChange = (change: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always'
    }).format(change);
  };

  return (
    <AppLayout>
      {!user ? (
        // Welcome section for non-authenticated users
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[var(--clr-primary-a50)] mb-6">
              Welcome to Pryleaf
            </h1>
            <p className="text-xl text-[var(--clr-primary-a30)] mb-8">
              Professional Financial Analysis Platform with Community Chat
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-[var(--clr-info-a40)] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Portfolio Tracking</h3>
                  <p className="text-[var(--clr-primary-a30)] text-sm">Track your investments with real-time data and interactive charts</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-[var(--clr-success-a40)] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Community Chat</h3>
                  <p className="text-[var(--clr-primary-a30)] text-sm">Connect with other investors and share insights</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-[var(--clr-info-a35)] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Market Analysis</h3>
                  <p className="text-[var(--clr-primary-a30)] text-sm">Get real-time market data and advanced analytics</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-x-4">
              <Button asChild size="lg">
                <a href="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Existing dashboard content for authenticated users
        <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--clr-primary-a50)] mb-2">Dashboard</h1>
          <p className="text-[var(--clr-primary-a30)]">Track your investments and market performance</p>
        </div>

        {/* Market Overview - Row of Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--clr-primary-a50)] mb-4">Market Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {marketData.map((index) => {
              const isPositive = index.change >= 0;
              const formatPrice = (price: number) => {
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(price);
              };
              
              return (
                <div key={index.symbol} className="bg-[var(--clr-surface-a5)] border border-[var(--clr-surface-a15)] rounded-lg hover:shadow-md transition-shadow px-2 py-1">
                  <div>
                    <h3 className="font-semibold text-[var(--clr-primary-a50)] text-xs mb-1 truncate">{index.name}</h3>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-bold text-[var(--clr-primary-a50)]">
                        {formatPrice(index.price)}
                      </div>
                      
                      <div className={`flex items-center space-x-1 text-xs ${
                        isPositive ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="h-2 w-2" />
                        ) : (
                          <TrendingDown className="h-2 w-2" />
                        )}
                        <span className="font-medium">
                          {isPositive ? '+' : ''}{index.change}
                        </span>
                        <span>
                          ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Section - Financial Terminal Style */}
        <div className="bg-[var(--clr-surface-a5)] border border-[var(--clr-surface-a15)] rounded-lg">
          <div className="border-b border-[var(--clr-surface-a20)] px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--clr-primary-a50)] flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                PORTFOLIO
              </h2>
              <div className="flex items-center space-x-2">
                {/* Add Position Autocomplete Search */}
                <div className="w-80">
                  <TickerSearch
                    onSelectTicker={(symbol: string) => {
                      handleAddStock(symbol);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Summary - Financial Terminal Style */}
          <div className="grid grid-cols-3 gap-0 border-b border-[var(--clr-surface-a20)]">
            <div className="px-4 py-2 border-r border-[var(--clr-surface-a20)]">
              <div className="text-xs font-medium text-[var(--clr-primary-a25)] uppercase tracking-wide">Total Value</div>
              <div className="text-lg font-bold text-[var(--clr-primary-a50)]">
                {formatCurrency(getTotalPortfolioValue())}
              </div>
            </div>
            
            <div className="px-4 py-2 border-r border-[var(--clr-surface-a20)]">
              <div className="text-xs font-medium text-[var(--clr-primary-a25)] uppercase tracking-wide">Daily P&L</div>
              <div className={`text-lg font-bold ${getTotalPortfolioChange() >= 0 ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'}`}>
                {formatCurrencyChange(getTotalPortfolioChange())}
              </div>
            </div>
            
            <div className="px-4 py-2">
              <div className="text-xs font-medium text-[var(--clr-primary-a25)] uppercase tracking-wide">Positions</div>
              <div className="text-lg font-bold text-[var(--clr-primary-a50)]">
                {portfolioStocks.length}
              </div>
            </div>
          </div>

          {/* Portfolio Holdings - Financial Terminal Style */}
          <div>
            {/* Header Row */}
            <div className="grid grid-cols-9 gap-4 px-4 py-2 bg-[var(--clr-surface-a10)] border-b border-[var(--clr-surface-a20)] text-xs font-medium text-[var(--clr-primary-a25)] uppercase tracking-wide">
              <div>Symbol</div>
              <div className="text-center">Shares</div>
              <div className="text-right">Avg Cost</div>
              <div className="text-right">Market Value</div>
              <div className="text-right">% Portfolio</div>
              <div className="text-right">Last Price</div>
              <div className="text-right">Change</div>
              <div className="text-right">Profit</div>
              <div></div>
            </div>
            
            {portfolioStocks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[var(--clr-primary-a25)] mb-4">No positions in portfolio</p>
                <p className="text-[var(--clr-primary-a20)] text-sm">Use the search bar above to add your first position</p>
              </div>
            ) : (
              <div>
                {portfolioStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const totalValue = calculateTotalValue(stock);
                  const portfolioPercentage = getPortfolioPercentage(stock);
                  
                  return (
                    <div key={stock.symbol} className="grid grid-cols-9 gap-4 px-4 py-2 hover:bg-[var(--clr-surface-a10)] border-b border-[var(--clr-surface-a15)] transition-colors">
                      {/* Symbol */}
                      <div>
                        <div className="font-semibold text-[var(--clr-primary-a50)] text-sm">{stock.symbol}</div>
                        <div className="text-xs text-[var(--clr-primary-a25)] truncate">{stock.name}</div>
                      </div>
                      
                      {/* Shares - Always Editable Input */}
                      <div className="text-center">
                        <Input
                          type="number"
                          value={stock.shares || 0}
                          onChange={(e) => handleSharesChange(stock.symbol, parseInt(e.target.value) || 0)}
                          className="w-16 h-6 text-xs text-center p-1 border border-[var(--clr-surface-a25)] rounded"
                        />
                      </div>
                      
                      {/* Average Cost Basis - Always Editable Input */}
                      <div className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={stock.costBasis || 0}
                          onChange={(e) => handleCostBasisChange(stock.symbol, parseFloat(e.target.value) || 0)}
                          className="w-20 h-6 text-xs text-right p-1 border border-[var(--clr-surface-a25)] rounded"
                        />
                      </div>
                      
                      {/* Market Value */}
                      <div className="text-right">
                        <div className="font-medium text-[var(--clr-primary-a50)] text-sm">{formatCurrency(totalValue)}</div>
                      </div>
                      
                      {/* Portfolio Percentage */}
                      <div className="text-right">
                        <div className="font-medium text-[var(--clr-primary-a30)] text-sm">
                          {portfolioPercentage.toFixed(1)}%
                        </div>
                      </div>
                      
                      {/* Last Price */}
                      <div className="text-right">
                        <div className="font-medium text-[var(--clr-primary-a50)] text-sm">{formatCurrency(stock.price)}</div>
                      </div>
                      
                      {/* Change */}
                      <div className="text-right">
                        <div className={`font-medium text-sm ${
                          isPositive ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'
                        }`}>
                          {formatCurrencyChange(stock.change)}
                        </div>
                        <div className={`text-xs ${
                          isPositive ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'
                        }`}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      
                      {/* Profit - Dollar gain/loss based on cost basis */}
                      <div className="text-right">
                        {(() => {
                          const profit = calculatePnL(stock);
                          const profitPercentage = calculatePnLPercentage(stock);
                          const isProfitable = profit >= 0;
                          
                          return (
                            <>
                              <div className={`font-medium text-sm ${
                                isProfitable ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'
                              }`}>
                                {formatCurrencyChange(profit)}
                              </div>
                              <div className={`text-xs ${
                                isProfitable ? 'text-[var(--clr-success-a45)]' : 'text-[var(--clr-danger-a45)]'
                              }`}>
                                {isProfitable ? '+' : ''}{profitPercentage.toFixed(2)}%
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Actions */}
                      <div className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStock(stock.symbol)}
                          className="text-[var(--clr-primary-a20)] hover:text-[var(--clr-danger-a45)] text-xs p-1"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Portfolio Charts */}
          {/* Portfolio Allocation Pie Chart (restored) */}
          {portfolioStocks.length > 0 && (
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-sm font-medium text-[var(--clr-primary-a25)] uppercase tracking-wide mb-4">Portfolio Allocation</h3>
              <div className="relative group">
                <svg width="320" height="320" viewBox="0 0 320 320" className="transform -rotate-90 drop-shadow-lg rounded-full border-4 border-[var(--clr-surface-a5)] bg-[var(--clr-surface-a5)] cursor-pointer">
                  {portfolioStocks.map((stock, index) => {
                    const percentage = getPortfolioPercentage(stock);
                    const totalPercentageBefore = portfolioStocks.slice(0, index).reduce((sum, s) => sum + getPortfolioPercentage(s), 0);
                    const startAngle = (totalPercentageBefore / 100) * 360;
                    const endAngle = ((totalPercentageBefore + percentage) / 100) * 360;
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    const x1 = 160 + 140 * Math.cos(startAngleRad);
                    const y1 = 160 + 140 * Math.sin(startAngleRad);
                    const x2 = 160 + 140 * Math.cos(endAngleRad);
                    const y2 = 160 + 140 * Math.sin(endAngleRad);
                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
                    const color = colors[index % colors.length];
                    if (percentage < 0.1) return null;
                    const isHovered = hoveredPieIndex === index;
                    return (
                      <path
                        key={stock.symbol}
                        d={`M 160 160 L ${x1} ${y1} A 140 140 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={color}
                        stroke="#fff"
                        strokeWidth="3"
                        style={{
                          filter: isHovered ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))',
                          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          transformOrigin: '160px 160px',
                          transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), filter 0.18s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredPieIndex(index)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                      />
                    );
                  })}
                </svg>
                {/* Center circle for donut effect */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--clr-surface-a5)] rounded-full shadow-inner border-2 border-[var(--clr-surface-a15)] flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-[var(--clr-primary-a25)] font-semibold">{portfolioStocks.length} Assets</span>
                </div>
              </div>
              {/* Modern Legend with highlight */}
              <div className="flex flex-wrap justify-center mt-4 gap-2">
                {portfolioStocks.map((stock, index) => {
                  const percentage = getPortfolioPercentage(stock);
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
                  const color = colors[index % colors.length];
                  if (percentage < 0.1) return null;
                  const isHovered = hoveredPieIndex === index;
                  const isAnyHovered = hoveredPieIndex !== null;
                  const greyed = isAnyHovered && !isHovered;
                  return (
                    <div
                      key={stock.symbol}
                      className={`flex items-center space-x-2 bg-[var(--clr-surface-a10)] rounded px-2 py-1 shadow-sm transition-all duration-150 ${isHovered ? 'ring-2 ring-[var(--clr-info-a40)] bg-[var(--clr-info-a10)]' : ''}`}
                      style={{
                        fontWeight: isHovered ? 700 : 500,
                        color: greyed ? 'var(--clr-primary-a15)' : isHovered ? 'var(--clr-info-a45)' : undefined,
                        opacity: greyed ? 0.5 : 1,
                        boxShadow: isHovered ? '0 2px 8px rgba(37,99,235,0.10)' : undefined,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredPieIndex(index)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: greyed ? 'var(--clr-surface-a25)' : color }}></span>
                      <span className="text-xs font-medium">{stock.symbol}</span>
                      <span className="text-xs text-[var(--clr-primary-a20)]">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </AppLayout>
  );
}