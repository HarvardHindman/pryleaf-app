'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hash,
  Crown,
  Plus
} from 'lucide-react';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function CommunityNavigation() {
  const { ownedCommunities, loading } = useCommunityCache();
  const pathname = usePathname();

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
        <Crown className="h-3 w-3" />
        Your Community
      </button>
    </Link>
  );
}

