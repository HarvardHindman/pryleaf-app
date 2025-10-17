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
  MessageSquare,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
    owner_id?: string;
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
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityWithChannels[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<CommunityWithChannels[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchCommunities() {
      try {
        // Fetch memberships
        const channelsResponse = await fetch('/api/user/channels');
        const channelsData = await channelsResponse.json();
        
        // Fetch communities where user is owner
        const ownedResponse = await fetch('/api/communities');
        const ownedData = await ownedResponse.json();
        
        const allCommunities = channelsData.communities || [];
        setCommunities(allCommunities);
        
        // Filter owned communities from all communities API
        if (user && ownedData.communities) {
          const owned = ownedData.communities.filter(
            (c: any) => c.owner_id === user.id
          );
          
          // Convert to CommunityWithChannels format
          const ownedFormatted = owned.map((c: any) => ({
            community: c,
            tier: { name: 'Owner', tier_level: 999 },
            membership: { status: 'owner', tier_level: 999 },
            channels: []
          }));
          
          setOwnedCommunities(ownedFormatted);
          
          // Store the owned community as last active
          if (ownedFormatted.length > 0 && typeof window !== 'undefined') {
            localStorage.setItem('lastActiveCommunity', ownedFormatted[0].community.id);
          }
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCommunities();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-full px-2 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  // If user doesn't own a community, show "Create Community" button
  if (ownedCommunities.length === 0) {
    return (
      <Link href="/community/create">
        <button
          className="w-full px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
          style={{
            backgroundColor: 'var(--interactive-primary)',
            color: 'var(--surface-primary)',
            border: '1px solid var(--interactive-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--interactive-primary)';
          }}
        >
          <Plus className="h-3 w-3" />
          Create Community
        </button>
      </Link>
    );
  }

  // User owns at least one community
  const ownedCommunity = ownedCommunities[0]; // Use first owned community
  
  // Check if currently viewing own community
  const communityMatch = pathname.match(/^\/community\/([^\/]+)/);
  const currentCommunityId = communityMatch ? communityMatch[1] : null;
  const isViewingOwnCommunity = currentCommunityId === ownedCommunity.community.id;

  // If viewing own community, show "Browse Communities" button
  if (isViewingOwnCommunity) {
    return (
      <Link href="/community">
        <button
          className="w-full px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
          style={{
            backgroundColor: 'var(--interactive-primary)',
            color: 'var(--surface-primary)',
            border: '1px solid var(--interactive-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--interactive-primary)';
          }}
        >
          <Hash className="h-3 w-3" />
          Browse Communities
        </button>
      </Link>
    );
  }

  // Otherwise, show "Your Community" button
  return (
    <Link href={`/community/${ownedCommunity.community.id}`}>
      <button
        className="w-full px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
        style={{
          backgroundColor: 'var(--success-background)',
          color: 'var(--success-text)',
          border: '1px solid var(--success-border)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <Crown className="h-3 w-3" />
        Your Community
      </button>
    </Link>
  );
}

