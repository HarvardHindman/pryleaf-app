'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, TrendingUp } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

type TickerSearchProps = {
  onSelectTicker?: (symbol: string) => void;
};

export default function TickerSearch({ onSelectTicker }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 0) {
        searchTickers(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicking outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTickers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results || []);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigateToTicker(results[selectedIndex].symbol);
    } else if (query.trim()) {
      // If no selection but there's a query, use the first result or the query itself
      const ticker = results.length > 0 ? results[0].symbol : query.trim().toUpperCase();
      navigateToTicker(ticker);
    }
  };

  const navigateToTicker = (symbol: string) => {
    setShowResults(false);
    if (onSelectTicker) {
      onSelectTicker(symbol);
    } else {
      router.push(`/symbol/${symbol}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search stocks (e.g., AAPL, TSLA, GOOGL)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            className="pl-10 pr-20 py-2 text-sm w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-md border border-gray-200 select-none pointer-events-none">
            Enter
          </span>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <Card className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto z-50 shadow-lg bg-white border border-gray-200">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                {results.map((result, index) => (
                  <div
                    key={`${result.symbol}-${result.exchange}`}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => navigateToTicker(result.symbol)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {result.symbol}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {result.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {result.exchange}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-gray-500">
                No results found for "{query}"
              </div>
            ) : null}
          </Card>
        )}
      </form>
    </div>
  );
}