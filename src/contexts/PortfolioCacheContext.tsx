'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { PortfolioWithHoldings, PortfolioStock } from '@/lib/database.types';

interface PortfolioCacheContextType {
  portfolio: PortfolioWithHoldings | null;
  portfolioStocks: PortfolioStock[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  updatePortfolio: (portfolio: PortfolioWithHoldings | null) => void;
  updatePortfolioStocks: (stocks: PortfolioStock[]) => void;
  invalidateCache: () => void;
  isStale: boolean;
}

const PortfolioCacheContext = createContext<PortfolioCacheContextType | undefined>(undefined);

interface PortfolioCacheProviderProps {
  children: React.ReactNode;
}

const CACHE_KEY = 'pryleaf_portfolio_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function PortfolioCacheProvider({ children }: PortfolioCacheProviderProps) {
  const [portfolio, setPortfolio] = useState<PortfolioWithHoldings | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { portfolio: cachedPortfolio, portfolioStocks: cachedStocks, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          // If cache is still fresh, use it
          if (now - timestamp < CACHE_TTL) {
            setPortfolio(cachedPortfolio);
            setPortfolioStocks(cachedStocks);
            setLastFetched(timestamp);
            return true;
          }
        }
      } catch (error) {
        console.error('Failed to load portfolio from cache:', error);
      }
      return false;
    };

    loadFromCache();
  }, []);

  // Save to cache whenever portfolio changes
  useEffect(() => {
    if (portfolio) {
      try {
        const cacheData = {
          portfolio,
          portfolioStocks,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setLastFetched(Date.now());
      } catch (error) {
        console.error('Failed to save portfolio to cache:', error);
      }
    }
  }, [portfolio, portfolioStocks]);

  const updatePortfolio = useCallback((newPortfolio: PortfolioWithHoldings | null) => {
    setPortfolio(newPortfolio);
    setError(null);
  }, []);

  const updatePortfolioStocks = useCallback((newStocks: PortfolioStock[]) => {
    setPortfolioStocks(newStocks);
  }, []);

  const invalidateCache = useCallback(() => {
    setPortfolio(null);
    setPortfolioStocks([]);
    setLastFetched(null);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const isStale = lastFetched ? Date.now() - lastFetched > CACHE_TTL : true;

  return (
    <PortfolioCacheContext.Provider
      value={{
        portfolio,
        portfolioStocks,
        loading,
        error,
        lastFetched,
        updatePortfolio,
        updatePortfolioStocks,
        invalidateCache,
        isStale
      }}
    >
      {children}
    </PortfolioCacheContext.Provider>
  );
}

export function usePortfolioCache() {
  const context = useContext(PortfolioCacheContext);
  if (context === undefined) {
    throw new Error('usePortfolioCache must be used within a PortfolioCacheProvider');
  }
  return context;
}
