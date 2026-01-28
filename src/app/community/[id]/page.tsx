'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle,
  Users,
  ArrowLeft,
  Lock,
  Loader2,
  Crown,
  UserPlus,
  Settings,
  Play,
  Check,
  Video as VideoIcon,
  Upload,
  Eye,
  Clock,
  Grid3x3,
  List,
  Search,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityDetails } from '@/hooks/useCommunityDetails';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const { user } = useAuth();
  
  // Use cached community details
  const { details, loading, error } = useCommunityDetails(communityId);
  const { invalidateCommunityDetails } = useCommunityCache();
  
  const [joiningTierId, setJoiningTierId] = useState<string | null>(null);

  // Store last active community
  useEffect(() => {
    if (details && user && communityId) {
      localStorage.setItem('lastActiveCommunity', communityId);
    }
  }, [details, user, communityId]);

  const handleJoinTier = async (tierId: string, priceCents: number) => {
    if (!tierId) return;

    try {
      setJoiningTierId(tierId);
      
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate cache to force refresh
        invalidateCommunityDetails(communityId);
        
        if (priceCents === 0) {
          // Free tier - reload to show updated status
          window.location.reload();
        } else {
          // Paid tier - redirect to Stripe checkout (when implemented)
          alert(data.message || 'Payment integration coming soon!');
        }
      } else {
        alert(data.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community');
    } finally {
      setJoiningTierId(null);
    }
  };

  const getTierBadgeClass = (tierLevel: number) => {
    if (tierLevel === 0) return 'tier-badge tier-badge-free';
    if (tierLevel === 1) return 'tier-badge tier-badge-premium';
    return 'tier-badge tier-badge-elite';
  };

  const renderFeedContent = () => {
    const isMember = membershipStatus?.isMember;
    const isOwner = membershipStatus?.isOwner;
    const userTierLevel = membershipStatus?.tierLevel || 0;

    // If not a member, show membership tiers
    if (!isMember && !isOwner) {
      return (
        <div className="space-y-12">
          {/* About Section */}
          {community.long_description && (
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                About this Community
              </h2>
              <div 
                className="prose max-w-none text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {community.long_description}
              </div>
            </section>
          )}

          {/* Membership Tiers */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
              Choose Your Membership
            </h2>
            <div className="tier-comparison-grid">
              {tiers.map((tier: any, index: number) => {
                const isCurrentTier = membershipStatus?.membership?.tier_id === tier.id;
                const canAccess = membershipStatus?.tierLevel >= tier.tier_level;
                const isPopular = index === 1 && tiers.length > 1;

                return (
                  <div
                    key={tier.id}
                    className={`tier-card ${isPopular ? 'tier-card-popular' : ''}`}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {tier.name}
                      </h3>
                      <div className="tier-price mb-2">
                        ${(tier.price_monthly / 100).toFixed(0)}
                        <span className="tier-price-period">/month</span>
                      </div>
                      {tier.description && (
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                          {tier.description}
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="tier-feature-list mb-6">
                      {tier.features?.map((feature: string, idx: number) => (
                        <li key={idx} className="tier-feature">
                          <CheckCircle className="h-4 w-4 tier-feature-icon" />
                          <span>{feature}</span>
                        </li>
                      )) || (
                        <>
                          <li className="tier-feature">
                            <CheckCircle className="h-4 w-4 tier-feature-icon" />
                            <span>Access to {tier.name} content</span>
                          </li>
                          <li className="tier-feature">
                            <CheckCircle className="h-4 w-4 tier-feature-icon" />
                            <span>Community chat access</span>
                          </li>
                          {tier.tier_level > 0 && (
                            <li className="tier-feature">
                              <CheckCircle className="h-4 w-4 tier-feature-icon" />
                              <span>Exclusive member perks</span>
                            </li>
                          )}
                        </>
                      )}
                    </ul>

                    {/* Join Button */}
                    <button
                      onClick={() => handleJoinTier(tier.id, tier.price_monthly)}
                      disabled={joiningTierId === tier.id || isCurrentTier}
                      className="btn btn-primary w-full"
                    >
                      {joiningTierId === tier.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : isCurrentTier ? (
                        <>
                          <Check className="h-4 w-4" />
                          Current Tier
                        </>
                      ) : (
                        <>
                          Join {tier.name}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      );
    }

    return (
      <VideoFeedTab 
        communityId={communityId} 
        isOwner={isOwner} 
        userTierLevel={userTierLevel}
        communityName={community?.name || ''}
      />
    );
  };

  if (loading) {
    return (
      <div className="h-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        {/* Banner skeleton */}
        <div className="h-48 w-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        {/* Content skeleton */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start gap-6 -mt-16">
            <div className="w-32 h-32 rounded-lg animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-primary)', border: '4px solid var(--surface-secondary)' }} />
            <div className="pt-20 flex-1">
              <div className="h-8 w-48 rounded animate-pulse mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
          {/* Loading spinner */}
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center">
              <div 
                className="h-8 w-8 rounded-full animate-spin mb-3"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-subtle)',
                  borderTopColor: 'var(--interactive-primary)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from cached details
  const community = details;
  const tiers = details?.tiers || [];
  const membershipStatus = details?.membershipStatus;

  if (error || !details) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Community not found
          </h2>
          <Link href="/">
            <button className="btn btn-primary mt-4">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isMember = membershipStatus?.isMember;
  const isOwner = membershipStatus?.isOwner;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Banner */}
      {community.banner_url && (
        <div 
          className="w-full h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${community.banner_url})` }}
        />
      )}

      {/* Header */}
      <div 
        className="border-b px-4 md:px-8 py-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <button className="btn btn-ghost btn-sm mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="community-avatar" style={{ width: '6rem', height: '6rem', fontSize: '3rem' }}>
              {community.avatar_url ? (
                <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{community.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {community.name}
                </h1>
                {community.verified && (
                  <CheckCircle className="h-6 w-6 verified-badge" />
                )}
                {isOwner && (
                  <Link href={`/community/${communityId}/dashboard`}>
                    <button className="btn btn-sm btn-ghost ml-auto">
                      <Settings className="h-4 w-4" />
                      Dashboard
                    </button>
                  </Link>
                )}
              </div>
              <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>
                @{community.handle}
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={getTierBadgeClass(1)}>
                  {community.specialty}
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Users className="h-4 w-4" />
                  {community.subscriber_count.toLocaleString()} members
                </span>
              </div>
              <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                {community.description}
              </p>

              {/* Quick Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Membership Status */}
                {membershipStatus && (
                  <>
                    {isMember ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--success-background)', color: 'var(--success-text)' }}>
                        <Check className="h-4 w-4" />
                        <span className="font-semibold">Member</span>
                        {isOwner && (
                          <Crown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    ) : (
                      <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--surface-tertiary)', color: 'var(--text-muted)' }}>
                        Scroll down to view membership options
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {renderFeedContent()}
      </div>
    </div>
  );
}


// Video Feed Tab Component
interface VideoFeedTabProps {
  communityId: string;
  isOwner: boolean;
  userTierLevel: number;
  communityName: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  content_url: string;
  thumbnail_url?: string;
  duration?: number;
  views: number;
  likes: number;
  published_at: string;
  minimum_tier_level: number;
  tags: string[];
}

function VideoFeedTab({ communityId, isOwner, userTierLevel, communityName }: VideoFeedTabProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetchVideos();
  }, [communityId, sortBy]);

  async function fetchVideos() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
      });
      
      const response = await fetch(`/api/communities/${communityId}/videos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter videos based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVideos(
        videos.filter(
          (video) =>
            video.title.toLowerCase().includes(query) ||
            video.description?.toLowerCase().includes(query) ||
            video.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, videos]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  const canAccessVideo = (video: Video) => {
    return isOwner || video.minimum_tier_level <= userTierLevel;
  };

  if (loading) {
    return (
      <div className="py-8">
        {/* Controls skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-10 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="aspect-video animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls Bar */}
      <div 
        className="sticky top-0 z-10 p-4 rounded-lg border mb-6"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? '' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--interactive-primary)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--surface-primary)' : 'var(--text-muted)'
                }}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? '' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--interactive-primary)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--surface-primary)' : 'var(--text-muted)'
                }}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Upload Button (Owner Only) */}
            {isOwner && (
              <Link href={`/community/${communityId}/videos`}>
                <button className="btn btn-primary flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Video Grid/List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <Play className="h-20 w-20 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {searchQuery ? 'No videos found' : 'No videos yet'}
          </h3>
          <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : isOwner 
                ? 'Upload your first video to start sharing content!' 
                : 'Check back soon for new content from ' + communityName}
          </p>
          {isOwner && !searchQuery && (
            <Link href={`/community/${communityId}/videos`}>
              <button className="btn btn-primary btn-lg">
                <Upload className="h-5 w-5" />
                Upload First Video
              </button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => {
            const hasAccess = canAccessVideo(video);
            return (
              <Link
                key={video.id}
                href={hasAccess ? `/community/${communityId}/videos/${video.id}` : '#'}
                className={`group ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (!hasAccess) {
                    e.preventDefault();
                    alert('Upgrade your membership to access this video');
                  }
                }}
              >
                <div 
                  className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--surface-primary)' }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    {/* Lock Overlay */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                          <p className="text-white text-sm font-medium">
                            Tier {video.minimum_tier_level}+
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatViews(video.views)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(video.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => {
            const hasAccess = canAccessVideo(video);
            return (
              <Link
                key={video.id}
                href={hasAccess ? `/community/${communityId}/videos/${video.id}` : '#'}
                className={`group ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (!hasAccess) {
                    e.preventDefault();
                    alert('Upgrade your membership to access this video');
                  }
                }}
              >
                <div 
                  className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex gap-4 p-4"
                  style={{ backgroundColor: 'var(--surface-primary)' }}
                >
                  {/* Thumbnail */}
                  <div className="relative w-64 aspect-video rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 group-hover:opacity-80 transition-opacity line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {video.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                      {video.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatViews(video.views)} views
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(video.published_at)}</span>
                      {!hasAccess && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1" style={{ color: 'var(--interactive-primary)' }}>
                            <Lock className="h-4 w-4" />
                            Tier {video.minimum_tier_level}+
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

