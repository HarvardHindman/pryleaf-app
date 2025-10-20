'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

// Types
export interface Community {
  id: string;
  name: string;
  handle: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  category?: string;
  owner_id: string;
  subscriber_count: number;
  video_count: number;
  verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityWithChannels {
  community: Community;
  tier: {
    name: string;
    tier_level: number;
  };
  membership: {
    status: string;
    tier_level: number;
  };
  channels: Array<{
    id: string;
    name: string;
    unreadCount: number;
    minimumTierLevel: number;
    isAnnouncementOnly: boolean;
  }>;
}

export interface CommunityDetails extends Community {
  membershipStatus?: {
    isMember: boolean;
    isOwner: boolean;
    tierLevel: number;
    tierName: string;
  };
  tiers?: any[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CommunityCacheContextType {
  // Cached data
  allCommunities: Community[];
  ownedCommunities: CommunityWithChannels[];
  userMemberships: CommunityWithChannels[];
  communityDetailsCache: Map<string, CommunityDetails>;
  
  // Loading states
  loading: boolean;
  loadingDetails: Set<string>;
  
  // Fetch methods
  fetchAllCommunities: (force?: boolean) => Promise<void>;
  fetchUserMemberships: (force?: boolean) => Promise<void>;
  fetchCommunityDetails: (communityId: string, force?: boolean) => Promise<CommunityDetails | null>;
  
  // Cache management
  invalidateCache: (type?: 'all' | 'communities' | 'memberships' | 'details') => void;
  invalidateCommunityDetails: (communityId: string) => void;
  
  // Helper methods
  getCommunityById: (communityId: string) => Community | undefined;
  isUserOwner: (communityId: string) => boolean;
  getUserMembershipForCommunity: (communityId: string) => CommunityWithChannels | undefined;
}

const CommunityCacheContext = createContext<CommunityCacheContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function CommunityCacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Cache state
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<CommunityWithChannels[]>([]);
  const [userMemberships, setUserMemberships] = useState<CommunityWithChannels[]>([]);
  const [communityDetailsCache, setCommunityDetailsCache] = useState<Map<string, CommunityDetails>>(new Map());
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  
  // Cache timestamps
  const cacheTimestamps = useRef({
    allCommunities: 0,
    userMemberships: 0,
    communityDetails: new Map<string, number>()
  });

  // Check if cache is fresh
  const isCacheFresh = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Fetch all communities
  const fetchAllCommunities = useCallback(async (force = false) => {
    if (!force && isCacheFresh(cacheTimestamps.current.allCommunities)) {
      return; // Use cached data
    }

    try {
      const response = await fetch('/api/communities');
      const data = await response.json();
      
      if (response.ok) {
        const communities = data.communities || [];
        setAllCommunities(communities);
        cacheTimestamps.current.allCommunities = Date.now();
        
        // Filter owned communities if user is logged in
        if (user) {
          const owned = communities
            .filter((c: Community) => c.owner_id === user.id)
            .map((c: Community) => ({
              community: c,
              tier: { name: 'Owner', tier_level: 999 },
              membership: { status: 'owner', tier_level: 999 },
              channels: []
            }));
          setOwnedCommunities(owned);
          
          // Store in localStorage
          if (owned.length > 0 && typeof window !== 'undefined') {
            localStorage.setItem('lastActiveCommunity', owned[0].community.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching all communities:', error);
    }
  }, [user, isCacheFresh]);

  // Fetch user memberships with channels
  const fetchUserMemberships = useCallback(async (force = false) => {
    if (!user) {
      setUserMemberships([]);
      return;
    }

    if (!force && isCacheFresh(cacheTimestamps.current.userMemberships)) {
      return; // Use cached data
    }

    try {
      const response = await fetch('/api/user/channels');
      const data = await response.json();
      
      if (response.ok) {
        const memberships = data.communities || [];
        setUserMemberships(memberships);
        cacheTimestamps.current.userMemberships = Date.now();
      }
    } catch (error) {
      console.error('Error fetching user memberships:', error);
    }
  }, [user, isCacheFresh]);

  // Fetch specific community details
  const fetchCommunityDetails = useCallback(async (communityId: string, force = false): Promise<CommunityDetails | null> => {
    const cachedTimestamp = cacheTimestamps.current.communityDetails.get(communityId) || 0;
    
    if (!force && isCacheFresh(cachedTimestamp)) {
      return communityDetailsCache.get(communityId) || null; // Use cached data
    }

    // Mark as loading
    setLoadingDetails(prev => new Set(prev).add(communityId));

    try {
      const response = await fetch(`/api/communities/${communityId}`);
      const data = await response.json();
      
      if (response.ok && data.community) {
        const details: CommunityDetails = {
          ...data.community,
          membershipStatus: data.membershipStatus,
          tiers: data.tiers
        };
        
        // Update cache
        setCommunityDetailsCache(prev => new Map(prev).set(communityId, details));
        cacheTimestamps.current.communityDetails.set(communityId, Date.now());
        
        return details;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching community details for ${communityId}:`, error);
      return null;
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
    }
  }, [isCacheFresh, communityDetailsCache]);

  // Invalidate cache
  const invalidateCache = useCallback((type: 'all' | 'communities' | 'memberships' | 'details' = 'all') => {
    switch (type) {
      case 'all':
        cacheTimestamps.current.allCommunities = 0;
        cacheTimestamps.current.userMemberships = 0;
        cacheTimestamps.current.communityDetails.clear();
        break;
      case 'communities':
        cacheTimestamps.current.allCommunities = 0;
        break;
      case 'memberships':
        cacheTimestamps.current.userMemberships = 0;
        break;
      case 'details':
        cacheTimestamps.current.communityDetails.clear();
        break;
    }
  }, []);

  // Invalidate specific community details
  const invalidateCommunityDetails = useCallback((communityId: string) => {
    cacheTimestamps.current.communityDetails.delete(communityId);
    setCommunityDetailsCache(prev => {
      const newMap = new Map(prev);
      newMap.delete(communityId);
      return newMap;
    });
  }, []);

  // Helper: Get community by ID
  const getCommunityById = useCallback((communityId: string): Community | undefined => {
    return allCommunities.find(c => c.id === communityId);
  }, [allCommunities]);

  // Helper: Check if user owns a community
  const isUserOwner = useCallback((communityId: string): boolean => {
    if (!user) return false;
    return ownedCommunities.some(oc => oc.community.id === communityId);
  }, [user, ownedCommunities]);

  // Helper: Get user membership for community
  const getUserMembershipForCommunity = useCallback((communityId: string): CommunityWithChannels | undefined => {
    return userMemberships.find(m => m.community.id === communityId);
  }, [userMemberships]);

  // Initial load
  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      await Promise.all([
        fetchAllCommunities(),
        fetchUserMemberships()
      ]);
      setLoading(false);
    }

    if (user) {
      initialLoad();
    } else {
      // Still fetch all communities even if not logged in
      fetchAllCommunities().then(() => setLoading(false));
    }
  }, [user, fetchAllCommunities, fetchUserMemberships]);

  // Clear cache when user logs out
  useEffect(() => {
    if (!user) {
      setUserMemberships([]);
      setOwnedCommunities([]);
      invalidateCache('all');
    }
  }, [user, invalidateCache]);

  const value: CommunityCacheContextType = {
    allCommunities,
    ownedCommunities,
    userMemberships,
    communityDetailsCache,
    loading,
    loadingDetails,
    fetchAllCommunities,
    fetchUserMemberships,
    fetchCommunityDetails,
    invalidateCache,
    invalidateCommunityDetails,
    getCommunityById,
    isUserOwner,
    getUserMembershipForCommunity
  };

  return (
    <CommunityCacheContext.Provider value={value}>
      {children}
    </CommunityCacheContext.Provider>
  );
}

export function useCommunityCache() {
  const context = useContext(CommunityCacheContext);
  if (context === undefined) {
    throw new Error('useCommunityCache must be used within a CommunityCacheProvider');
  }
  return context;
}

