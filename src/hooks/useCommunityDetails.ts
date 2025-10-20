import { useState, useEffect } from 'react';
import { useCommunityCache, type CommunityDetails } from '@/contexts/CommunityCacheContext';

/**
 * Custom hook to fetch and cache community details
 * Automatically fetches on mount and returns cached data when available
 */
export function useCommunityDetails(communityId: string | null) {
  const { 
    communityDetailsCache, 
    fetchCommunityDetails, 
    loadingDetails 
  } = useCommunityCache();
  
  const [details, setDetails] = useState<CommunityDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) {
      setDetails(null);
      return;
    }

    // Check cache first
    const cached = communityDetailsCache.get(communityId);
    if (cached) {
      setDetails(cached);
      return;
    }

    // Fetch if not in cache
    async function loadDetails() {
      try {
        setError(null);
        const result = await fetchCommunityDetails(communityId);
        if (result) {
          setDetails(result);
        } else {
          setError('Community not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load community');
      }
    }

    loadDetails();
  }, [communityId, communityDetailsCache, fetchCommunityDetails]);

  return {
    details,
    loading: communityId ? loadingDetails.has(communityId) : false,
    error,
    refetch: () => communityId ? fetchCommunityDetails(communityId, true) : Promise.resolve(null)
  };
}

