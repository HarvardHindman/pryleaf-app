'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Types for ticker data
export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  dividendYield: number;
  earningsDate: string;
  exDividendDate: string;
  targetPrice: number;
  description: string;
  sector: string;
  industry: string;
  website: string;
  employees: number;
  ceo: string;
  founded: string;
  headquarters: string;
  lastUpdated: string;
  // Additional financial metrics
  eps?: number;
  totalRevenue?: number;
  grossMargins?: number;
  ebitdaMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  exchange?: string;
  currency?: string;
  
  // Extended company statistics
  sharesOutstanding?: number;
  enterpriseValue?: number;
  bookValue?: number;
  priceToBook?: number;
  evToRevenue?: number;
  evToEbitda?: number;
  priceToFreeCashFlow?: number;
  evToGrossProfit?: number;
  pegRatio?: number;
  forwardPE?: number;
  
  // Returns
  returnOnAssets?: number;
  returnOnEquity?: number;
  
  // Growth metrics
  quarterlyRevenueGrowthYOY?: number;
  quarterlyEarningsGrowthYOY?: number;
  
  // Financial health
  cash?: number;
  totalDebt?: number;
  netDebt?: number;
  debtToEquity?: number;
  ebitda?: number;
  
  // Dividends
  dividendPerShare?: number;
  payoutRatio?: number;
  
  // Margins (additional)
  fcfMargin?: number;
  preTaxMargin?: number;
}

interface TickerCacheContextType {
  // Cache management
  getTickerData: (ticker: string) => Promise<TickerData | null>;
  invalidateTickerCache: (ticker?: string) => void;
  isLoading: (ticker: string) => boolean;
  
  // Batch operations
  getMultipleTickerData: (tickers: string[]) => Promise<Map<string, TickerData>>;
}

const TickerCacheContext = createContext<TickerCacheContextType | undefined>(undefined);

// Cache duration: 2 minutes for stock data (it changes frequently)
const CACHE_DURATION = 2 * 60 * 1000;

export function TickerCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Map<string, TickerData>>(new Map());
  const [loadingTickers, setLoadingTickers] = useState<Set<string>>(new Set());
  
  const cacheTimestamps = useRef<Map<string, number>>(new Map());
  const fetchPromises = useRef<Map<string, Promise<TickerData | null>>>(new Map());

  // Check if cache is fresh
  const isCacheFresh = useCallback((ticker: string) => {
    const timestamp = cacheTimestamps.current.get(ticker);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Get ticker data (with caching)
  const getTickerData = useCallback(async (ticker: string): Promise<TickerData | null> => {
    const normalizedTicker = ticker.toUpperCase();
    
    // Check cache first
    if (isCacheFresh(normalizedTicker)) {
      const cached = cache.get(normalizedTicker);
      if (cached) {
        return cached;
      }
    }

    // If already fetching, return the existing promise
    if (fetchPromises.current.has(normalizedTicker)) {
      return fetchPromises.current.get(normalizedTicker)!;
    }

    // Mark as loading
    setLoadingTickers(prev => new Set(prev).add(normalizedTicker));

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        const response = await fetch(`/api/ticker/${normalizedTicker}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Ticker not found');
          }
          throw new Error('Failed to fetch ticker data');
        }
        
        const data: TickerData = await response.json();
        
        // Update cache
        setCache(prev => new Map(prev).set(normalizedTicker, data));
        cacheTimestamps.current.set(normalizedTicker, Date.now());
        
        return data;
      } catch (error) {
        console.error(`Error fetching ticker ${normalizedTicker}:`, error);
        return null;
      } finally {
        // Remove from loading
        setLoadingTickers(prev => {
          const newSet = new Set(prev);
          newSet.delete(normalizedTicker);
          return newSet;
        });
        
        // Clean up promise reference
        fetchPromises.current.delete(normalizedTicker);
      }
    })();

    // Store the promise
    fetchPromises.current.set(normalizedTicker, fetchPromise);

    return fetchPromise;
  }, [cache, isCacheFresh]);

  // Batch fetch multiple tickers
  const getMultipleTickerData = useCallback(async (tickers: string[]): Promise<Map<string, TickerData>> => {
    const results = new Map<string, TickerData>();
    
    // Fetch all tickers in parallel
    const promises = tickers.map(async (ticker) => {
      const data = await getTickerData(ticker);
      if (data) {
        results.set(ticker.toUpperCase(), data);
      }
    });
    
    await Promise.all(promises);
    return results;
  }, [getTickerData]);

  // Invalidate cache for specific ticker or all
  const invalidateTickerCache = useCallback((ticker?: string) => {
    if (ticker) {
      const normalizedTicker = ticker.toUpperCase();
      cacheTimestamps.current.delete(normalizedTicker);
      setCache(prev => {
        const newMap = new Map(prev);
        newMap.delete(normalizedTicker);
        return newMap;
      });
    } else {
      // Clear all cache
      cacheTimestamps.current.clear();
      setCache(new Map());
    }
  }, []);

  // Check if ticker is currently loading
  const isLoading = useCallback((ticker: string) => {
    return loadingTickers.has(ticker.toUpperCase());
  }, [loadingTickers]);

  const value: TickerCacheContextType = {
    getTickerData,
    invalidateTickerCache,
    isLoading,
    getMultipleTickerData
  };

  return (
    <TickerCacheContext.Provider value={value}>
      {children}
    </TickerCacheContext.Provider>
  );
}

export function useTickerCache() {
  const context = useContext(TickerCacheContext);
  if (context === undefined) {
    throw new Error('useTickerCache must be used within a TickerCacheProvider');
  }
  return context;
}

