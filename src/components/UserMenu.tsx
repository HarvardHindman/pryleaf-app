'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronUp, Crown, Plus, Link2, Check, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const { 
    ownedCommunities, 
    userMemberships, 
    loading: communitiesLoading, 
    selectedCommunityId, 
    setSelectedCommunityId,
    getCommunityById 
  } = useCommunityCache();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.email?.split('@')[0] || 'User';
  const hasCommunities = ownedCommunities.length > 0 || userMemberships.length > 0;

  // Handle switching community
  const handleSwitchCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setIsOpen(false);
    router.push(`/community/${communityId}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <div className="px-2 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{
            backgroundColor: isOpen ? 'var(--surface-tertiary)' : 'rgba(0, 0, 0, 0.02)',
            color: 'var(--text-primary)'
          }}
        >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ 
            backgroundColor: 'var(--interactive-bg-muted)',
            color: 'var(--interactive-primary)'
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div 
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayName}
          </div>
          <div 
            className="text-xs truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {user.email}
          </div>
        </div>
        <ChevronUp 
          className={`h-4 w-4 transition-transform ${isOpen ? '' : 'rotate-180'}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute bottom-full mb-2 rounded-lg shadow-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)',
            width: '220px',
            right: '0',
            transform: 'translateX(calc(50% - 20px))'
          }}
        >
          <div className="py-2">
            {/* Profile */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Profile</span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </Link>

            {/* Divider */}
            <div 
              className="my-2 mx-4 border-t"
              style={{ borderColor: 'var(--border-default)' }}
            />

            {/* Communities - Simple List */}
            {!communitiesLoading && [...ownedCommunities, ...userMemberships].map(({ community }) => (
              <button
                key={community.id}
                onClick={() => handleSwitchCommunity(community.id)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors w-full"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium flex-1 text-left truncate">{community.name}</span>
                {selectedCommunityId === community.id && (
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--interactive-primary)' }} />
                )}
              </button>
            ))}

            {/* Community Actions */}
            <Link
              href="/invite"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Link2 className="h-4 w-4" />
              <span className="text-sm font-medium">Join via Invite</span>
            </Link>
            <Link
              href="/community/create"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Create Community</span>
            </Link>

            {/* Divider */}
            <div 
              className="my-2 mx-4 border-t"
              style={{ borderColor: 'var(--border-default)' }}
            />

            {/* Sign Out */}
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--danger-text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger-background)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
