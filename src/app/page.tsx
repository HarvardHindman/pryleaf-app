'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

// Price updates are now handled by the optimistic portfolio hook
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, Globe, Plus, Search, X, Briefcase, ArrowRight, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { formatCurrency } from '@/lib/formatters';
import TickerSearch from '@/components/TickerSearch';
import NewsCarousel from '@/components/NewsCarousel';
import ActivityFeed from '@/components/ActivityFeed';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';
import CommunityCTABanner from '@/components/dashboard/CommunityCTABanner';

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
  const { user, onboardingCompleted, onboardingDismissedAt } = useAuth();
  const router = useRouter();
  const { hasCommunities } = useCommunityCache();
  const { 
    portfolioStocks, 
    portfolio, 
    loading: portfolioLoading, 
    error: portfolioError, 
    isUpdating,
    addHolding, 
    removeHolding,
    updateHolding,
    findHoldingBySymbol,
    portfolioMetrics,
    hasPendingActions 
  } = usePortfolio();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [openMenuSymbol, setOpenMenuSymbol] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync input fields with latest portfolio data
  useEffect(() => {
    const newShares: Record<string, string> = {};
    const newCosts: Record<string, string> = {};
    portfolioStocks.forEach((s) => {
      newShares[s.symbol] = (s.shares ?? 0).toString();
      newCosts[s.symbol] = (s.costBasis ?? 0).toString();
    });
    setShareInputs(newShares);
    setCostInputs(newCosts);
  }, [portfolioStocks]);

  // Close action menu on any document click
  useEffect(() => {
    const handleDocClick = () => setOpenMenuSymbol(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Redirect to landing page if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/landing');
    }
  }, [user, router]);

  // Show onboarding modal for first-time users
  useEffect(() => {
    if (user && !onboardingCompleted && !hasCommunities()) {
      // Small delay to ensure smooth transition after login
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, onboardingCompleted, hasCommunities]);


  // Note: Real-time price updates would be handled by the portfolio service
  // For now, we use static prices from the portfolio data

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
      // Use a default price for new holdings (users can update cost basis later)
      const defaultPrice = 100; // Default price of $100
      
      const success = await addHolding(
        symbol,
        1, // Default to 1 share
        defaultPrice, // Use default price as cost basis
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
    const shares = stock.shares || 0;
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

  // Commit changes only on blur or Enter
  const commitSharesChange = async (symbol: string) => {
    const holding = findHoldingBySymbol(symbol);
    if (!holding) return;
    const raw = (shareInputs[symbol] ?? '').trim();
    if (raw === '') return;
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed === holding.shares) return;
    await updateHolding(holding.id, parsed, holding.average_cost);
  };

  const commitCostChange = async (symbol: string) => {
    const holding = findHoldingBySymbol(symbol);
    if (!holding) return;
    const raw = (costInputs[symbol] ?? '').trim();
    if (raw === '') return;
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed === holding.average_cost) return;
    await updateHolding(holding.id, holding.shares, parsed);
  };

  const calculatePnL = (stock: PortfolioStock) => {
    const shares = stock.shares || 0;
    const costBasis = stock.costBasis || 0;
    if (!costBasis || !shares) return 0;
    return (stock.price - costBasis) * shares;
  };

  const calculatePnLPercentage = (stock: PortfolioStock) => {
    const costBasis = stock.costBasis || 0;
    if (!costBasis) return 0;
    return ((stock.price - costBasis) / costBasis) * 100;
  };

  const getTotalPnL = () => {
    return portfolioMetrics?.totalGainLoss || 0;
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
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />

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
        {/* Community CTA Banner - Show if user has no communities and hasn't dismissed recently */}
        {!hasCommunities() && (() => {
          // Check if dismissal was within last 7 days
          if (onboardingDismissedAt) {
            const dismissalDate = new Date(onboardingDismissedAt);
            const daysSinceDismissal = (Date.now() - dismissalDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissal < 7) {
              return null; // Don't show banner if dismissed within 7 days
            }
          }
          return (
            <div className="mb-6">
              <CommunityCTABanner />
            </div>
          );
        })()}

        {/* Market Overview - Terminal Strip Style */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-1"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {marketData.map((index, i) => {
              const isPositive = index.change >= 0;
              const formatPrice = (price: number) => {
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(price);
              };

              return (
                <div 
                  key={index.symbol} 
                  className="flex items-center gap-3 px-3 py-1.5 whitespace-nowrap"
                  style={{ 
                    borderRight: i < marketData.length - 1 ? '1px solid var(--border-divider, var(--border-subtle))' : 'none'
                  }}
                >
                  <span 
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {index.symbol.replace('^', '')}
                  </span>
                  <span 
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatPrice(index.price)}
                  </span>
                  <span 
                    className="text-xs font-medium tabular-nums flex items-center gap-0.5"
                    style={{ color: isPositive ? 'var(--success-text)' : 'var(--danger-text)' }}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Layout: Portfolio (left) + Activity/News (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Portfolio Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="terminal-section">
          <div className="terminal-header px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Briefcase className="h-4 w-4" style={{ color: 'var(--interactive-primary)' }} />
                Portfolio
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

          {/* Portfolio Summary - Refined Stats Bar */}
          <div 
            className="grid grid-cols-3 gap-0"
            style={{ 
              borderBottom: '1px solid var(--border-divider, var(--border-subtle))',
              backgroundColor: 'var(--surface-inset, var(--surface-tertiary))'
            }}
          >
            <div 
              className="px-5 py-3 relative"
              style={{ borderRight: '1px solid var(--border-divider, var(--border-subtle))' }}
            >
              <div 
                className="text-xs font-medium uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-subtle)' }}
              >
                Total Value
              </div>
              <div 
                className="text-xl font-semibold tabular-nums flex items-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatCurrency(getTotalPortfolioValue())}
                {isUpdating && hasPendingActions() && (
                  <div 
                    className="ml-2 w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  />
                )}
              </div>
            </div>

            <div 
              className="px-5 py-3"
              style={{ borderRight: '1px solid var(--border-divider, var(--border-subtle))' }}
            >
              <div 
                className="text-xs font-medium uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-subtle)' }}
              >
                Daily P&L
              </div>
              <div 
                className="text-xl font-semibold tabular-nums"
                style={{ color: getTotalPortfolioChange() >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}
              >
                {formatCurrencyChange(getTotalPortfolioChange())}
              </div>
            </div>

            <div className="px-5 py-3">
              <div 
                className="text-xs font-medium uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-subtle)' }}
              >
                Positions
              </div>
              <div 
                className="text-xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {portfolioStocks.length}
              </div>
            </div>
          </div>

          {/* Portfolio Holdings - Financial Terminal Style */}
          <div>
            {/* Header Row */}
            <div 
              className="terminal-row text-xs font-medium uppercase tracking-wider"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderBottom: '1px solid var(--border-divider, var(--border-subtle))',
                color: 'var(--text-subtle)'
              }}
            >
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
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div 
                    className="h-8 w-8 rounded-full animate-spin mb-3"
                    style={{ 
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: 'var(--border-subtle)',
                      borderTopColor: 'var(--interactive-primary)'
                    }}
                  />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading portfolio...</p>
                </div>
              </div>
            ) : portfolioError ? (
              <div className="px-6 py-12 text-center">
                <p className="mb-2" style={{ color: 'var(--danger-text)' }}>Error loading portfolio</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{portfolioError}</p>
              </div>
            ) : portfolioStocks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-inset, var(--surface-tertiary))' }}
                >
                  <Briefcase className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No positions yet</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Use the search bar above to add your first position</p>
              </div>
            ) : (
              <div>
                {portfolioStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const totalValue = calculateTotalValue(stock);
                  const portfolioPercentage = getPortfolioPercentage(stock);

                  return (
                    <div 
                      key={stock.symbol} 
                      className="terminal-row"
                      style={{ borderBottom: '1px solid var(--border-divider, var(--border-subtle))' }}
                    >
                      {/* Symbol */}
                      <div className="flex items-center">
                        <div>
                          <div 
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {stock.symbol}
                          </div>
                          <div 
                            className="text-xs truncate max-w-[120px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {stock.name}
                          </div>
                        </div>
                      </div>

                      {/* Shares - Always Editable Input with optimistic updates */}
                      <div className="flex items-center relative">
                        <Input
                          type="number"
                          value={shareInputs[stock.symbol] ?? stock.shares?.toString() ?? '0'}
                          onChange={(e) => {
                            e.stopPropagation();
                            setShareInputs((prev) => ({ ...prev, [stock.symbol]: e.target.value }));
                          }}
                          onBlur={() => commitSharesChange(stock.symbol)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitSharesChange(stock.symbol);
                            }
                          }}
                          className="portfolio-input w-16"
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Average Cost Basis - Always Editable Input with optimistic updates */}
                      <div className="flex items-center relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={costInputs[stock.symbol] ?? stock.costBasis?.toString() ?? '0'}
                          onChange={(e) => {
                            e.stopPropagation();
                            setCostInputs((prev) => ({ ...prev, [stock.symbol]: e.target.value }));
                          }}
                          onBlur={() => commitCostChange(stock.symbol)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitCostChange(stock.symbol);
                            }
                          }}
                          className="portfolio-input w-20"
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Market Value */}
                      <div className="flex items-center">
                        <div 
                          className="font-medium text-sm tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatCurrency(totalValue)}
                        </div>
                      </div>

                      {/* Portfolio Percentage */}
                      <div className="flex items-center">
                        <div 
                          className="text-sm tabular-nums px-2 py-0.5 rounded"
                          style={{ 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--surface-inset, var(--surface-tertiary))'
                          }}
                        >
                          {portfolioPercentage.toFixed(1)}%
                        </div>
                      </div>

                      {/* Last Price */}
                      <div className="flex items-center">
                        <div 
                          className="font-medium text-sm tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatCurrency(stock.price)}
                        </div>
                      </div>

                      {/* Change */}
                      <div className="flex items-center">
                        <div>
                          <div 
                            className="font-medium text-sm tabular-nums"
                            style={{ color: isPositive ? 'var(--success-text)' : 'var(--danger-text)' }}
                          >
                            {formatCurrencyChange(stock.change)}
                          </div>
                          <div 
                            className="text-xs tabular-nums"
                            style={{ color: isPositive ? 'var(--success-text)' : 'var(--danger-text)' }}
                          >
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
                                <div 
                                  className="font-medium text-sm tabular-nums"
                                  style={{ color: isProfitable ? 'var(--success-text)' : 'var(--danger-text)' }}
                                >
                                  {formatCurrencyChange(profit)}
                                </div>
                                <div 
                                  className="text-xs tabular-nums"
                                  style={{ color: isProfitable ? 'var(--success-text)' : 'var(--danger-text)' }}
                                >
                                  {isProfitable ? '+' : ''}{profitPercentage.toFixed(2)}%
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuSymbol((prev) => (prev === stock.symbol ? null : stock.symbol));
                          }}
                          className="p-1 rounded-md transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          disabled={portfolioLoading || isUpdating}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {openMenuSymbol === stock.symbol && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-10 w-36 rounded-lg overflow-hidden"
                            style={{ 
                              backgroundColor: 'var(--surface-elevated, var(--surface-primary))',
                              border: '1px solid var(--border-default)',
                              boxShadow: 'var(--shadow-lg)'
                            }}
                          >
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
                              style={{ color: 'var(--danger-text)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--danger-background)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              onClick={() => {
                                setOpenMenuSymbol(null);
                                handleRemoveStock(stock.symbol);
                              }}
                              disabled={portfolioLoading || isUpdating}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

            </div>
          </div>

          {/* Right Sidebar: Activity + News */}
          <div className="lg:col-span-1 flex flex-col gap-4 lg:min-h-[500px]">
            <div className="flex-1 min-h-0">
              <ActivityFeed />
            </div>
            <div className="flex-1 min-h-0">
              <NewsCarousel tickers={portfolioStocks.map(s => s.symbol)} />
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}