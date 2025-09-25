import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioCache } from '@/contexts/PortfolioCacheContext';
import type { PortfolioWithHoldings, PortfolioStock } from '@/lib/database.types';
import { PortfolioService } from '@/lib/portfolioService';

export function usePortfolio() {
  const { user } = useAuth();
  const {
    portfolio: cachedPortfolio,
    portfolioStocks: cachedStocks,
    updatePortfolio,
    updatePortfolioStocks,
    invalidateCache,
    isStale
  } = usePortfolioCache();
  
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(cachedPortfolio);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>(cachedStocks);
  const [loading, setLoading] = useState(!cachedPortfolio);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolio data with stale-while-revalidate
  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // If we have cached data and it's not stale, don't fetch unless forced
    if (cachedPortfolio && !isStale && !forceRefresh) {
      setPortfolio(cachedPortfolio);
      setPortfolioStocks(cachedStocks);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/portfolio');
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      
      const portfolioData: PortfolioWithHoldings = await response.json();
      setPortfolio(portfolioData);
      updatePortfolio(portfolioData);
      
      // Convert to PortfolioStock format for existing UI components
      const stocks = PortfolioService.convertToPortfolioStocks(portfolioData.holdings);
      setPortfolioStocks(stocks);
      updatePortfolioStocks(stocks);
      
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [user, cachedPortfolio, cachedStocks, isStale, updatePortfolio, updatePortfolioStocks]);

  // Add a new holding with optimistic UI
  const addHolding = useCallback(async (symbol: string, shares: number, averageCost?: number, companyName?: string, useCurrentPrice?: boolean) => {
    // Create optimistic holding
    const optimisticHolding: Holding = {
      id: `temp-${Date.now()}`, // Temporary ID
      portfolio_id: portfolio?.id || '',
      symbol: symbol.toUpperCase().trim(),
      company_name: companyName?.trim() || '',
      shares: Number(shares),
      average_cost: Number(averageCost || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update UI immediately (optimistic)
    if (portfolio) {
      const updatedPortfolio = {
        ...portfolio,
        holdings: [...portfolio.holdings, optimisticHolding]
      };
      setPortfolio(updatedPortfolio);
      updatePortfolio(updatedPortfolio);
      
      // Update portfolio stocks for existing UI components
      const newStock = PortfolioService.convertToPortfolioStocks([optimisticHolding])[0];
      const updatedStocks = [...portfolioStocks, newStock];
      setPortfolioStocks(updatedStocks);
      updatePortfolioStocks(updatedStocks);
    }

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          shares,
          averageCost,
          companyName: companyName?.trim(),
          useCurrentPrice
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add holding');
      }
      
      // Replace optimistic holding with real data
      const { holding } = await response.json();
      if (portfolio) {
        const updatedPortfolio = {
          ...portfolio,
          holdings: portfolio.holdings.map(h => 
            h.id === optimisticHolding.id ? holding : h
          )
        };
        setPortfolio(updatedPortfolio);
        updatePortfolio(updatedPortfolio);
        
        // Update portfolio stocks
        const updatedStock = PortfolioService.convertToPortfolioStocks([holding])[0];
        const updatedStocks = portfolioStocks.map(s => s.symbol === holding.symbol ? updatedStock : s);
        setPortfolioStocks(updatedStocks);
        updatePortfolioStocks(updatedStocks);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to add holding:', err);
      
      // Rollback optimistic update
      if (portfolio) {
        const updatedPortfolio = {
          ...portfolio,
          holdings: portfolio.holdings.filter(h => h.id !== optimisticHolding.id)
        };
        setPortfolio(updatedPortfolio);
        updatePortfolio(updatedPortfolio);
        
        // Remove from portfolio stocks
        const updatedStocks = portfolioStocks.filter(s => s.symbol !== optimisticHolding.symbol);
        setPortfolioStocks(updatedStocks);
        updatePortfolioStocks(updatedStocks);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      return false;
    }
  }, [portfolio, fetchPortfolio]);

  // Update an existing holding with optimistic UI
  const updateHolding = useCallback(async (holdingId: string, shares: number, averageCost: number) => {
    // Store original values for rollback
    const originalHolding = portfolio?.holdings.find(h => h.id === holdingId);
    if (!originalHolding) return false;

    // Create optimistic update
    const optimisticHolding = {
      ...originalHolding,
      shares: Number(shares),
      average_cost: Number(averageCost),
      updated_at: new Date().toISOString()
    };

    // Update UI immediately (optimistic)
    if (portfolio) {
      const updatedPortfolio = {
        ...portfolio,
        holdings: portfolio.holdings.map(h => 
          h.id === holdingId ? optimisticHolding : h
        )
      };
      setPortfolio(updatedPortfolio);
      
      // Update portfolio stocks
      const updatedStock = PortfolioService.convertToPortfolioStocks([optimisticHolding])[0];
      setPortfolioStocks(prev => 
        prev.map(s => s.symbol === optimisticHolding.symbol ? updatedStock : s)
      );
    }

    try {
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares, averageCost })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update holding');
      }
      
      // Replace with real data
      const { holding } = await response.json();
      if (portfolio) {
        const updatedPortfolio = {
          ...portfolio,
          holdings: portfolio.holdings.map(h => 
            h.id === holdingId ? holding : h
          )
        };
        setPortfolio(updatedPortfolio);
        
        // Update portfolio stocks
        const updatedStock = PortfolioService.convertToPortfolioStocks([holding])[0];
        setPortfolioStocks(prev => 
          prev.map(s => s.symbol === holding.symbol ? updatedStock : s)
        );
      }
      
      return true;
    } catch (err) {
      console.error('Failed to update holding:', err);
      
      // Rollback optimistic update
      if (portfolio) {
        const updatedPortfolio = {
          ...portfolio,
          holdings: portfolio.holdings.map(h => 
            h.id === holdingId ? originalHolding : h
          )
        };
        setPortfolio(updatedPortfolio);
        
        // Rollback portfolio stocks
        const originalStock = PortfolioService.convertToPortfolioStocks([originalHolding])[0];
        setPortfolioStocks(prev => 
          prev.map(s => s.symbol === originalHolding.symbol ? originalStock : s)
        );
      }
      
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      return false;
    }
  }, [portfolio, fetchPortfolio]);

  // Remove a holding with optimistic UI
  const removeHolding = useCallback(async (holdingId: string) => {
    // Store original holding for rollback
    const originalHolding = portfolio?.holdings.find(h => h.id === holdingId);
    if (!originalHolding) return false;

    // Update UI immediately (optimistic)
    if (portfolio) {
      const updatedPortfolio = {
        ...portfolio,
        holdings: portfolio.holdings.filter(h => h.id !== holdingId)
      };
      setPortfolio(updatedPortfolio);
      
      // Remove from portfolio stocks
      setPortfolioStocks(prev => 
        prev.filter(s => s.symbol !== originalHolding.symbol)
      );
    }

    try {
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove holding');
      }
      
      return true;
    } catch (err) {
      console.error('Failed to remove holding:', err);
      
      // Rollback optimistic update
      if (portfolio && originalHolding) {
        const updatedPortfolio = {
          ...portfolio,
          holdings: [...portfolio.holdings, originalHolding]
        };
        setPortfolio(updatedPortfolio);
        
        // Restore to portfolio stocks
        const restoredStock = PortfolioService.convertToPortfolioStocks([originalHolding])[0];
        setPortfolioStocks(prev => [...prev, restoredStock]);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      return false;
    }
  }, [portfolio, fetchPortfolio]);

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
    portfolioMetrics,
    // Actions
    fetchPortfolio,
    addHolding,
    updateHolding,
    removeHolding,
    findHoldingBySymbol,
    // Utils
    clearError: () => setError(null)
  };
}
