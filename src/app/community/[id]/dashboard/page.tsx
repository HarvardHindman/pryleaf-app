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
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type DashboardTab = 'overview' | 'content' | 'members' | 'tiers' | 'analytics' | 'settings';

export default function CommunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isOwner, setIsOwner] = useState(false);

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

        // Fetch analytics
        const statsResponse = await fetch(`/api/communities/${communityId}/analytics`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId && user) {
      fetchDashboardData();
    }
  }, [communityId, user, router]);

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
        className="border-b px-4 md:px-8 py-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Link href={`/community/${communityId}`}>
            <button className="btn btn-ghost btn-sm mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-6 w-6" style={{ color: 'var(--warning-text)' }} />
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Creator Dashboard
                </h1>
              </div>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
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
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Overview"
          />
          <DashboardTabButton
            active={activeTab === 'content'}
            onClick={() => setActiveTab('content')}
            icon={<MessageSquare className="h-4 w-4" />}
            label="Content"
          />
          <DashboardTabButton
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
            icon={<Users className="h-4 w-4" />}
            label="Members"
          />
          <DashboardTabButton
            active={activeTab === 'tiers'}
            onClick={() => setActiveTab('tiers')}
            icon={<Crown className="h-4 w-4" />}
            label="Tiers"
          />
          <DashboardTabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<TrendingUp className="h-4 w-4" />}
            label="Analytics"
          />
          <DashboardTabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab community={community} stats={stats} communityId={communityId} />}
        {activeTab === 'content' && <ContentRedirect communityId={communityId} />}
        {activeTab === 'members' && <MembersManagementTab communityId={communityId} />}
        {activeTab === 'tiers' && <TiersRedirect communityId={communityId} />}
        {activeTab === 'analytics' && <AnalyticsTab communityId={communityId} stats={stats} />}
        {activeTab === 'settings' && <SettingsTab community={community} communityId={communityId} />}
      </div>
    </div>
  );
}

function DashboardTabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-blue-500' : 'border-transparent'
      }`}
      style={{
        color: active ? 'var(--interactive-primary)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ContentRedirect({ communityId }: any) {
  useEffect(() => {
    window.location.href = `/community/${communityId}/dashboard/content`;
  }, [communityId]);

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
    </div>
  );
}

function TiersRedirect({ communityId }: any) {
  useEffect(() => {
    window.location.href = `/community/${communityId}/dashboard/tiers`;
  }, [communityId]);

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
    </div>
  );
}

function OverviewTab({ community, stats, communityId }: any) {
  const metrics = [
    {
      label: 'Total Members',
      value: stats.totalMembers || community.subscriber_count || 0,
      icon: Users,
      color: 'blue',
      trend: '+12%'
    },
    {
      label: 'Monthly Revenue',
      value: `$${((stats.monthlyRevenue || 0) / 100).toFixed(0)}`,
      icon: DollarSign,
      color: 'green',
      trend: '+8%'
    },
    {
      label: 'Total Posts',
      value: stats.totalPosts || 0,
      icon: MessageSquare,
      color: 'purple',
      trend: '+5'
    },
    {
      label: 'Engagement Rate',
      value: `${stats.engagementRate || 0}%`,
      icon: Heart,
      color: 'red',
      trend: '+3%'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `var(--${metric.color === 'blue' ? 'info' : metric.color === 'green' ? 'success' : metric.color === 'purple' ? 'info' : 'danger'}-background)` }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: `var(--${metric.color === 'blue' ? 'info' : metric.color === 'green' ? 'success' : metric.color === 'purple' ? 'info' : 'danger'}-text)` }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--success-text)' }}>
                  {metric.trend}
                </span>
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                {metric.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
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

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h2>
        <div 
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-background)' }}>
                  <Users className="h-5 w-5" style={{ color: 'var(--info-text)' }} />
                </div>
                <div className="flex-1">
                  <p style={{ color: 'var(--text-primary)' }}>
                    <span className="font-semibold">New member</span> joined the community
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    2 hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchMembers();
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
          Members ({members.length})
        </h2>
      </div>

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
            {members.map((member, index) => (
              <tr key={member.id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}
                    >
                      {member.name?.[0] || 'M'}
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
                  <span className="tier-badge tier-badge-premium">
                    {member.tier_name || 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="btn btn-ghost btn-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Analytics & Insights
      </h2>

      <div 
        className="p-8 rounded-lg border text-center"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Detailed Analytics Coming Soon
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Track revenue, engagement, growth trends, and more.
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ community, communityId }: any) {
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Community Settings
      </h2>

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
              Description
            </label>
            <textarea
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
          <button className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

import { MoreHorizontal } from 'lucide-react';

