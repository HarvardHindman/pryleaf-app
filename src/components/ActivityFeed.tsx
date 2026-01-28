'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  AtSign, 
  Users, 
  Bell,
  MessageSquare,
  Video,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

type ActivityType = 'video' | 'mention' | 'member' | 'announcement';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  community: string;
  communityId: string;
  time: string;
  unread?: boolean;
  link?: string;
  thumbnail?: string;
}

// Placeholder activity data
const PLACEHOLDER_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'video',
    title: 'New Video: Weekly Market Analysis',
    description: 'Breaking down this week\'s market movements and what to watch next week',
    community: 'Alpha Traders',
    communityId: 'alpha-traders',
    time: '10 min ago',
    unread: true,
    link: '/community/alpha-traders/videos'
  },
  {
    id: '2',
    type: 'mention',
    title: 'You were mentioned in #general',
    description: '@you what do you think about the NVDA earnings?',
    community: 'Tech Investors',
    communityId: 'tech-investors',
    time: '25 min ago',
    unread: true,
    link: '/chat'
  },
  {
    id: '3',
    type: 'video',
    title: 'New Video: Understanding Options Greeks',
    description: 'A deep dive into Delta, Gamma, Theta, and Vega',
    community: 'Options Academy',
    communityId: 'options-academy',
    time: '1h ago',
    unread: false,
    link: '/community/options-academy/videos'
  },
  {
    id: '4',
    type: 'member',
    title: '3 new members joined',
    description: 'Your community is growing!',
    community: 'My Trading Group',
    communityId: 'my-trading-group',
    time: '2h ago',
    unread: false,
    link: '/community/my-trading-group/dashboard'
  },
  {
    id: '5',
    type: 'announcement',
    title: 'Community Update',
    description: 'New features available: Custom watchlists for members',
    community: 'Alpha Traders',
    communityId: 'alpha-traders',
    time: '5h ago',
    unread: false,
    link: '/community/alpha-traders'
  }
];

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'video':
      return <Play className="h-4 w-4" />;
    case 'mention':
      return <AtSign className="h-4 w-4" />;
    case 'member':
      return <Users className="h-4 w-4" />;
    case 'announcement':
      return <Bell className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'video':
      return 'var(--interactive-primary)';
    case 'mention':
      return 'var(--info-text)';
    case 'member':
      return 'var(--success-text)';
    case 'announcement':
      return 'var(--warning-text)';
  }
};

export default function ActivityFeed() {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  
  const activities = PLACEHOLDER_ACTIVITIES;
  const unreadCount = activities.filter(a => a.unread).length;
  
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const filters: { value: 'all' | ActivityType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Bell className="h-3 w-3" /> },
    { value: 'video', label: 'Videos', icon: <Video className="h-3 w-3" /> },
    { value: 'mention', label: 'Mentions', icon: <AtSign className="h-3 w-3" /> },
  ];

  return (
    <div 
      className="overflow-hidden h-full flex flex-col"
      style={{ 
        backgroundColor: 'var(--card-bg, var(--surface-primary))',
        border: '1px solid var(--card-border, var(--border-subtle))',
        borderRadius: '0.875rem',
        boxShadow: 'var(--card-shadow, var(--shadow-sm))'
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-divider, var(--border-subtle))' }}
      >
        <div className="flex items-center gap-1.5">
          <h3 
            className="text-xs font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Activity
          </h3>
          {unreadCount > 0 && (
            <span 
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ 
                backgroundColor: 'var(--interactive-primary)',
                color: 'white'
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        
        {/* Filter tabs */}
        <div className="flex items-center gap-0.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
              style={{ 
                backgroundColor: filter === f.value ? 'var(--surface-tertiary)' : 'transparent',
                color: filter === f.value ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              {f.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredActivities.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Bell 
              className="h-6 w-6 mx-auto mb-2" 
              style={{ color: 'var(--text-muted)' }} 
            />
            <p 
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              No activity to show
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <Link
              key={activity.id}
              href={activity.link || '#'}
              className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
              style={{ 
                backgroundColor: activity.unread ? 'var(--interactive-bg-subtle)' : 'transparent',
                borderBottom: index < filteredActivities.length - 1 ? '1px solid var(--border-divider, var(--border-subtle))' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!activity.unread) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activity.unread 
                  ? 'var(--interactive-bg-subtle)' 
                  : 'transparent';
              }}
            >
              {/* Icon */}
              <div 
                className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--surface-tertiary)',
                  color: getActivityColor(activity.type)
                }}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p 
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activity.title}
                  </p>
                  {activity.unread && (
                    <span 
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--interactive-primary)' }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span 
                    className="text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {activity.community}
                  </span>
                  <span style={{ color: 'var(--text-subtle)' }}>·</span>
                  <span 
                    className="text-[10px]"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {activity.time}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
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
          View all activity
        </button>
      </div>
    </div>
  );
}

