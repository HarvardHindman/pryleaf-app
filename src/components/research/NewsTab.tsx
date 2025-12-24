/**
 * NewsTab Component - Display news articles with sentiment analysis
 * For stock research page
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Filter,
  Calendar,
  Users,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export interface NewsArticle {
  id: string;
  article_id: string;
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  tickers: string[];
  topics: string[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: any;
  created_at: string;
}

interface NewsTabProps {
  ticker: string;
  className?: string;
}

const SENTIMENT_COLORS = {
  'Bullish': 'bg-green-100 text-green-800 border-green-300',
  'Somewhat-Bullish': 'bg-green-50 text-green-700 border-green-200',
  'Neutral': 'bg-gray-100 text-gray-800 border-gray-300',
  'Somewhat-Bearish': 'bg-red-50 text-red-700 border-red-200',
  'Bearish': 'bg-red-100 text-red-800 border-red-300'
};

const SENTIMENT_ICONS = {
  'Bullish': TrendingUp,
  'Somewhat-Bullish': TrendingUp,
  'Neutral': Minus,
  'Somewhat-Bearish': TrendingDown,
  'Bearish': TrendingDown
};

export default function NewsTab({ ticker, className = '' }: NewsTabProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [timeRange, setTimeRange] = useState<24 | 72 | 168>(168); // hours
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ticker: ticker,
        limit: '50',
        hoursAgo: timeRange.toString()
      });

      // Apply sentiment filter
      if (filter === 'bullish') {
        params.append('sentimentMin', '0.15');
      } else if (filter === 'bearish') {
        params.append('sentimentMax', '-0.15');
      } else if (filter === 'neutral') {
        params.append('sentimentMin', '-0.15');
        params.append('sentimentMax', '0.15');
      }

      const response = await fetch(`/api/news?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        setError(data.error || 'Failed to fetch news');
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNews();
  }, [ticker, filter, timeRange]);

  const getSentimentIcon = (label: string) => {
    const Icon = SENTIMENT_ICONS[label as keyof typeof SENTIMENT_ICONS] || Minus;
    return Icon;
  };

  const getSentimentColor = (label: string) => {
    return SENTIMENT_COLORS[label as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.Neutral;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const getSentimentStats = () => {
    const total = articles.length;
    if (total === 0) return { bullish: 0, bearish: 0, neutral: 0, avgScore: 0 };

    const bullish = articles.filter(a => 
      a.overall_sentiment_label === 'Bullish' || 
      a.overall_sentiment_label === 'Somewhat-Bullish'
    ).length;
    
    const bearish = articles.filter(a => 
      a.overall_sentiment_label === 'Bearish' || 
      a.overall_sentiment_label === 'Somewhat-Bearish'
    ).length;
    
    const neutral = total - bullish - bearish;
    
    const avgScore = articles.reduce((sum, a) => sum + a.overall_sentiment_score, 0) / total;

    return {
      bullish: Math.round((bullish / total) * 100),
      bearish: Math.round((bearish / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      avgScore: avgScore.toFixed(3)
    };
  };

  const stats = getSentimentStats();

  if (loading && articles.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--interactive-primary)' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading news...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              News & Sentiment
              <Badge variant="secondary" className="ml-2">
                {articles.length} articles
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Range Filter */}
              <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border-default)' }}>
                {[
                  { label: '24h', value: 24 },
                  { label: '3d', value: 72 },
                  { label: '7d', value: 168 }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={timeRange === option.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeRange(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Sentiment Filter */}
              <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border-default)' }}>
                {[
                  { label: 'All', value: 'all', icon: Filter },
                  { label: 'Bullish', value: 'bullish', icon: TrendingUp },
                  { label: 'Bearish', value: 'bearish', icon: TrendingDown },
                  { label: 'Neutral', value: 'neutral', icon: Minus }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filter === option.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(option.value as any)}
                    className="text-xs"
                  >
                    <option.icon className="h-3 w-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Sentiment Overview */}
        {articles.length > 0 && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Avg Sentiment</div>
                <div className={`text-2xl font-bold ${parseFloat(stats.avgScore) > 0 ? 'text-green-600' : parseFloat(stats.avgScore) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {stats.avgScore}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <div className="text-xs mb-1 text-green-600">Bullish</div>
                <div className="text-2xl font-bold text-green-600">{stats.bullish}%</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Neutral</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>{stats.neutral}%</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                <div className="text-xs mb-1 text-red-600">Bearish</div>
                <div className="text-2xl font-bold text-red-600">{stats.bearish}%</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-500 mb-2">Error loading news</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <Button onClick={fetchNews} className="mt-4" size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No news articles found</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Try adjusting your filters or check back later
            </p>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      {articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article) => {
            const SentimentIcon = getSentimentIcon(article.overall_sentiment_label);
            const sentimentColor = getSentimentColor(article.overall_sentiment_label);

            return (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Article Image */}
                    {article.banner_image && (
                      <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                        <img
                          src={article.banner_image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {article.title}
                          <ExternalLink className="inline-block h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      </a>

                      {/* Summary */}
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {article.summary}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
                        {/* Source */}
                        <span className="font-medium">{article.source}</span>

                        {/* Time */}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimeAgo(article.time_published)}
                        </span>

                        {/* Authors */}
                        {article.authors && article.authors.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {article.authors[0]}
                          </span>
                        )}

                        {/* Sentiment Badge */}
                        <Badge className={`text-xs border ${sentimentColor}`}>
                          <SentimentIcon className="h-3 w-3 mr-1" />
                          {article.overall_sentiment_label}
                          <span className="ml-1 opacity-75">
                            ({article.overall_sentiment_score > 0 ? '+' : ''}{article.overall_sentiment_score.toFixed(2)})
                          </span>
                        </Badge>

                        {/* Related Tickers */}
                        {article.tickers && article.tickers.length > 1 && (
                          <div className="flex items-center gap-1">
                            <span>+</span>
                            {article.tickers.filter(t => t !== ticker).slice(0, 3).map(t => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Topics */}
                        {article.topics && article.topics.length > 0 && (
                          <div className="flex items-center gap-1">
                            {article.topics.slice(0, 2).map(topic => (
                              <Badge key={topic} variant="secondary" className="text-xs">
                                {topic.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && articles.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--interactive-primary)' }}></div>
        </div>
      )}
    </div>
  );
}

