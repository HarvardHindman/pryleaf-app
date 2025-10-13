'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Video, 
  Search,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  Users,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import type { Community } from '@/lib/communityService';

const categories = [
  'All',
  'Options Trading',
  'Technical Analysis',
  'Value Investing',
  'Crypto & DeFi',
  'Day Trading',
  'Swing Trading',
  'Market Analysis',
  'Other'
];

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);

  // Fetch communities
  useEffect(() => {
    async function fetchCommunities() {
      try {
        setLoading(true);
        const response = await fetch('/api/communities');
        const data = await response.json();
        setCommunities(data.communities || []);
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  // Filter communities
  useEffect(() => {
    let filtered = communities;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.handle.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.specialty?.toLowerCase().includes(query)
      );
    }

    setFilteredCommunities(filtered);
  }, [communities, selectedCategory, searchQuery]);

  const featuredCommunities = filteredCommunities.filter(c => c.verified).slice(0, 4);

  return (
    <div 
      className="h-full overflow-y-auto" 
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {/* Hero Section */}
      <div 
        className="border-b px-8 py-8"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                <Sparkles className="inline-block mr-2 h-8 w-8 text-yellow-500" />
                Creator Communities
              </h1>
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>
                Learn from expert traders and investors through exclusive content and community discussions
              </p>
            </div>
            <Link href="/community/create">
              <button
                className="btn btn-primary"
              >
                <Video className="h-4 w-4" />
                Become a Creator
              </button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search communities, creators, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border transition-all ${
                  viewMode === 'grid' ? 'border-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  borderColor: viewMode === 'grid' ? 'var(--interactive-primary)' : 'var(--border-default)',
                  backgroundColor: viewMode === 'grid' ? 'var(--info-background)' : 'transparent'
                }}
              >
                <Grid3X3 className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-all ${
                  viewMode === 'list' ? 'border-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  borderColor: viewMode === 'list' ? 'var(--interactive-primary)' : 'var(--border-default)',
                  backgroundColor: viewMode === 'list' ? 'var(--info-background)' : 'transparent'
                }}
              >
                <List className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Featured Communities */}
        {!searchQuery && featuredCommunities.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="h-6 w-6 text-blue-500" />
                Featured Creators
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCommunities.map((community) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  <div className="community-card">
                    <div className="flex flex-col items-center text-center">
                      <div className="community-avatar">
                        {community.avatar_url ? (
                          <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-4xl">
                            {community.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-3 mb-1">
                        <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                          {community.name}
                        </h3>
                        {community.verified && (
                          <CheckCircle className="h-4 w-4 ml-1 verified-badge" />
                        )}
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        @{community.handle}
                      </p>
                      <span className="tier-badge tier-badge-premium mb-3">
                        {community.specialty}
                      </span>
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {community.description}
                      </p>
                      <div className="flex items-center text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                        <Users className="h-4 w-4 mr-1" />
                        {(community.subscriber_count / 1000).toFixed(1)}K members
                      </div>
                      <button className="btn btn-primary w-full btn-sm">
                        View Community
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-8">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.toLowerCase()
                    ? 'shadow-sm'
                    : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === category.toLowerCase() 
                    ? 'var(--info-background)' 
                    : 'var(--surface-primary)',
                  color: selectedCategory === category.toLowerCase() 
                    ? 'var(--info-text)' 
                    : 'var(--text-muted)',
                  border: selectedCategory === category.toLowerCase()
                    ? '1px solid var(--info-border)'
                    : '1px solid var(--border-default)'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* All Communities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? 'Search Results' : 'All Communities'}
              <span className="text-base font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                ({filteredCommunities.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No communities found
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'community-grid' : 'space-y-4'}>
              {filteredCommunities.map((community) => (
                <Link key={community.id} href={`/community/${community.id}`}>
                  {viewMode === 'grid' ? (
                    <div className="community-card">
                      <div className="flex items-start gap-4">
                        <div className="community-avatar">
                          {community.avatar_url ? (
                            <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-3xl">
                              {community.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                              {community.name}
                            </h3>
                            {community.verified && (
                              <CheckCircle className="h-4 w-4 ml-1 verified-badge flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                            @{community.handle} • {community.specialty}
                          </p>
                          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {community.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {(community.subscriber_count / 1000).toFixed(1)}K
                            </span>
                            <span className="tier-badge tier-badge-free">
                              {community.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="community-card">
                      <div className="flex items-center gap-4">
                        <div className="community-avatar">
                          {community.avatar_url ? (
                            <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-3xl">
                              {community.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center min-w-0">
                              <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                                {community.name}
                              </h3>
                              {community.verified && (
                                <CheckCircle className="h-5 w-5 ml-2 verified-badge flex-shrink-0" />
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                            @{community.handle} • {community.specialty}
                          </p>
                          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {community.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {community.subscriber_count.toLocaleString()} members
                            </span>
                            <span>•</span>
                            <span className="tier-badge tier-badge-free">
                              {community.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
