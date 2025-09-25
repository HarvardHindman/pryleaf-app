'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import yahooFinance from 'yahoo-finance2';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, Globe, Plus, Search, X, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';

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
  const { 
    portfolioStocks, 
    portfolio, 
    loading: portfolioLoading, 
    error: portfolioError, 
    addHolding, 
    removeHolding,
    updateHolding,
    findHoldingBySymbol,
    portfolioMetrics 
  } = usePortfolio();
  
  // Pie chart hover state
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for input values to avoid API calls on every keystroke
  const [localInputs, setLocalInputs] = useState<Record<string, { shares: string; costBasis: string }>>({});
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize local inputs when portfolio data loads
  useEffect(() => {
    if (portfolioStocks.length > 0) {
      const newLocalInputs: Record<string, { shares: string; costBasis: string }> = {};
      portfolioStocks.forEach(stock => {
        newLocalInputs[stock.symbol] = {
          shares: stock.shares?.toString() || '0',
          costBasis: stock.costBasis?.toString() || '0'
        };
      });
      setLocalInputs(newLocalInputs);
    }
  }, [portfolioStocks]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

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
    
    try {
      // Try to get current market price for the symbol
      let currentPrice = Math.random() * 200 + 50; // Fallback random price
      try {
        const quote = await yahooFinance.quote(symbol);
        currentPrice = quote.regularMarketPrice || currentPrice;
      } catch (e) {
        console.warn(`Could not fetch price for ${symbol}, using fallback`);
      }

      const success = await addHolding(
        symbol,
        1, // Default to 1 share
        currentPrice, // Use current price as cost basis
        `${symbol} Company` // Default company name
      );

      if (success) {
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    const holding = findHoldingBySymbol(symbol);
    if (holding) {
      await removeHolding(holding.id);
    }
  };

  const calculateTotalValue = (stock: PortfolioStock) => {
    const shares = parseFloat(localInputs[stock.symbol]?.shares || stock.shares?.toString() || '0') || 0;
    return shares * stock.price;
  };

  const getTotalPortfolioValue = () => {
    return portfolioMetrics?.totalValue || 0;
  };

  const getTotalPortfolioChange = () => {
    return portfolioStocks.reduce((total, stock) => total + (stock.change * (stock.shares || 0)), 0);
  };

  const getPortfolioPercentage = (stock: PortfolioStock) => {
    const totalValue = getTotalPortfolioValue();
    if (totalValue === 0) return 0;
    return (calculateTotalValue(stock) / totalValue) * 100;
  };

  // Debounced function to update holding after user stops typing
  const debouncedUpdateHolding = useCallback(async (symbol: string, shares: number, costBasis: number) => {
    const holding = findHoldingBySymbol(symbol);
    if (holding) {
      try {
        await updateHolding(holding.id, shares, costBasis);
      } catch (error) {
        console.error('Failed to update holding:', error);
        // Optionally show a toast notification here
      }
    }
  }, [findHoldingBySymbol, updateHolding]);

  const handleSharesChange = (symbol: string, newShares: string) => {
    // Update local state immediately for responsive UI
    setLocalInputs(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        shares: newShares
      }
    }));

    // Clear existing timeout for this symbol
    if (debounceTimeouts.current[symbol]) {
      clearTimeout(debounceTimeouts.current[symbol]);
    }

    // Set new timeout for API call
    debounceTimeouts.current[symbol] = setTimeout(() => {
      const shares = parseFloat(newShares) || 0;
      const costBasis = parseFloat(localInputs[symbol]?.costBasis || '0') || 0;
      debouncedUpdateHolding(symbol, shares, costBasis);
    }, 1000); // 1 second delay
  };

  const handleCostBasisChange = (symbol: string, newCostBasis: string) => {
    // Update local state immediately for responsive UI
    setLocalInputs(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        costBasis: newCostBasis
      }
    }));

    // Clear existing timeout for this symbol
    if (debounceTimeouts.current[symbol]) {
      clearTimeout(debounceTimeouts.current[symbol]);
    }

    // Set new timeout for API call
    debounceTimeouts.current[symbol] = setTimeout(() => {
      const shares = parseFloat(localInputs[symbol]?.shares || '0') || 0;
      const costBasis = parseFloat(newCostBasis) || 0;
      debouncedUpdateHolding(symbol, shares, costBasis);
    }, 1000); // 1 second delay
  };

  const calculatePnL = (stock: PortfolioStock) => {
    const shares = parseFloat(localInputs[stock.symbol]?.shares || stock.shares?.toString() || '0') || 0;
    const costBasis = parseFloat(localInputs[stock.symbol]?.costBasis || stock.costBasis?.toString() || '0') || 0;
    if (!costBasis || !shares) return 0;
    return (stock.price - costBasis) * shares;
  };

  const calculatePnLPercentage = (stock: PortfolioStock) => {
    const costBasis = parseFloat(localInputs[stock.symbol]?.costBasis || stock.costBasis?.toString() || '0') || 0;
    if (!costBasis) return 0;
    return ((stock.price - costBasis) / costBasis) * 100;
  };

  const getTotalPnL = () => {
    return portfolioMetrics?.totalGainLoss || 0;
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
    <>
      {!user ? (
        // Welcome section for non-authenticated users
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-display text-text-primary mb-6">
              Welcome to Pryleaf
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Professional Financial Analysis Platform with Community Chat
            </p>
            
            <div className="dashboard-grid mb-12">
              <div className="card-elevated p-6 text-center">
                <BarChart3 className="h-12 w-12 text-info-text mx-auto mb-4" />
                <h3 className="text-heading mb-2">Portfolio Tracking</h3>
                <p className="text-caption">Track your investments with real-time data and interactive charts</p>
              </div>

              <div className="card-elevated p-6 text-center">
                <Users className="h-12 w-12 text-success-text mx-auto mb-4" />
                <h3 className="text-heading mb-2">Community Chat</h3>
                <p className="text-caption">Connect with other investors and share insights</p>
              </div>

              <div className="card-elevated p-6 text-center">
                <TrendingUp className="h-12 w-12 text-info-text mx-auto mb-4" />
                <h3 className="text-heading mb-2">Market Analysis</h3>
                <p className="text-caption">Get real-time market data and advanced analytics</p>
              </div>
            </div>
            
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Existing dashboard content for authenticated users
        <div className="p-6">
        <div className="mb-8">
          <h1 className="text-heading text-text-primary mb-2">Dashboard</h1>
          <p className="text-caption">Track your investments and market performance</p>
        </div>

        {/* Market Overview - Row of Cards */}
        <div className="mb-8">
          <h2 className="text-heading text-text-primary mb-4">Market Overview</h2>
          <div className="dashboard-grid">
            {marketData.map((index) => {
              const isPositive = index.change >= 0;
              const formatPrice = (price: number) => {
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(price);
              };

              return (
                <div key={index.symbol} className="market-card">
                  <div>
                    <h3 className="text-body text-text-primary text-xs mb-1 truncate font-semibold">{index.name}</h3>

                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-bold text-text-primary">
                        {formatPrice(index.price)}
                      </div>

                      <div className={`flex items-center space-x-1 text-xs ${
                        isPositive ? 'text-success-text' : 'text-danger-text'
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
        <div className="terminal-section">
          <div className="terminal-header px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-heading text-text-primary flex items-center">
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
          <div className="grid grid-cols-3 gap-0 border-b border-border-subtle">
            <div className="px-4 py-2 border-r border-border-subtle">
              <div className="text-xs font-medium text-text-subtle uppercase tracking-wide">Total Value</div>
              <div className="text-lg font-bold text-text-primary">
                {formatCurrency(getTotalPortfolioValue())}
              </div>
            </div>

            <div className="px-4 py-2 border-r border-border-subtle">
              <div className="text-xs font-medium text-text-subtle uppercase tracking-wide">Daily P&L</div>
              <div className={`text-lg font-bold ${getTotalPortfolioChange() >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
                {formatCurrencyChange(getTotalPortfolioChange())}
              </div>
            </div>

            <div className="px-4 py-2">
              <div className="text-xs font-medium text-text-subtle uppercase tracking-wide">Positions</div>
              <div className="text-lg font-bold text-text-primary">
                {portfolioStocks.length}
              </div>
            </div>
          </div>

          {/* Portfolio Holdings - Financial Terminal Style */}
          <div>
            {/* Header Row */}
            <div className="terminal-row bg-surface-secondary border-b border-border-subtle text-xs font-medium text-text-subtle uppercase tracking-wide">
              <div className="flex items-center">Symbol</div>
              <div className="flex items-center">Shares</div>
              <div className="flex items-center">Avg Cost</div>
              <div className="flex items-center">Market Value</div>
              <div className="flex items-center">% Portfolio</div>
              <div className="flex items-center">Last Price</div>
              <div className="flex items-center">Change</div>
              <div className="flex items-center">Profit</div>
              <div className="flex items-center">Actions</div>
            </div>
            
            {portfolioLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-text-muted">Loading portfolio...</p>
              </div>
            ) : portfolioError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-red-500 mb-4">Error loading portfolio</p>
                <p className="text-text-muted text-sm">{portfolioError}</p>
              </div>
            ) : portfolioStocks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-text-subtle mb-4">No positions in portfolio</p>
                <p className="text-text-muted text-sm">Use the search bar above to add your first position</p>
              </div>
            ) : (
              <div>
                {portfolioStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const totalValue = calculateTotalValue(stock);
                  const portfolioPercentage = getPortfolioPercentage(stock);

                  return (
                    <div key={stock.symbol} className="terminal-row border-b border-border-subtle">
                      {/* Symbol */}
                      <div className="flex items-center">
                        <div>
                          <div className="font-semibold text-text-primary text-sm">{stock.symbol}</div>
                          <div className="text-xs text-text-subtle truncate">{stock.name}</div>
                        </div>
                      </div>

                      {/* Shares - Always Editable Input */}
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={localInputs[stock.symbol]?.shares || stock.shares?.toString() || '0'}
                          onChange={(e) => handleSharesChange(stock.symbol, e.target.value)}
                          className="portfolio-input w-12"
                        />
                      </div>

                      {/* Average Cost Basis - Always Editable Input */}
                      <div className="flex items-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={localInputs[stock.symbol]?.costBasis || stock.costBasis?.toString() || '0'}
                          onChange={(e) => handleCostBasisChange(stock.symbol, e.target.value)}
                          className="portfolio-input w-14"
                        />
                      </div>

                      {/* Market Value */}
                      <div className="flex items-center">
                        <div className="font-medium text-text-primary text-sm">{formatCurrency(totalValue)}</div>
                      </div>

                      {/* Portfolio Percentage */}
                      <div className="flex items-center">
                        <div className="font-medium text-text-secondary text-sm">
                          {portfolioPercentage.toFixed(1)}%
                        </div>
                      </div>

                      {/* Last Price */}
                      <div className="flex items-center">
                        <div className="font-medium text-text-primary text-sm">{formatCurrency(stock.price)}</div>
                      </div>

                      {/* Change */}
                      <div className="flex items-center">
                        <div>
                          <div className={`font-medium text-sm ${
                            isPositive ? 'text-success-text' : 'text-danger-text'
                          }`}>
                            {formatCurrencyChange(stock.change)}
                          </div>
                          <div className={`text-xs ${
                            isPositive ? 'text-success-text' : 'text-danger-text'
                          }`}>
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Profit - Dollar gain/loss based on cost basis */}
                      <div className="flex items-center">
                        <div>
                          {(() => {
                            const profit = calculatePnL(stock);
                            const profitPercentage = calculatePnLPercentage(stock);
                            const isProfitable = profit >= 0;

                            return (
                              <>
                                <div className={`font-medium text-sm ${
                                  isProfitable ? 'text-success-text' : 'text-danger-text'
                                }`}>
                                  {formatCurrencyChange(profit)}
                                </div>
                                <div className={`text-xs ${
                                  isProfitable ? 'text-success-text' : 'text-danger-text'
                                }`}>
                                  {isProfitable ? '+' : ''}{profitPercentage.toFixed(2)}%
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStock(stock.symbol)}
                          className="text-text-muted hover:text-danger-text text-xs p-1"
                          disabled={portfolioLoading}
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
              <h3 className="text-sm font-medium text-text-subtle uppercase tracking-wide mb-4">Portfolio Allocation</h3>
              <div className="relative group">
                <svg width="300" height="300" viewBox="0 0 300 300" className="cursor-pointer transition-all duration-200">
                  {/* Background circle for donut effect */}
                  <circle
                    cx="150"
                    cy="150"
                    r="70"
                    fill="var(--surface-primary)"
                    stroke={hoveredPieIndex !== null ? "var(--interactive-primary)" : "var(--border-default)"}
                    strokeWidth="1"
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />

                  {/* Center text */}
                  <text
                    x="150"
                    y="145"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                    fill="var(--text-subtle)"
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {portfolioStocks.length}
                  </text>
                  <text
                    x="150"
                    y="160"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="400"
                    fill="var(--text-subtle)"
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Assets
                  </text>

                  {/* Render all segments for fills first */}
                  {portfolioStocks.map((stock, index) => {
                    const percentage = getPortfolioPercentage(stock);
                    const totalPercentageBefore = portfolioStocks.slice(0, index).reduce((sum, s) => sum + getPortfolioPercentage(s), 0);

                    if (percentage < 0.1) return null;

                    // Special handling for single stock (100% of portfolio)
                    const isSingleStock = portfolioStocks.length === 1;
                    
                    const startAngle = (totalPercentageBefore / 100) * 360;
                    const endAngle = isSingleStock ? 360 : ((totalPercentageBefore + percentage) / 100) * 360;

                    // Industry standard donut chart dimensions
                    const centerX = 150;
                    const centerY = 150;
                    const outerRadius = 120;
                    const innerRadius = 70;

                    // Convert angles to radians
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;

                    // Calculate path points
                    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
                    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
                    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
                    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

                    const innerX1 = centerX + innerRadius * Math.cos(endAngleRad);
                    const innerY1 = centerY + innerRadius * Math.sin(endAngleRad);
                    const innerX2 = centerX + innerRadius * Math.cos(startAngleRad);
                    const innerY2 = centerY + innerRadius * Math.sin(startAngleRad);

                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
                    const color = colors[index % colors.length];
                    const isHovered = hoveredPieIndex === index;

                    // For single stock, render as two semicircles to avoid SVG path issues
                    if (isSingleStock) {
                      return (
                        <g key={`fill-${stock.symbol}`}>
                          {/* First semicircle */}
                          <path
                            d={`M ${centerX + outerRadius} ${centerY}
                               A ${outerRadius} ${outerRadius} 0 0 1 ${centerX - outerRadius} ${centerY}
                               L ${centerX - innerRadius} ${centerY}
                               A ${innerRadius} ${innerRadius} 0 0 0 ${centerX + innerRadius} ${centerY}
                               Z`}
                            fill={color}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.5"
                            style={{
                              transform: isHovered ? 'scale(1.015)' : 'scale(1)',
                              transformOrigin: `${centerX}px ${centerY}px`,
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer',
                            }}
                          />
                          {/* Second semicircle */}
                          <path
                            d={`M ${centerX - outerRadius} ${centerY}
                               A ${outerRadius} ${outerRadius} 0 0 1 ${centerX + outerRadius} ${centerY}
                               L ${centerX + innerRadius} ${centerY}
                               A ${innerRadius} ${innerRadius} 0 0 0 ${centerX - innerRadius} ${centerY}
                               Z`}
                            fill={color}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.5"
                            style={{
                              transform: isHovered ? 'scale(1.015)' : 'scale(1)',
                              transformOrigin: `${centerX}px ${centerY}px`,
                              transition: 'all 0.15s ease-out',
                              cursor: 'pointer',
                            }}
                          />
                        </g>
                      );
                    }

                    return (
                      <path
                        key={`fill-${stock.symbol}`}
                        d={`M ${x1} ${y1}
                           A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                           L ${innerX1} ${innerY1}
                           A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
                           Z`}
                        fill={color}
                        stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.2)"}
                        strokeWidth={isHovered ? "2" : "0.5"}
                        style={{
                          filter: isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15)) brightness(1.05)' : 'none',
                          transform: isHovered ? 'scale(1.02) translateZ(0)' : 'scale(1) translateZ(0)',
                          transformOrigin: `${centerX}px ${centerY}px`,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredPieIndex(index)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                      />
                    );
                  })}

                  {/* Render only hovered segment border on top */}
                  {portfolioStocks.map((stock, index) => {
                    const percentage = getPortfolioPercentage(stock);
                    const totalPercentageBefore = portfolioStocks.slice(0, index).reduce((sum, s) => sum + getPortfolioPercentage(s), 0);

                    if (percentage < 0.1) return null;

                    const startAngle = (totalPercentageBefore / 100) * 360;
                    const endAngle = ((totalPercentageBefore + percentage) / 100) * 360;

                    // Industry standard donut chart dimensions
                    const centerX = 150;
                    const centerY = 150;
                    const outerRadius = 120;
                    const innerRadius = 70;

                    // Convert angles to radians
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;

                    // Calculate path points
                    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
                    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
                    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
                    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

                    const innerX1 = centerX + innerRadius * Math.cos(endAngleRad);
                    const innerY1 = centerY + innerRadius * Math.sin(endAngleRad);
                    const innerX2 = centerX + innerRadius * Math.cos(startAngleRad);
                    const innerY2 = centerY + innerRadius * Math.sin(startAngleRad);

                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    const isHovered = hoveredPieIndex === index;

                    if (!isHovered) return null;

                    return (
                      <path
                        key={`border-${stock.symbol}`}
                        d={`M ${x1} ${y1}
                           A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                           L ${innerX1} ${innerY1}
                           A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
                           Z`}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        style={{
                          transform: 'scale(1.015)',
                          transformOrigin: `${centerX}px ${centerY}px`,
                          transition: 'all 0.15s ease-out',
                          pointerEvents: 'none',
                        }}
                      />
                    );
                  })}
                </svg>
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
                      className="flex items-center space-x-2 bg-[var(--surface-tertiary)] rounded px-2 py-1 shadow-sm transition-all duration-150"
                      style={{
                        fontWeight: 500,
                        color: greyed ? 'var(--text-subtle)' : isHovered ? 'var(--info-text)' : undefined,
                        opacity: greyed ? 0.5 : 1,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredPieIndex(index)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: greyed ? 'var(--border-subtle)' : color }}></span>
                      <span className="text-xs font-medium">{stock.symbol}</span>
                      <span className="text-xs text-[var(--text-muted)]">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}