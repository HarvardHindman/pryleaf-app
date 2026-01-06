import { useState, useEffect } from 'react';

export interface FinancialDataResponse {
  data: any;
  _cached?: boolean;
  _timestamp?: string;
  _fallback?: boolean;
  _error?: string;
}

export function useFinancialData(ticker: string, type: 'income' | 'balance' | 'cashflow' | 'earnings') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/ticker/${ticker}/financials?type=${type}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} data`);
        }
        
        const result: FinancialDataResponse = await response.json();
        
        setData(result.data);
        setCached(result._cached || false);
        setLoading(false);
        
        // Log status
        if ((result as any)._placeholder) {
          console.log(`⚠️ ${type} data for ${ticker} not cached (showing placeholder)`);
        } else {
          console.log(`✅ Loaded ${type} data for ${ticker} (cached: ${result._cached})`);
        }
      } catch (err) {
        console.error(`Error fetching ${type} data:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [ticker, type]);

  return { data, loading, error, cached };
}

