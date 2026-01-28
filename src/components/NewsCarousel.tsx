'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  time: string;
  source: string;
  tickers: string[];
  sentiment: number;
}

interface NewsCarouselProps {
  tickers?: string[];
}

// Placeholder news data
const PLACEHOLDER_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Tech stocks rally as Fed signals potential rate cuts in coming months',
    url: '#',
    time: '2h',
    source: 'Reuters',
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    sentiment: 0.6
  },
  {
    id: '2',
    title: 'NVIDIA reports record quarterly revenue driven by AI chip demand',
    url: '#',
    time: '4h',
    source: 'CNBC',
    tickers: ['NVDA'],
    sentiment: 0.8
  },
  {
    id: '3',
    title: 'Apple faces regulatory challenges in European Union markets',
    url: '#',
    time: '6h',
    source: 'Bloomberg',
    tickers: ['AAPL'],
    sentiment: -0.3
  },
  {
    id: '4',
    title: 'S&P 500 closes at new all-time high amid strong earnings',
    url: '#',
    time: '8h',
    source: 'WSJ',
    tickers: ['SPY', 'VOO'],
    sentiment: 0.5
  },
  {
    id: '5',
    title: 'Tesla announces new factory expansion plans in Asia Pacific',
    url: '#',
    time: '12h',
    source: 'MarketWatch',
    tickers: ['TSLA'],
    sentiment: 0.4
  },
  {
    id: '6',
    title: 'Amazon Web Services launches new AI-powered cloud features',
    url: '#',
    time: '1d',
    source: 'TechCrunch',
    tickers: ['AMZN'],
    sentiment: 0.3
  }
];

export default function NewsCarousel({ tickers: _tickers }: NewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const articles = PLACEHOLDER_NEWS;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 260;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.15) return 'var(--success-text)';
    if (score < -0.15) return 'var(--danger-text)';
    return 'var(--text-muted)';
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.15) return 'var(--success-background)';
    if (score < -0.15) return 'var(--danger-background)';
    return 'var(--surface-tertiary)';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.15) return 'Bullish';
    if (score < -0.15) return 'Bearish';
    return 'Neutral';
  };

  return (
    <div 
      className="relative overflow-hidden flex flex-col h-full"
      style={{ 
        backgroundColor: 'var(--card-bg, var(--surface-primary))',
        border: '1px solid var(--card-border, var(--border-subtle))',
        borderRadius: '0.875rem',
        boxShadow: 'var(--card-shadow, var(--shadow-sm))'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-divider, var(--border-subtle))' }}
      >
        <h3 
          className="text-xs font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          News
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1 rounded transition-all duration-200 disabled:opacity-20"
            style={{ 
              color: canScrollLeft ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: canScrollLeft ? 'var(--surface-tertiary)' : 'transparent'
            }}
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1 rounded transition-all duration-200 disabled:opacity-20"
            style={{ 
              color: canScrollRight ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: canScrollRight ? 'var(--surface-tertiary)' : 'transparent'
            }}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* News List - Vertical scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        {articles.map((article, index) => (
          <div
            key={article.id}
            className="relative cursor-pointer transition-all duration-200"
            style={{ 
              backgroundColor: hoveredId === article.id ? 'var(--surface-tertiary)' : 'transparent',
              borderBottom: index < articles.length - 1 ? '1px solid var(--border-divider, var(--border-subtle))' : 'none'
            }}
            onMouseEnter={() => setHoveredId(article.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="px-3 py-2.5">
              {/* Top row: Source, Time, Sentiment */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--interactive-primary)' }}
                  >
                    {article.source}
                  </span>
                  <span 
                    className="text-[10px]"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {article.time}
                  </span>
                </div>
                <span 
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ 
                    backgroundColor: getSentimentBg(article.sentiment),
                    color: getSentimentColor(article.sentiment)
                  }}
                >
                  {article.sentiment > 0.15 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : article.sentiment < -0.15 ? (
                    <TrendingDown className="h-2.5 w-2.5" />
                  ) : (
                    <Minus className="h-2.5 w-2.5" />
                  )}
                </span>
              </div>

              {/* Title */}
              <h4 
                className="text-xs font-medium leading-snug"
                style={{ 
                  color: 'var(--text-primary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {article.title}
              </h4>
            </div>

            {/* Hover indicator */}
            {hoveredId === article.id && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: 'var(--interactive-primary)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div 
        className="px-3 py-1.5 text-center"
        style={{ 
          backgroundColor: 'var(--surface-tertiary)',
          borderTop: '1px solid var(--border-divider, var(--border-subtle))'
        }}
      >
        <button 
          className="text-[10px] font-medium transition-colors"
          style={{ color: 'var(--interactive-primary)' }}
        >
          View all news
        </button>
      </div>
    </div>
  );
}

