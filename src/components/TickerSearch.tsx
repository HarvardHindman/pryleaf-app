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
    <div className="w-full" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            type="text"
            placeholder="Search stocks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            className="pl-9 pr-3 py-2 text-sm w-full rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'var(--surface-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto scrollbar-hide z-50 shadow-2xl rounded-lg"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)'
            }}>
            {isLoading ? (
              <div className="p-4 text-center">
                <div 
                  className="h-4 w-4 rounded-full animate-spin mx-auto mb-2"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-subtle)',
                    borderTopColor: 'var(--interactive-primary)',
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                {results.map((result, index) => (
                  <div
                    key={`${result.symbol || 'unknown'}-${result.exchange || 'unknown'}-${index}`}
                    className={`px-3 py-2.5 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'border-l-2' : ''
                    }`}
                    style={{
                      backgroundColor: index === selectedIndex ? 'var(--surface-tertiary)' : 'transparent',
                      borderColor: index === selectedIndex ? 'var(--interactive-primary)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (index !== selectedIndex) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== selectedIndex) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={() => navigateToTicker(result.symbol)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {result.symbol}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {result.name}
                        </div>
                      </div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-tertiary)' }}>
                        {result.exchange}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-[var(--text-muted)]">
                No results found for "{query}"
              </div>
            ) : null}
          </Card>
        )}
      </form>
    </div>
  );
}