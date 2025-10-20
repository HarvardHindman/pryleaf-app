import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PortfolioWithHoldings, PortfolioStock, PortfolioHolding } from '@/lib/database.types';
import { PortfolioService } from '@/lib/portfolioService';

interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'remove';
  data: Record<string, unknown>;
  timestamp: number;
}

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const pendingActions = useRef<PendingAction[]>([]);
  const optimisticUpdateCount = useRef(0);

  // Helper to fetch prices and update portfolio stocks
  const fetchPricesAndUpdateStocks = useCallback(async (holdings: PortfolioHolding[]) => {
    // Fetch current prices for all holdings
    const symbols = holdings.map(h => h.symbol);
    const marketPrices: Record<string, { price: number; change: number; changePercent: number }> = {};
    
    // Fetch prices for all symbols
    if (symbols.length > 0) {
      try {
        const pricesResponse = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json();
          // pricesData is an object with symbol keys
          Object.keys(pricesData).forEach(symbol => {
            const data = pricesData[symbol];
            marketPrices[symbol] = {
              price: data.price || 0,
              change: data.change || 0,
              changePercent: data.changePercent || 0
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
        // Fall back to using cost basis as price
        holdings.forEach(h => {
          marketPrices[h.symbol] = {
            price: h.average_cost,
            change: 0,
            changePercent: 0
          };
        });
      }
    }
    
    const stocks = PortfolioService.convertToPortfolioStocks(holdings, marketPrices);
    setPortfolioStocks(stocks);
  }, []);

  // Helper to update portfolio stocks from holdings (synchronous, uses cost basis)
  const updatePortfolioStocksSync = useCallback((holdings: PortfolioHolding[]) => {
    // Use cost basis as price for immediate updates
    const marketPrices: Record<string, { price: number; change: number; changePercent: number }> = {};
    holdings.forEach(h => {
      marketPrices[h.symbol] = {
        price: h.average_cost, // Use cost basis as fallback
        change: 0,
        changePercent: 0
      };
    });
    const stocks = PortfolioService.convertToPortfolioStocks(holdings, marketPrices);
    setPortfolioStocks(stocks);
  }, []);

  // Helper to create temporary ID for optimistic updates
  const createOptimisticId = () => `optimistic-${Date.now()}-${++optimisticUpdateCount.current}`;

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const response = await fetch('/api/portfolio');
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      
      const portfolioData: PortfolioWithHoldings = await response.json();
      setPortfolio(portfolioData);
      
      // Convert to PortfolioStock format with real prices
      await fetchPricesAndUpdateStocks(portfolioData.holdings);
      
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [user, fetchPricesAndUpdateStocks]);

  // Optimistic add holding - immediate UI update, then sync with server
  const addHolding = useCallback(async (symbol: string, shares: number, averageCost: number, companyName?: string) => {
    const normalizedSymbol = symbol.toUpperCase().trim();
    const optimisticId = createOptimisticId();
    
    // Create optimistic holding
    const optimisticHolding: PortfolioHolding = {
      id: optimisticId,
      portfolio_id: portfolio?.id || '',
      symbol: normalizedSymbol,
      shares: Number(shares),
      average_cost: Number(averageCost),
      company_name: companyName?.trim() || `${normalizedSymbol} Company`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Immediately update UI (optimistic)
    setPortfolio(prev => {
      if (!prev) return prev;
      const newPortfolio = {
        ...prev,
        holdings: [...prev.holdings, optimisticHolding]
      };
      updatePortfolioStocksSync(newPortfolio.holdings);
      return newPortfolio;
    });
    
    // Track pending action
    const pendingAction: PendingAction = {
      id: optimisticId,
      type: 'add',
      data: { symbol: normalizedSymbol, shares, averageCost, companyName },
      timestamp: Date.now()
    };
    pendingActions.current.push(pendingAction);
    
    // Make API call in background
    try {
      setIsUpdating(true);
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: normalizedSymbol,
          shares,
          averageCost,
          companyName: companyName?.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add holding');
      }
      
      const { holding } = await response.json();
      
      // Replace optimistic entry with real data
      setPortfolio(prev => {
        if (!prev) return prev;
        const newPortfolio = {
          ...prev,
          holdings: prev.holdings.map(h => 
            h.id === optimisticId ? holding : h
          )
        };
        updatePortfolioStocksSync(newPortfolio.holdings);
        // Fetch real prices in background
        fetchPricesAndUpdateStocks(newPortfolio.holdings);
        return newPortfolio;
      });
      
      // Remove from pending actions
      pendingActions.current = pendingActions.current.filter(a => a.id !== optimisticId);
      return true;
      
    } catch (err) {
      console.error('Failed to add holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      
      // Rollback optimistic update
      setPortfolio(prev => {
        if (!prev) return prev;
        const newPortfolio = {
          ...prev,
          holdings: prev.holdings.filter(h => h.id !== optimisticId)
        };
        updatePortfolioStocksSync(newPortfolio.holdings);
        return newPortfolio;
      });
      
      pendingActions.current = pendingActions.current.filter(a => a.id !== optimisticId);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [portfolio?.id, updatePortfolioStocksSync, fetchPricesAndUpdateStocks]);

  // Optimistic update holding - immediate UI update, then sync with server
  const updateHolding = useCallback(async (holdingId: string, shares: number, averageCost: number) => {
    // Store original values for rollback
    const originalHolding = portfolio?.holdings.find(h => h.id === holdingId);
    if (!originalHolding) {
      console.error('Holding not found for update:', holdingId);
      return false;
    }
    
    // Immediately update UI (optimistic)
    setPortfolio(prev => {
      if (!prev) return prev;
      const newPortfolio = {
        ...prev,
        holdings: prev.holdings.map(h => 
          h.id === holdingId 
            ? { ...h, shares: Number(shares), average_cost: Number(averageCost), updated_at: new Date().toISOString() }
            : h
        )
      };
      updatePortfolioStocksSync(newPortfolio.holdings);
      return newPortfolio;
    });
    
    // Track pending action
    const pendingAction: PendingAction = {
      id: holdingId,
      type: 'update',
      data: { shares, averageCost, originalShares: originalHolding.shares, originalCost: originalHolding.average_cost },
      timestamp: Date.now()
    };
    pendingActions.current.push(pendingAction);
    
    // Make API call in background
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares, averageCost })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update holding');
      }
      
      const { holding } = await response.json();
      
      // Update with server response
      setPortfolio(prev => {
        if (!prev) return prev;
        const newPortfolio = {
          ...prev,
          holdings: prev.holdings.map(h => h.id === holdingId ? holding : h)
        };
        updatePortfolioStocksSync(newPortfolio.holdings);
        // Fetch real prices in background
        fetchPricesAndUpdateStocks(newPortfolio.holdings);
        return newPortfolio;
      });
      
      // Remove from pending actions
      pendingActions.current = pendingActions.current.filter(a => a.id !== holdingId);
      return true;
      
    } catch (err) {
      console.error('Failed to update holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      
      // Rollback optimistic update
      setPortfolio(prev => {
        if (!prev) return prev;
        const newPortfolio = {
          ...prev,
          holdings: prev.holdings.map(h => 
            h.id === holdingId 
              ? { ...h, shares: originalHolding.shares, average_cost: originalHolding.average_cost }
              : h
          )
        };
        updatePortfolioStocksSync(newPortfolio.holdings);
        return newPortfolio;
      });
      
      pendingActions.current = pendingActions.current.filter(a => a.id !== holdingId);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [portfolio?.holdings, updatePortfolioStocksSync, fetchPricesAndUpdateStocks]);

  // Optimistic remove holding - immediate UI update, then sync with server
  const removeHolding = useCallback(async (holdingId: string) => {
    // Store original holding for rollback
    const originalHolding = portfolio?.holdings.find(h => h.id === holdingId);
    if (!originalHolding) {
      console.error('Holding not found for removal:', holdingId);
      return false;
    }
    
    // Immediately update UI (optimistic) - remove the holding
    setPortfolio(prev => {
      if (!prev) return prev;
      const newPortfolio = {
        ...prev,
        holdings: prev.holdings.filter(h => h.id !== holdingId)
      };
      updatePortfolioStocksSync(newPortfolio.holdings);
      return newPortfolio;
    });
    
    // Track pending action
    const pendingAction: PendingAction = {
      id: holdingId,
      type: 'remove',
      data: { originalHolding },
      timestamp: Date.now()
    };
    pendingActions.current.push(pendingAction);
    
    // Make API call in background
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove holding');
      }
      
      // Remove from pending actions on success
      pendingActions.current = pendingActions.current.filter(a => a.id !== holdingId);
      return true;
      
    } catch (err) {
      console.error('Failed to remove holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      
      // Rollback optimistic update - restore the holding
      setPortfolio(prev => {
        if (!prev) return prev;
        const newPortfolio = {
          ...prev,
          holdings: [...prev.holdings, originalHolding]
        };
        updatePortfolioStocksSync(newPortfolio.holdings);
        return newPortfolio;
      });
      
      pendingActions.current = pendingActions.current.filter(a => a.id !== holdingId);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [portfolio?.holdings, updatePortfolioStocksSync, fetchPricesAndUpdateStocks]);

  // Find holding by symbol (for updates)
  const findHoldingBySymbol = useCallback((symbol: string) => {
    return portfolio?.holdings.find(h => h.symbol.toLowerCase() === symbol.toLowerCase());
  }, [portfolio]);

  // Calculate portfolio metrics
  const portfolioMetrics = portfolio ? PortfolioService.calculatePortfolioMetrics(portfolio.holdings) : null;

  // Load portfolio on mount and user change
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    portfolio,
    portfolioStocks,
    loading,
    error,
    isUpdating, // New: Shows when background sync is happening
    portfolioMetrics,
    // Actions
    fetchPortfolio,
    addHolding,
    updateHolding,
    removeHolding,
    findHoldingBySymbol,
    // Utils
    clearError: () => setError(null),
    // Optimistic state helpers
    hasPendingActions: () => pendingActions.current.length > 0,
    getPendingActions: () => pendingActions.current
  };
}
