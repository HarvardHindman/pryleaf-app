'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Hash,
  Bell,
  Lock,
  Crown,
  MessageSquare
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  unreadCount: number;
  minimumTierLevel: number;
  isAnnouncementOnly: boolean;
}

interface CommunityWithChannels {
  community: {
    id: string;
    name: string;
    handle: string;
    avatar_url?: string;
  };
  tier: {
    name: string;
    tier_level: number;
  };
  membership: {
    status: string;
    tier_level: number;
  };
  channels: Channel[];
}

export default function CommunityNavigation() {
  const [communities, setCommunities] = useState<CommunityWithChannels[]>([]);
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const response = await fetch('/api/user/channels');
        const data = await response.json();
        
        if (data.communities) {
          setCommunities(data.communities);
          // Auto-expand communities with channels
          const expanded = new Set(
            data.communities
              .filter((c: CommunityWithChannels) => c.channels.length > 0)
              .map((c: CommunityWithChannels) => c.community.id)
          );
          setExpandedCommunities(expanded);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  const toggleCommunity = (communityId: string) => {
    const newExpanded = new Set(expandedCommunities);
    if (newExpanded.has(communityId)) {
      newExpanded.delete(communityId);
    } else {
      newExpanded.add(communityId);
    }
    setExpandedCommunities(newExpanded);
  };

  const getTierBadgeClass = (tierLevel: number) => {
    if (tierLevel === 0) return 'member-badge-free';
    if (tierLevel === 1) return 'member-badge-premium';
    if (tierLevel >= 2) return 'member-badge-elite';
    return 'member-badge-free';
  };

  if (loading) {
    return (
      <div className="w-full px-2 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <Link href="/community">
        <button
          className="w-full px-2 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: 'var(--interactive-primary)',
            color: 'var(--surface-primary)',
            border: '1px solid var(--interactive-primary)'
          }}
        >
          Browse Communities
        </button>
      </Link>
    );
  }

  // Get current community from URL or use first one
  const currentCommunityId = pathname.match(/^\/community\/([^\/]+)/)?.[1];
  
  // Find the current community or default to first
  const defaultCommunity = communities[0];
  const currentCommunity = currentCommunityId 
    ? communities.find(c => c.community.id === currentCommunityId) || defaultCommunity
    : defaultCommunity;

  return (
    <select
      className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer appearance-none"
      style={{
        backgroundColor: 'var(--interactive-primary)',
        color: 'var(--surface-primary)',
        border: '1px solid var(--interactive-primary)',
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem'
      }}
      value={currentCommunity?.community.id || ''}
      onChange={(e) => {
        const selectedId = e.target.value;
        window.location.href = `/community/${selectedId}`;
      }}
    >
      {communities.map((item) => (
        <option 
          key={item.community.id} 
          value={item.community.id}
          style={{
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {item.community.name}
        </option>
      ))}
    </select>
  );
}

