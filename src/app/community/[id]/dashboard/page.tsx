'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Play,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Award,
  UserPlus,
  MessageSquare,
  BarChart3,
  Edit,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  href: string;
}

export default function CommunityDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    fetchCommunityStats, 
    communityStatsCache
  } = useCommunityCache();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [stats, setStats] = useState<any>(communityStatsCache.get(communityId) || {});
  const [tiersCount, setTiersCount] = useState(0);
  const [invitesCount, setInvitesCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch community details
        const communityResponse = await fetch(`/api/communities/${communityId}`);
        const communityData = await communityResponse.json();
        
        if (!communityData.community) {
          router.push('/');
          return;
        }

        // Check if user is owner
        if (communityData.community.owner_id !== user?.id) {
          router.push(`/community/${communityId}`);
          return;
        }

        setCommunity(communityData.community);

        // Fetch stats
        const statsData = await fetchCommunityStats(communityId);
        setStats(statsData);

        // Fetch tiers count for onboarding
        const tiersResponse = await fetch(`/api/communities/${communityId}/tiers`);
        if (tiersResponse.ok) {
          const tiersData = await tiersResponse.json();
          setTiersCount(tiersData.tiers?.length || 0);
        }

        // Fetch invites count for onboarding
        const invitesResponse = await fetch(`/api/communities/${communityId}/invites`);
        if (invitesResponse.ok) {
          const invitesData = await invitesResponse.json();
          setInvitesCount(invitesData.invites?.length || 0);
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
  }, [communityId, user, router, fetchCommunityStats]);

  // Calculate onboarding tasks
  const onboardingTasks: OnboardingTask[] = community ? [
    {
      id: 'avatar',
      title: 'Upload community avatar & banner',
      description: 'Make your community stand out',
      icon: ImageIcon,
      completed: !!(community.avatar_url || community.banner_url),
      href: `/community/${communityId}/dashboard/appearance`
    },
    {
      id: 'tier',
      title: 'Create first membership tier',
      description: 'Start monetizing your community',
      icon: Award,
      completed: tiersCount > 0,
      href: `/community/${communityId}/dashboard/tiers`
    },
    {
      id: 'invite',
      title: 'Invite first members',
      description: 'Generate invite links to grow',
      icon: UserPlus,
      completed: invitesCount > 0,
      href: `/community/${communityId}/dashboard/invites`
    },
    {
      id: 'chat',
      title: 'Setup chat channels',
      description: 'Connect with your members',
      icon: MessageSquare,
      completed: false, // Always incomplete for now
      href: `/community/${communityId}/chat`
    }
  ] : [];

  const completedTasks = onboardingTasks.filter(task => task.completed).length;
  const totalTasks = onboardingTasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  if (loading) {
    return (
      <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
        </div>
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Stats Overview - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Members */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Total Members
              </span>
              <Users className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalMembers || 0}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats.activeMembers || 0} active this month
            </div>
          </div>

          {/* Total Content */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Total Content
              </span>
              <Play className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalContent || 0}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats.publishedContent || 0} published
            </div>
          </div>

          {/* Monthly Revenue */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Monthly Revenue
              </span>
              <DollarSign className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${stats.monthlyRevenue || 0}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--success-text)' }}>
              This month
            </div>
          </div>
        </div>

        {/* Getting Started Checklist */}
        <div 
          className="rounded-xl border p-6 mb-6"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Getting Started
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {completedTasks} of {totalTasks} completed
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="w-full h-2 rounded-full mb-6 overflow-hidden"
            style={{ backgroundColor: 'var(--surface-tertiary)' }}
          >
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: 'var(--interactive-primary)'
              }}
            />
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {onboardingTasks.map((task) => (
              <Link key={task.id} href={task.href}>
                <div 
                  className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: task.completed ? 'var(--success-border)' : 'var(--border-default)',
                    opacity: task.completed ? 0.7 : 1
                  }}
                >
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--success-text)' }} />
                    ) : (
                      <Circle className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--surface-tertiary)' }}
                  >
                    <task.icon className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {task.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {task.description}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href={`/community/${communityId}/dashboard/analytics`}>
            <div 
              className="p-5 rounded-xl border cursor-pointer hover:shadow-md transition-all"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <BarChart3 className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  View Analytics
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Track growth and engagement
              </p>
            </div>
          </Link>

          <Link href={`/community/${communityId}/dashboard/members`}>
            <div 
              className="p-5 rounded-xl border cursor-pointer hover:shadow-md transition-all"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <Users className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Manage Members
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                View and manage your members
              </p>
            </div>
          </Link>

          <Link href={`/community/${communityId}/dashboard/content`}>
            <div 
              className="p-5 rounded-xl border cursor-pointer hover:shadow-md transition-all"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <Play className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Library
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Post videos and updates
              </p>
            </div>
          </Link>
        </div>

        {/* Community Settings */}
        <div 
          className="rounded-xl border p-6"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon className="h-4 w-4" />
            Community Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Community Name
              </label>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {community.name}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Handle
              </label>
              <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                @{community.handle}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                {community.is_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Visibility
              </label>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {community.is_public ? 'Public' : 'Private'}
              </div>
            </div>
          </div>

          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--surface-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)'
            }}
          >
            <Edit className="h-3.5 w-3.5 inline mr-2" />
            Edit Community Settings
          </button>
        </div>
      </div>
    </div>
  );
}
