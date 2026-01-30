'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Users, Check, Crown, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Community {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  category: string;
  specialty: string;
  subscriber_count: number;
  verified: boolean;
  owner_id: string;
}

const CATEGORIES = [
  'All Categories',
  'Day Trading',
  'Options Trading',
  'Long-term Investing',
  'Crypto',
  'Real Estate',
  'Education',
  'News & Analysis',
  'Other'
];

export default function CommunitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'members' | 'newest'>('members');

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, showVerifiedOnly, sortBy]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'All Categories') {
        params.append('category', selectedCategory);
      }
      
      if (showVerifiedOnly) {
        params.append('verified', 'true');
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      params.append('limit', '50');

      const response = await fetch(`/api/communities?${params.toString()}`);
      const data = await response.json();
      
      let communityList = data.communities || [];

      // Sort
      if (sortBy === 'members') {
        communityList.sort((a: Community, b: Community) => b.subscriber_count - a.subscriber_count);
      } else {
        communityList.sort((a: Community, b: Community) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      }

      setCommunities(communityList);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleViewCommunity = (communityId: string) => {
    router.push(`/community/${communityId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Hero Section */}
      <div 
        className="border-b"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 
              className="text-4xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Discover Communities
            </h1>
            <p 
              className="text-lg mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Join trading communities, learn from experienced investors, and grow your portfolio
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: 'var(--text-muted)' }}
                />
                <Input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <Button 
                type="submit"
                style={{ 
                  backgroundColor: 'var(--interactive-primary)',
                  color: 'white'
                }}
              >
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div 
              className="rounded-xl p-6 sticky top-6"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <h3 
                className="font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Filter className="h-4 w-4" />
                Filters
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <label 
                  className="text-sm font-medium mb-2 block"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Filter */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVerifiedOnly}
                    onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--interactive-primary)' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Verified only
                  </span>
                </label>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label 
                  className="text-sm font-medium mb-2 block"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'members' | 'newest')}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="members">Most Members</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {/* Create Community CTA */}
              <div 
                className="mt-8 p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--surface-tertiary)',
                  border: '1px solid var(--border-default)'
                }}
              >
                <h4 
                  className="font-semibold mb-2 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Have your own insights?
                </h4>
                <p 
                  className="text-xs mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Create your own community and start building your following
                </p>
                <Button
                  onClick={() => router.push('/community/create')}
                  size="sm"
                  className="w-full"
                  style={{ 
                    backgroundColor: 'var(--interactive-primary)',
                    color: 'white'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </Button>
              </div>
            </div>
          </aside>

          {/* Communities Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i}
                    className="rounded-xl p-6 animate-pulse"
                    style={{ 
                      backgroundColor: 'var(--surface-primary)',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <div className="h-32 rounded-lg mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                    <div className="h-6 rounded mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                  </div>
                ))}
              </div>
            ) : communities.length === 0 ? (
              <div 
                className="text-center py-16 rounded-xl"
                style={{ 
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-default)'
                }}
              >
                <Users 
                  className="h-16 w-16 mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No communities found
                </h3>
                <p 
                  className="mb-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Try adjusting your filters or create your own community
                </p>
                <Button
                  onClick={() => router.push('/community/create')}
                  style={{ 
                    backgroundColor: 'var(--interactive-primary)',
                    color: 'white'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <div 
                    key={community.id}
                    className="rounded-xl overflow-hidden transition-all hover:scale-105 cursor-pointer"
                    style={{ 
                      backgroundColor: 'var(--surface-primary)',
                      border: '1px solid var(--border-default)'
                    }}
                    onClick={() => handleViewCommunity(community.id)}
                  >
                    {/* Banner */}
                    <div 
                      className="h-32 relative"
                      style={{ 
                        backgroundColor: community.banner_url ? 'transparent' : 'var(--surface-tertiary)',
                        backgroundImage: community.banner_url ? `url(${community.banner_url})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {/* Avatar */}
                      <div 
                        className="absolute -bottom-6 left-4 w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden"
                        style={{ 
                          backgroundColor: 'var(--surface-primary)',
                          border: '3px solid var(--surface-primary)',
                          color: 'var(--interactive-primary)'
                        }}
                      >
                        {community.avatar_url ? (
                          <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          community.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-8 px-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-bold text-lg truncate flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {community.name}
                            {community.verified && (
                              <Check 
                                className="h-4 w-4 flex-shrink-0"
                                style={{ color: 'var(--interactive-primary)' }}
                              />
                            )}
                          </h3>
                          <p 
                            className="text-sm truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            @{community.handle}
                          </p>
                        </div>
                      </div>

                      <p 
                        className="text-sm mb-4 line-clamp-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {community.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users 
                              className="h-4 w-4"
                              style={{ color: 'var(--text-muted)' }}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {community.subscriber_count.toLocaleString()}
                            </span>
                          </div>
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: 'var(--surface-tertiary)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {community.category}
                          </span>
                        </div>

                        <ArrowRight 
                          className="h-5 w-5"
                          style={{ color: 'var(--interactive-primary)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
