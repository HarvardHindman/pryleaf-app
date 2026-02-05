'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  Loader2,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    fetchCommunityStats, 
    communityStatsCache,
    fetchCommunityAnalytics,
    communityAnalyticsCache
  } = useCommunityCache();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(communityStatsCache.get(communityId) || {});
  const [analytics, setAnalytics] = useState<any>(communityAnalyticsCache.get(communityId) || {});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch stats
        const statsData = await fetchCommunityStats(communityId);
        setStats(statsData);

        // Fetch detailed analytics
        const analyticsData = await fetchCommunityAnalytics(communityId);
        setAnalytics(analyticsData);
        
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId && user) {
      fetchData();
    }
  }, [communityId, user, fetchCommunityStats, fetchCommunityAnalytics]);

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  const growthData = analytics.growth || [];
  const engagementData = analytics.engagement || {};

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Analytics
        </h1>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)'
          }}
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {stats.totalMembers || 0}
          </div>
          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--success-text)' }}>
            <TrendingUp className="h-3 w-3" />
            +{stats.newMembersThisMonth || 0} this month
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
              Revenue
            </span>
            <DollarSign className="h-5 w-5" style={{ color: 'var(--success-text)' }} />
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            ${stats.monthlyRevenue || 0}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            per month
          </div>
        </div>

        {/* Total Views */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Total Views
            </span>
            <Eye className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {stats.totalViews || 0}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            all time
          </div>
        </div>

        {/* Engagement Rate */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Engagement
            </span>
            <Heart className="h-5 w-5" style={{ color: 'var(--danger-text)' }} />
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {engagementData.rate || 0}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            avg. engagement
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div 
        className="rounded-xl border p-6 mb-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Member Growth (Last 30 Days)
        </h3>
        
        {growthData.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-2">
            {growthData.map((day: any, index: number) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: `${(day.members / Math.max(...growthData.map((d: any) => d.members))) * 100}%`,
                    backgroundColor: 'var(--interactive-primary)',
                    minHeight: '4px'
                  }}
                />
                {index % 5 === 0 && (
                  <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                    {new Date(day.date).getDate()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            Not enough data yet
          </div>
        )}
      </div>

      {/* Content Performance */}
      <div 
        className="rounded-xl border p-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Content Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Average Views
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {engagementData.avgViews || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Total Likes
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {engagementData.totalLikes || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Total Comments
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {engagementData.totalComments || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
