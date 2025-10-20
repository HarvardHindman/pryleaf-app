import { useState, useEffect } from 'react';
import { useTickerCache, type TickerData } from '@/contexts/TickerCacheContext';

/**
 * Custom hook to fetch and cache ticker data
 * Automatically fetches on mount and returns cached data when available
 */
export function useTickerData(ticker: string | null) {
  const { getTickerData, isLoading: isTickerLoading } = useTickerCache();
  
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getTickerData(ticker);
        
        if (result) {
          setData(result);
        } else {
          setError('Ticker not found');
          setData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticker data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, getTickerData]);

  return {
    data,
    loading: loading || (ticker ? isTickerLoading(ticker) : false),
    error,
    refetch: () => ticker ? getTickerData(ticker) : Promise.resolve(null)
  };
}

