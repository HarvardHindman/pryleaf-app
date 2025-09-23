import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PortfolioWithHoldings, PortfolioStock } from '@/lib/database.types';
import { PortfolioService } from '@/lib/portfolioService';

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Convert to PortfolioStock format for existing UI components
      const stocks = PortfolioService.convertToPortfolioStocks(portfolioData.holdings);
      setPortfolioStocks(stocks);
      
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new holding
  const addHolding = useCallback(async (symbol: string, shares: number, averageCost: number, companyName?: string) => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          shares,
          averageCost,
          companyName: companyName?.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add holding');
      }
      
      // Refresh portfolio data
      await fetchPortfolio();
      return true;
    } catch (err) {
      console.error('Failed to add holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      return false;
    }
  }, [fetchPortfolio]);

  // Update an existing holding
  const updateHolding = useCallback(async (holdingId: string, shares: number, averageCost: number) => {
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
      
      // Refresh portfolio data
      await fetchPortfolio();
      return true;
    } catch (err) {
      console.error('Failed to update holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      return false;
    }
  }, [fetchPortfolio]);

  // Remove a holding
  const removeHolding = useCallback(async (holdingId: string) => {
    try {
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove holding');
      }
      
      // Refresh portfolio data
      await fetchPortfolio();
      return true;
    } catch (err) {
      console.error('Failed to remove holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      return false;
    }
  }, [fetchPortfolio]);

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
