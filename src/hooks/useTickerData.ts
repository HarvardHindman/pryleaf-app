import { useState, useEffect, useRef, useCallback } from 'react';
import { useTickerCache, type TickerData } from '@/contexts/TickerCacheContext';

/**
 * Check if data is incomplete (placeholder or missing key fields from overview)
 */
function isIncompleteData(data: TickerData | null): boolean {
  if (!data) return true;
  // Placeholder flag from server
  if ((data as any)._placeholder) return true;
  // Missing overview-derived fields indicates partial data (quote succeeded but overview failed)
  if (data.sector === 'N/A' && data.description === 'No description available.') return true;
  return false;
}

/**
 * Custom hook to fetch and cache ticker data
 * Automatically fetches on mount and returns cached data when available
 * Retries automatically if data is incomplete (e.g., rate-limited on first load)
 */
export function useTickerData(ticker: string | null) {
  const { getTickerData, invalidateTickerCache, isLoading: isTickerLoading } = useTickerCache();
  
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const mountedRef = useRef(true);

  // Clear pending retries
  const clearRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearRetry();
    };
  }, [clearRetry]);

  useEffect(() => {
    if (!ticker) {
      setData(null);
      setLoading(false);
      clearRetry();
      retryCountRef.current = 0;
      return;
    }

    // Reset retry count when ticker changes
    retryCountRef.current = 0;
    clearRetry();

    const fetchData = async (isRetry = false) => {
      if (!mountedRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // On retry, invalidate cache to force fresh server fetch
        if (isRetry) {
          invalidateTickerCache(ticker);
        }
        
        const result = await getTickerData(ticker);
        
        if (!mountedRef.current) return;

        if (result) {
          setData(result);

          // If data is incomplete, schedule retry with exponential backoff
          if (isIncompleteData(result) && retryCountRef.current < maxRetries) {
            const delay = 2000 * Math.pow(1.5, retryCountRef.current); // 2s, 3s, 4.5s
            retryCountRef.current++;
            console.log(`[useTickerData] Incomplete data for ${ticker}, scheduling retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
            
            retryTimeoutRef.current = setTimeout(() => {
              fetchData(true);
            }, delay);
          }
        } else {
          setError('Ticker not found');
          setData(null);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load ticker data');
        setData(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup on ticker change
    return () => {
      clearRetry();
    };
  }, [ticker, getTickerData, invalidateTickerCache, clearRetry]);

  const refetch = useCallback(() => {
    if (!ticker) return Promise.resolve(null);
    invalidateTickerCache(ticker);
    return getTickerData(ticker);
  }, [ticker, getTickerData, invalidateTickerCache]);

  return {
    data,
    loading: loading || (ticker ? isTickerLoading(ticker) : false),
    error,
    refetch
  };
}

