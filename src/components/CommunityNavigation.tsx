'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Hash,
  Crown,
  Plus,
  ChevronUp,
  Check,
  Link2,
  Users,
  Globe
} from 'lucide-react';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function CommunityNavigation() {
  const { 
    ownedCommunities, 
    userMemberships, 
    loading, 
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

  if (loading) {
    return (
      <div className="w-full px-2 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const selectedCommunity = selectedCommunityId ? getCommunityById(selectedCommunityId) : null;

  // Handle switching community
  const handleSwitchCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setIsOpen(false);
    router.push(`/community/${communityId}`);
  };

  const hasCommunities = ownedCommunities.length > 0 || userMemberships.length > 0;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center group hover:bg-opacity-80"
        style={{
          backgroundColor: 'var(--surface-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)'
        }}
        title={selectedCommunity?.name || "Select Community"}
      >
        {selectedCommunity ? (
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden" style={{ backgroundColor: 'var(--interactive-bg-muted)', color: 'var(--interactive-primary)' }}>
            {selectedCommunity.avatar_url ? (
              <img src={selectedCommunity.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              selectedCommunity.name.charAt(0).toUpperCase()
            )}
          </div>
        ) : (
          <Globe className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute bottom-full left-0 w-64 mb-2 rounded-lg shadow-xl border overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {/* Owned Communities */}
            {ownedCommunities.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Managed by you
                </div>
                {ownedCommunities.map(({ community }) => (
                  <button
                    key={community.id}
                    onClick={() => handleSwitchCommunity(community.id)}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden" style={{ backgroundColor: 'var(--interactive-bg-muted)', color: 'var(--interactive-primary)' }}>
                      {community.avatar_url ? (
                        <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        community.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1">
                        {community.name}
                        {selectedCommunityId === community.id && (
                          <Check className="h-3 w-3" style={{ color: 'var(--interactive-primary)' }} />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">@{community.handle}</div>
                    </div>
                    <Crown className="h-3 w-3 text-yellow-500" />
                  </button>
                ))}
              </div>
            )}

            {/* Joined Communities */}
            {userMemberships.length > 0 && (
              <div className="py-2 border-t border-gray-100 dark:border-gray-800">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Joined
                </div>
                {userMemberships.map(({ community }) => (
                  <button
                    key={community.id}
                    onClick={() => handleSwitchCommunity(community.id)}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-purple-600 overflow-hidden">
                      {community.avatar_url ? (
                        <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        community.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1">
                        {community.name}
                        {selectedCommunityId === community.id && (
                          <Check className="h-3 w-3" style={{ color: 'var(--interactive-primary)' }} />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {community.subscriber_count} members
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!hasCommunities && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No communities found
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t bg-gray-50 dark:bg-gray-900 dark:border-gray-800 space-y-1">
            <Link href="/community/create" onClick={() => setIsOpen(false)}>
              <button 
                className="w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-2 hover:opacity-80"
                style={{ color: 'var(--interactive-primary)' }}
              >
                <Plus className="h-3 w-3" />
                Create Community
              </button>
            </Link>
            <Link href="/invite" onClick={() => setIsOpen(false)}>
              <button className="w-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2">
                <Link2 className="h-3 w-3" />
                Join via Invite
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
