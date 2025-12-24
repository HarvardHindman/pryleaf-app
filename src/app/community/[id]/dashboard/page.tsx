'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  BarChart3,
  Calendar,
  Loader2,
  Check,
  X,
  Sparkles,
  Search,
  Shield,
  Filter,
  EyeOff,
  Palette,
  Image as ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { useCommunityCache } from '@/contexts/CommunityCacheContext';

type DashboardTab = 'overview' | 'content' | 'members' | 'tiers' | 'analytics' | 'appearance' | 'settings';

export default function CommunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    fetchCommunityStats, 
    communityStatsCache,
    selectedCommunityId
  } = useCommunityCache();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [stats, setStats] = useState<any>(communityStatsCache.get(communityId) || {});
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<DashboardTab>>(new Set(['overview']));
  const [isOwner, setIsOwner] = useState(false);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const newSet = new Set(prev);
      newSet.add(tab);
      return newSet;
    });
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch community details
        const communityResponse = await fetch(`/api/communities/${communityId}`);
        const communityData = await communityResponse.json();
        
        if (!communityData.community) {
          router.push('/community');
          return;
        }

        // Check if user is owner
        if (communityData.community.owner_id !== user?.id) {
          router.push(`/community/${communityId}`);
          return;
        }

        setCommunity(communityData.community);
        setIsOwner(true);

        // Fetch analytics using cache context
        const statsData = await fetchCommunityStats(communityId);
        setStats(statsData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId && user) {
      fetchDashboardData();
    }
  }, [communityId, user, router, fetchCommunityStats]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  if (!community || !isOwner) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header */}
      <div 
        className="border-b px-4 md:px-8 py-4"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Link href={`/community/${communityId}`}>
            <button className="btn btn-ghost btn-sm mb-3">
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5" style={{ color: 'var(--warning-text)' }} />
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Creator Dashboard
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {community.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        className="border-b px-4 md:px-8"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          <DashboardTabButton
            active={activeTab === 'overview'}
            onClick={() => handleTabChange('overview')}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Overview"
          />
          <DashboardTabButton
            active={activeTab === 'content'}
            onClick={() => handleTabChange('content')}
            icon={<MessageSquare className="h-4 w-4" />}
            label="Content"
          />
          <DashboardTabButton
            active={activeTab === 'members'}
            onClick={() => handleTabChange('members')}
            icon={<Users className="h-4 w-4" />}
            label="Members"
          />
          <DashboardTabButton
            active={activeTab === 'tiers'}
            onClick={() => handleTabChange('tiers')}
            icon={<Crown className="h-4 w-4" />}
            label="Tiers"
          />
          <DashboardTabButton
            active={activeTab === 'analytics'}
            onClick={() => handleTabChange('analytics')}
            icon={<TrendingUp className="h-4 w-4" />}
            label="Analytics"
          />
          <DashboardTabButton
            active={activeTab === 'appearance'}
            onClick={() => handleTabChange('appearance')}
            icon={<Palette className="h-4 w-4" />}
            label="Appearance"
          />
          <DashboardTabButton
            active={activeTab === 'settings'}
            onClick={() => handleTabChange('settings')}
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          {visitedTabs.has('overview') && <OverviewTab community={community} stats={stats} communityId={communityId} />}
        </div>
        <div className={activeTab === 'content' ? 'block' : 'hidden'}>
          {visitedTabs.has('content') && <ContentTab communityId={communityId} />}
        </div>
        <div className={activeTab === 'members' ? 'block' : 'hidden'}>
          {visitedTabs.has('members') && <MembersManagementTab communityId={communityId} />}
        </div>
        <div className={activeTab === 'tiers' ? 'block' : 'hidden'}>
          {visitedTabs.has('tiers') && <TiersTab communityId={communityId} />}
        </div>
        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          {visitedTabs.has('analytics') && <AnalyticsTab communityId={communityId} stats={stats} />}
        </div>
        <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
          {visitedTabs.has('appearance') && <AppearanceTab community={community} communityId={communityId} />}
        </div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          {visitedTabs.has('settings') && <SettingsTab community={community} communityId={communityId} />}
        </div>
      </div>
    </div>
  );
}

function DashboardTabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-blue-500' : 'border-transparent'
      }`}
      style={{
        color: active ? 'var(--interactive-primary)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400
      }}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

// Content and Tiers tabs now render inline instead of redirecting

function OverviewTab({ community, stats, communityId }: any) {
  const { fetchCommunityActivity, communityActivityCache } = useCommunityCache();
  const [activities, setActivities] = useState<any[]>(communityActivityCache.get(communityId) || []);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    fetchRecentActivities();
  }, [communityId, fetchCommunityActivity]);

  async function fetchRecentActivities() {
    setLoadingActivities(true);
    try {
      const activitiesData = await fetchCommunityActivity(communityId);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  }

  // Calculate growth percentage
  const memberGrowth = stats.newMembersThisMonth || 0;
  const memberGrowthPercent = stats.growthRate || 0;

  const metrics = [
    {
      label: 'Total Members',
      value: stats.totalMembers || community.subscriber_count || 0,
      icon: Users,
      color: 'blue',
      trend: memberGrowthPercent > 0 ? `+${memberGrowthPercent}%` : '0%',
      trendUp: memberGrowthPercent > 0,
      subtitle: `${memberGrowth} new this month`
    },
    {
      label: 'Monthly Revenue',
      value: `$${((stats.monthlyRevenue || 0) / 100).toFixed(0)}`,
      icon: DollarSign,
      color: 'green',
      trend: stats.monthlyRevenue > 0 ? 'MRR' : '$0',
      trendUp: stats.monthlyRevenue > 0,
      subtitle: `${stats.totalMembers || 0} paying members`
    },
    {
      label: 'Total Content',
      value: stats.totalPosts || 0,
      icon: MessageSquare,
      color: 'purple',
      trend: stats.totalViews ? `${stats.totalViews} views` : '0 views',
      trendUp: stats.totalViews > 0,
      subtitle: 'Posts & videos'
    },
    {
      label: 'Engagement Rate',
      value: `${stats.engagementRate || 0}%`,
      icon: Heart,
      color: 'red',
      trend: stats.engagementRate > 50 ? 'Excellent' : stats.engagementRate > 25 ? 'Good' : 'Growing',
      trendUp: stats.engagementRate > 25,
      subtitle: 'Member activity'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          background: 'linear-gradient(135deg, var(--info-background) 0%, var(--surface-primary) 100%)',
          borderColor: 'var(--info-border)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-6 w-6" style={{ color: 'var(--warning-text)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back, Community Owner! 👋
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with {community.name}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const colorMap: any = {
            blue: 'info',
            green: 'success',
            purple: 'info',
            red: 'danger'
          };
          const bgColor = colorMap[metric.color] || 'info';
          
          return (
            <div
              key={index}
              className="p-6 rounded-lg border hover:shadow-lg transition-shadow"
              style={{
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `var(--${bgColor}-background)` }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: `var(--${bgColor}-text)` }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {metric.trendUp && (
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--success-text)' }} />
                  )}
                  <span 
                    className="text-sm font-semibold" 
                    style={{ color: metric.trendUp ? 'var(--success-text)' : 'var(--text-muted)' }}
                  >
                  {metric.trend}
                </span>
                </div>
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                {metric.label}
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {metric.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href={`/community/${communityId}/dashboard/content`}>
          <button className="w-full p-4 rounded-lg border text-left hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
            <MessageSquare className="h-6 w-6 mb-2" style={{ color: 'var(--interactive-primary)' }} />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Upload Content</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create posts and upload videos</p>
          </button>
        </Link>

        <Link href={`/community/${communityId}/dashboard/tiers`}>
          <button className="w-full p-4 rounded-lg border text-left hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
            <Crown className="h-6 w-6 mb-2" style={{ color: 'var(--warning-text)' }} />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Manage Tiers</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Edit pricing and benefits</p>
          </button>
        </Link>

        <Link href={`/community/${communityId}/dashboard/chat`}>
          <button className="w-full p-4 rounded-lg border text-left hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
            <MessageSquare className="h-6 w-6 mb-2" style={{ color: 'var(--info-text)' }} />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Chat Settings</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage channels and permissions</p>
          </button>
        </Link>
      </div>

      {/* Member Breakdown by Tier */}
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Member Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TierBreakdownCard
            name="Free Members"
            count={stats.membersByTier?.free || 0}
            percentage={stats.totalMembers > 0 ? Math.round(((stats.membersByTier?.free || 0) / stats.totalMembers) * 100) : 0}
            revenue="$0/mo"
            color="info"
            icon={Users}
          />
          <TierBreakdownCard
            name="Premium Members"
            count={stats.membersByTier?.premium || 0}
            percentage={stats.totalMembers > 0 ? Math.round(((stats.membersByTier?.premium || 0) / stats.totalMembers) * 100) : 0}
            revenue="Varies"
            color="success"
            icon={Crown}
          />
          <TierBreakdownCard
            name="Elite Members"
            count={stats.membersByTier?.elite || 0}
            percentage={stats.totalMembers > 0 ? Math.round(((stats.membersByTier?.elite || 0) / stats.totalMembers) * 100) : 0}
            revenue="Premium"
            color="warning"
            icon={Sparkles}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h2>
          <button 
            onClick={fetchRecentActivities}
            disabled={loadingActivities}
            className="btn btn-ghost btn-sm"
          >
            {loadingActivities ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>
        <div 
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          {loadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No recent activity</p>
            </div>
          ) : (
          <div className="space-y-4">
              {activities.slice(0, 10).map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TierBreakdownCard({ name, count, percentage, revenue, color, icon: Icon }: any) {
  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `var(--${color}-background)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(--${color}-text)` }} />
        </div>
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>
      </div>
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {count}
          </span>
          <span className="text-lg" style={{ color: 'var(--text-muted)' }}>
            ({percentage}%)
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="h-2 rounded-full transition-all"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: `var(--${color}-text)`
          }}
        />
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {revenue}
      </p>
    </div>
  );
}

function ActivityItem({ activity }: any) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined': return Users;
      case 'content_posted': return MessageSquare;
      case 'tier_upgraded': return TrendingUp;
      case 'member_left': return X;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'member_joined': return 'success';
      case 'content_posted': return 'info';
      case 'tier_upgraded': return 'warning';
      case 'member_left': return 'danger';
      default: return 'info';
    }
  };

  const Icon = getActivityIcon(activity.type);
  const color = getActivityColor(activity.type);

  return (
    <div className="flex items-center gap-4 pb-4 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `var(--${color}-background)` }}
      >
        <Icon className="h-5 w-5" style={{ color: `var(--${color}-text)` }} />
                </div>
                <div className="flex-1">
                  <p style={{ color: 'var(--text-primary)' }}>
          <span className="font-semibold">{activity.title}</span>
          {activity.description && <span> {activity.description}</span>}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {activity.timeAgo || 'Just now'}
                  </p>
      </div>
    </div>
  );
}

function ContentTab({ communityId }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`/api/communities/${communityId}/posts`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [communityId]);

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Content Management
        </h2>
        <Link href={`/community/${communityId}`}>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16" style={{backgroundColor: 'var(--surface-primary)'}} className="rounded-lg">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No posts yet
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Create your first post to engage with your community.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-lg border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {post.title || 'Untitled Post'}
                </h3>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.view_count || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likes || 0} likes
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="btn btn-ghost btn-sm">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MembersManagementTab({ communityId }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, tierFilter, sortBy]);

    async function fetchMembers() {
      try {
        const response = await fetch(`/api/communities/${communityId}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }

  function filterAndSortMembers() {
    let filtered = [...members];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(m => {
        const tierName = m.tier_name?.toLowerCase() || 'free';
        return tierName.includes(tierFilter.toLowerCase());
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
        case 'oldest':
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  }

  const tierCounts = members.reduce((acc, m) => {
    const tierName = m.tier_name?.toLowerCase() || 'free';
    acc[tierName] = (acc[tierName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Members
        </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filteredMembers.length} of {members.length} members
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="all">All Tiers ({members.length})</option>
          {Object.entries(tierCounts).map(([tier, count]) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} ({count})
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div 
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: 'var(--surface-primary)' }}
        >
          <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No members found
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {searchQuery || tierFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Your first members will appear here'}
          </p>
        </div>
      ) : (
      <div 
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
              {filteredMembers.map((member, index) => (
                <tr 
                  key={member.id} 
                  className="border-t hover:bg-opacity-50 transition-colors cursor-pointer" 
                  style={{ borderColor: 'var(--border-subtle)' }}
                  onClick={() => setSelectedMember(member)}
                >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}
                    >
                        {member.name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {member.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <span 
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        member.tier_level === 0 
                          ? 'bg-gray-100 text-gray-700'
                          : member.tier_level === 1
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                    {member.tier_name || 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(member);
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onRefresh={fetchMembers}
        />
      )}
    </div>
  );
}

function MemberDetailsModal({ member, onClose, onRefresh }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Member Details
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}
            >
              {member.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {member.name}
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>{member.email}</p>
              <span 
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  member.tier_level === 0 
                    ? 'bg-gray-100 text-gray-700'
                    : member.tier_level === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {member.tier_name || 'Free'} Member
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            >
              <Calendar className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Joined</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            >
              <MessageSquare className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Messages</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                --
              </p>
            </div>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            >
              <Eye className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Views</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                --
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Member Actions
            </h4>
            <button className="w-full btn btn-outline">
              Send Direct Message
            </button>
            <button className="w-full btn btn-outline text-orange-600 border-orange-600">
              Remove from Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TiersTab({ communityId }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Membership Tiers
        </h2>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Tier
        </button>
      </div>

      <div 
        className="p-8 rounded-lg border text-center"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <Crown className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Tier Management Coming Soon
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Ability to create, edit, and manage custom membership tiers will be available soon.
        </p>
      </div>
    </div>
  );
}

function AnalyticsTab({ communityId, stats }: any) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Revenue metrics
  const totalRevenue = (stats.monthlyRevenue || 0) / 100;
  const avgRevenuePerMember = stats.totalMembers > 0 
    ? totalRevenue / stats.totalMembers 
    : 0;
  
  // Growth metrics
  const memberGrowthRate = stats.growthRate || 0;
  const newMembersCount = stats.newMembersThisMonth || 0;

  // Content metrics
  const totalContent = stats.totalPosts || 0;
  const totalViews = stats.totalViews || 0;
  const avgViewsPerContent = totalContent > 0 ? Math.round(totalViews / totalContent) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Analytics & Insights
      </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {period === 'all' ? 'All Time' : period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Insights */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Revenue Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalyticsMetricCard
            label="Monthly Recurring Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            change={memberGrowthRate}
            icon={DollarSign}
            color="success"
          />
          <AnalyticsMetricCard
            label="Avg Revenue Per Member"
            value={`$${avgRevenuePerMember.toFixed(2)}`}
            icon={Users}
            color="info"
          />
          <AnalyticsMetricCard
            label="Paying Members"
            value={stats.totalMembers || 0}
            subtitle={`${newMembersCount} new this month`}
            icon={TrendingUp}
            color="success"
          />
        </div>
      </div>

      {/* Revenue Breakdown by Tier */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Revenue by Tier
        </h3>
        <div 
          className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
          <div className="space-y-4">
            <RevenueBarItem
              tierName="Free Tier"
              members={stats.membersByTier?.free || 0}
              revenue={0}
              percentage={0}
              color="info"
            />
            <RevenueBarItem
              tierName="Premium Tier"
              members={stats.membersByTier?.premium || 0}
              revenue={(stats.revenueByTier?.premium || 0) / 100}
              percentage={totalRevenue > 0 ? ((stats.revenueByTier?.premium || 0) / stats.monthlyRevenue) * 100 : 0}
              color="success"
            />
            <RevenueBarItem
              tierName="Elite Tier"
              members={stats.membersByTier?.elite || 0}
              revenue={(stats.revenueByTier?.elite || 0) / 100}
              percentage={totalRevenue > 0 ? ((stats.revenueByTier?.elite || 0) / stats.monthlyRevenue) * 100 : 0}
              color="warning"
            />
          </div>
        </div>
      </div>

      {/* Content Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Content Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalyticsMetricCard
            label="Total Content"
            value={totalContent}
            subtitle="Posts & Videos"
            icon={MessageSquare}
            color="info"
          />
          <AnalyticsMetricCard
            label="Total Views"
            value={totalViews.toLocaleString()}
            icon={Eye}
            color="success"
          />
          <AnalyticsMetricCard
            label="Avg Views per Content"
            value={avgViewsPerContent}
            icon={BarChart3}
            color="info"
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Member Engagement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Engagement Rate
              </h4>
              <Heart className="h-5 w-5" style={{ color: 'var(--danger-text)' }} />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {stats.engagementRate || 0}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, stats.engagementRate || 0)}%`,
                    backgroundColor: 'var(--danger-text)'
                  }}
                />
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stats.engagementRate > 50 ? 'Excellent engagement!' : stats.engagementRate > 25 ? 'Good engagement' : 'Room for growth'}
            </p>
          </div>

          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Member Growth
              </h4>
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--success-text)' }} />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                +{memberGrowthRate}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, memberGrowthRate)}%`,
                    backgroundColor: 'var(--success-text)'
                  }}
                />
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {newMembersCount} new members this month
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Insights & Recommendations
        </h3>
        <div className="space-y-3">
          <InsightCard
            type={memberGrowthRate > 5 ? 'success' : memberGrowthRate > 0 ? 'info' : 'warning'}
            title={memberGrowthRate > 5 ? 'Strong Growth!' : memberGrowthRate > 0 ? 'Steady Growth' : 'Growth Opportunity'}
            message={
              memberGrowthRate > 5 
                ? `Your community is growing ${memberGrowthRate}% this month. Keep up the great work!`
                : memberGrowthRate > 0
                ? `Growing at ${memberGrowthRate}% this month. Consider posting more content to boost growth.`
                : 'No new members this month. Try creating engaging content or running a promotion.'
            }
          />
          
          {stats.engagementRate < 25 && (
            <InsightCard
              type="warning"
              title="Boost Engagement"
              message="Your engagement rate is below 25%. Try posting more regularly, asking questions, or creating polls to increase member interaction."
            />
          )}

          {totalContent === 0 && (
            <InsightCard
              type="info"
              title="Start Creating Content"
              message="You haven't posted any content yet. Create your first post or video to engage your members!"
            />
          )}

          {stats.totalMembers > 0 && totalRevenue === 0 && (
            <InsightCard
              type="info"
              title="Monetization Opportunity"
              message="You have members but no paid subscriptions. Consider creating premium tiers with exclusive benefits."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsMetricCard({ label, value, subtitle, change, icon: Icon, color }: any) {
  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `var(--${color}-background)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(--${color}-text)` }} />
        </div>
        {change !== undefined && (
          <span 
            className="text-sm font-semibold"
            style={{ color: change >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function RevenueBarItem({ tierName, members, revenue, percentage, color }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {tierName}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {members} members
          </span>
        </div>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          ${revenue.toFixed(2)}/mo
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="h-3 rounded-full transition-all"
          style={{ 
            width: `${Math.min(100, percentage)}%`,
            backgroundColor: `var(--${color}-text)`
          }}
        />
      </div>
    </div>
  );
}

function InsightCard({ type, title, message }: any) {
  const colorMap: any = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'danger'
  };
  
  const iconMap: any = {
    success: Check,
    info: Sparkles,
    warning: TrendingUp,
    danger: X
  };

  const Icon = iconMap[type] || Sparkles;
  const color = colorMap[type] || 'info';

  return (
    <div 
      className="p-4 rounded-lg border flex items-start gap-3"
      style={{
        backgroundColor: `var(--${color}-background)`,
        borderColor: `var(--${color}-border)`
      }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: 'var(--surface-primary)' }}
      >
        <Icon className="h-5 w-5" style={{ color: `var(--${color}-text)` }} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1" style={{ color: `var(--${color}-text)` }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

function AppearanceTab({ community, communityId }: any) {
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [formData, setFormData] = useState({
    avatar_url: community.avatar_url || '',
    banner_url: community.banner_url || '',
    accent_color: community.accent_color || '#3b82f6',
    long_description: community.long_description || community.description || ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(community.avatar_url || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(community.banner_url || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 5MB');
      return;
    }

    setUploading('avatar');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('communityId', communityId);

      const response = await fetch(`/api/communities/${communityId}/avatar`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setAvatarPreview(data.avatar_url);
        setFormData(prev => ({ ...prev, avatar_url: data.avatar_url }));
        showMessage('success', 'Avatar uploaded successfully!');
      } else {
        showMessage('error', data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      showMessage('error', 'Failed to upload avatar');
    } finally {
      setUploading(null);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 10MB');
      return;
    }

    setUploading('banner');
    try {
      const formData = new FormData();
      formData.append('banner', file);
      formData.append('communityId', communityId);

      const response = await fetch(`/api/communities/${communityId}/banner`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setBannerPreview(data.banner_url);
        setFormData(prev => ({ ...prev, banner_url: data.banner_url }));
        showMessage('success', 'Banner uploaded successfully!');
      } else {
        showMessage('error', data.error || 'Failed to upload banner');
      }
    } catch (error) {
      showMessage('error', 'Failed to upload banner');
    } finally {
      setUploading(null);
    }
  };

  const handleSaveAppearance = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_url: formData.avatar_url,
          banner_url: formData.banner_url,
          accent_color: formData.accent_color,
          long_description: formData.long_description
        })
      });

      if (response.ok) {
        showMessage('success', 'Appearance settings saved successfully!');
        window.location.reload(); // Refresh to see changes
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to save settings');
      }
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Community Appearance
      </h2>

      {/* Success/Error Messages */}
      {message && (
        <div 
          className="p-4 rounded-lg flex items-start gap-3"
          style={{
            backgroundColor: message.type === 'success' ? 'var(--success-background)' : 'var(--danger-background)',
            color: message.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${message.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
          }}
        >
          {message.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : (
            <X className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Avatar Upload */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Camera className="h-5 w-5" />
          Community Avatar
        </h3>
        
        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative">
            <div 
              className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold overflow-hidden"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)'
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  {community.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {uploading === 'avatar' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              This image will appear next to your community name throughout Pryleaf
            </p>
            <div className="flex gap-3">
              <label className="btn btn-primary cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading !== null}
                />
              </label>
              {avatarPreview && (
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    setFormData(prev => ({ ...prev, avatar_url: '' }));
                  }}
                  className="btn btn-outline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
              Recommended: Square image, at least 256x256px, max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Banner Upload */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ImageIcon className="h-5 w-5" />
          Community Banner
        </h3>
        
        {/* Banner Preview */}
        <div className="mb-4">
          <div 
            className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden relative"
            style={{ 
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border-default)',
              backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!bannerPreview && (
              <div className="text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No banner uploaded
                </p>
              </div>
            )}
            {uploading === 'banner' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            This banner appears at the top of your community page
          </p>
          <div className="flex gap-3">
            <label className="btn btn-primary cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload Banner
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
                disabled={uploading !== null}
              />
            </label>
            {bannerPreview && (
              <button
                onClick={() => {
                  setBannerPreview(null);
                  setFormData(prev => ({ ...prev, banner_url: '' }));
                }}
                className="btn btn-outline"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
            Recommended: 1920x400px (wide format), max 10MB
          </p>
        </div>
      </div>

      {/* Long Description */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          About Section
        </h3>
        
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Extended Description
          </label>
          <textarea
            value={formData.long_description}
            onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border resize-none"
            rows={8}
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)'
            }}
            placeholder="Tell visitors what your community is all about, what they'll learn, and why they should join..."
            maxLength={2000}
          />
          <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-subtle)' }}>
            {formData.long_description.length}/2000 characters
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            This description appears on your community's main page for non-members
          </p>
        </div>
      </div>

      {/* Brand Colors */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Palette className="h-5 w-5" />
          Brand Colors
        </h3>
        
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Accent Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={formData.accent_color}
              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
              className="w-24 h-12 rounded-lg border cursor-pointer"
              style={{ borderColor: 'var(--border-default)' }}
            />
            <div className="flex-1">
              <input
                type="text"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border font-mono"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <div 
              className="w-12 h-12 rounded-lg border"
              style={{ 
                backgroundColor: formData.accent_color,
                borderColor: 'var(--border-default)'
              }}
            />
          </div>
          <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
            This color will be used for buttons, links, and highlights in your community (coming soon)
          </p>
        </div>
      </div>

      {/* Preview */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Preview
        </h3>
        
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
          {/* Banner Preview */}
          {bannerPreview && (
            <div 
              className="w-full h-32 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerPreview})` }}
            />
          )}
          
          {/* Community Header Preview */}
          <div className="p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-primary)' }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {community.name}
                </h3>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  @{community.handle}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {community.description}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
          This is how your community will appear to visitors
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button 
          onClick={handleSaveAppearance}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Appearance
            </>
          )}
        </button>
        <button
          onClick={() => {
            setFormData({
              avatar_url: community.avatar_url || '',
              banner_url: community.banner_url || '',
              accent_color: community.accent_color || '#3b82f6',
              long_description: community.long_description || community.description || ''
            });
            setAvatarPreview(community.avatar_url || null);
            setBannerPreview(community.banner_url || null);
          }}
          className="btn btn-outline"
        >
          Reset Changes
        </button>
      </div>
    </div>
  );
}

function SettingsTab({ community, communityId }: any) {
  const [settings, setSettings] = useState(community.settings || {
    auto_accept_members: true,
    allow_member_invites: false,
    show_member_count: true,
    require_email_verification: false,
    moderation_enabled: true
  });
  const [saving, setSaving] = useState(false);

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (document.getElementById('community-name') as HTMLInputElement)?.value,
          description: (document.getElementById('community-description') as HTMLTextAreaElement)?.value,
        })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Community Settings
      </h2>

      {/* Basic Information */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Community Name
            </label>
            <input
              id="community-name"
              type="text"
              defaultValue={community.name}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Handle
            </label>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}>@</span>
              <input
                type="text"
                defaultValue={community.handle}
                disabled
                className="flex-1 px-4 py-2 rounded-lg border opacity-60 cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Handle cannot be changed after creation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              id="community-description"
              defaultValue={community.description}
              className="w-full px-4 py-2 rounded-lg border resize-none"
              rows={3}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              defaultValue={community.category}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Options Trading">Options Trading</option>
              <option value="Technical Analysis">Technical Analysis</option>
              <option value="Value Investing">Value Investing</option>
              <option value="Crypto & DeFi">Crypto & DeFi</option>
              <option value="Day Trading">Day Trading</option>
              <option value="Swing Trading">Swing Trading</option>
              <option value="Market Analysis">Market Analysis</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button 
            onClick={handleSaveBasicInfo}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
            Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Community Settings */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Member Settings
        </h3>
        <div className="space-y-4">
          <SettingToggle
            label="Auto-accept new members"
            description="Automatically approve members who join free tiers"
            checked={settings.auto_accept_members}
            onChange={(checked) => setSettings({ ...settings, auto_accept_members: checked })}
          />
          
          <SettingToggle
            label="Allow member invites"
            description="Let members invite others to the community"
            checked={settings.allow_member_invites}
            onChange={(checked) => setSettings({ ...settings, allow_member_invites: checked })}
          />
          
          <SettingToggle
            label="Show member count"
            description="Display total member count publicly"
            checked={settings.show_member_count}
            onChange={(checked) => setSettings({ ...settings, show_member_count: checked })}
          />
          
          <SettingToggle
            label="Require email verification"
            description="Members must verify their email before joining"
            checked={settings.require_email_verification}
            onChange={(checked) => setSettings({ ...settings, require_email_verification: checked })}
          />
        </div>
      </div>

      {/* Moderation Settings */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield className="h-5 w-5" />
          Moderation & Safety
        </h3>
        <div className="space-y-4">
          <SettingToggle
            label="Enable moderation"
            description="Allow you to moderate content and members"
            checked={settings.moderation_enabled}
            onChange={(checked) => setSettings({ ...settings, moderation_enabled: checked })}
          />
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Content Approval
            </label>
            <select
              value={settings.content_approval || 'none'}
              onChange={(e) => setSettings({ ...settings, content_approval: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="none">No approval required</option>
              <option value="new_members">Approve content from new members</option>
              <option value="all">Approve all member content</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Calendar className="h-5 w-5" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <SettingToggle
            label="New member notifications"
            description="Get notified when someone joins your community"
            checked={settings.notify_new_members !== false}
            onChange={(checked) => setSettings({ ...settings, notify_new_members: checked })}
          />
          
          <SettingToggle
            label="Payment notifications"
            description="Get notified about successful payments and subscriptions"
            checked={settings.notify_payments !== false}
            onChange={(checked) => setSettings({ ...settings, notify_payments: checked })}
          />
          
          <SettingToggle
            label="Weekly summary"
            description="Receive a weekly email with community stats"
            checked={settings.weekly_summary !== false}
            onChange={(checked) => setSettings({ ...settings, weekly_summary: checked })}
          />
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex gap-3">
        <button 
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save All Settings
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div 
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--danger-background)',
          borderColor: 'var(--danger-border)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--danger-text)' }}>
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Archive Community
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Hide your community from public view. You can restore it later.
              </p>
            </div>
            <button className="btn btn-outline text-orange-600 border-orange-600">
              Archive
            </button>
          </div>
          
          <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium mb-1" style={{ color: 'var(--danger-text)' }}>
                  Delete Community
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Permanently delete your community and all associated data. This cannot be undone.
                </p>
              </div>
              <button className="btn btn-outline text-red-600 border-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: any) {
  return (
    <div className="flex items-start justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="flex-1">
        <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {label}
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

import { MoreHorizontal } from 'lucide-react';

