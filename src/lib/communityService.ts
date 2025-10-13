import { createSupabaseServerClient } from './supabaseServer';
import { createDefaultCommunityChannels } from './streamChatService';

export interface Community {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  description: string;
  long_description?: string;
  avatar_url?: string;
  banner_url?: string;
  specialty: string;
  category: string;
  verified: boolean;
  subscriber_count: number;
  total_revenue: number;
  status: 'active' | 'paused' | 'archived';
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface CommunityTier {
  id: string;
  community_id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  tier_level: number;
  features: any[];
  perks: string[];
  max_members?: number;
  stripe_price_id?: string;
  stripe_price_id_yearly?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused' | 'pending';
  subscribed_at: string;
  current_period_start: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  last_active_at?: string;
  total_messages_sent: number;
  total_content_viewed: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityChannel {
  id: string;
  community_id: string;
  stream_channel_id: string;
  name: string;
  description?: string;
  minimum_tier_level: number;
  channel_type: 'text' | 'announcement' | 'voice' | 'live';
  is_announcement_only: boolean;
  is_active: boolean;
  sort_order: number;
  slow_mode_duration?: number;
  message_retention_days?: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityContent {
  id: string;
  community_id: string;
  creator_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'trading_signal' | 'resource' | 'live_session' | 'course';
  content_url: string;
  thumbnail_url?: string;
  minimum_tier_level: number;
  is_published: boolean;
  published_at?: string;
  scheduled_publish_at?: string;
  duration?: number;
  file_size?: number;
  views: number;
  unique_views: number;
  likes: number;
  comments_count: number;
  tags: string[];
  category?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a user has access to a community resource based on tier level
 */
export async function hasAccessToResource(
  userId: string,
  communityId: string,
  requiredTierLevel: number
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // Check if user is community owner
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single();

  if (community?.owner_id === userId) {
    return true; // Owners have full access
  }

  // Check user's membership and tier level
  const { data: membership } = await supabase
    .from('community_memberships')
    .select(`
      status,
      tier:community_tiers!inner(tier_level)
    `)
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return false; // No membership
  }

  // Check if user's tier level is sufficient
  const userTierLevel = (membership.tier as any).tier_level;
  return userTierLevel >= requiredTierLevel;
}

/**
 * Get user's tier level in a community
 * Returns: -1 (not a member), 0+ (tier level), 999 (owner)
 */
export async function getUserTierLevel(
  userId: string,
  communityId: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  // Check if user is owner
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single();

  if (community?.owner_id === userId) {
    return 999; // Owner has maximum tier level
  }

  // Get user's tier level
  const { data: membership } = await supabase
    .from('community_memberships')
    .select(`
      status,
      tier:community_tiers!inner(tier_level)
    `)
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return -1; // Not a member
  }

  return (membership.tier as any).tier_level;
}

/**
 * Check if user is community owner
 */
export async function isCommunityOwner(
  userId: string,
  communityId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single();

  return community?.owner_id === userId;
}

/**
 * Get all communities with optional filtering
 */
export async function getCommunities(params?: {
  category?: string;
  verified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('communities')
    .select('*')
    .eq('status', 'active')
    .order('subscriber_count', { ascending: false });

  if (params?.category) {
    query = query.eq('category', params.category);
  }

  if (params?.verified !== undefined) {
    query = query.eq('verified', params.verified);
  }

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,handle.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  return query;
}

/**
 * Get community with tiers and membership status
 */
export async function getCommunityDetails(communityId: string, userId?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (communityError || !community) {
    return { community: null, tiers: [], membershipStatus: null };
  }

  // Get tiers
  const { data: tiers } = await supabase
    .from('community_tiers')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('sort_order');

  // Get membership status if user is logged in
  let membershipStatus = null;
  if (userId) {
    const tierLevel = await getUserTierLevel(userId, communityId);
    
    if (tierLevel >= 0) {
      const { data: membership } = await supabase
        .from('community_memberships')
        .select(`
          *,
          tier:community_tiers!inner(*)
        `)
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      membershipStatus = {
        isMember: true,
        tierLevel,
        isOwner: tierLevel === 999,
        membership
      };
    } else {
      membershipStatus = {
        isMember: false,
        tierLevel: -1,
        isOwner: false,
        membership: null
      };
    }
  }

  return {
    community,
    tiers: tiers || [],
    membershipStatus
  };
}

/**
 * Get user's memberships across all communities
 */
export async function getUserMemberships(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('community_memberships')
    .select(`
      *,
      community:communities!inner(*),
      tier:community_tiers!inner(*)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled'])
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * Create a new community
 */
export async function createCommunity(
  userId: string,
  data: {
    name: string;
    handle: string;
    description: string;
    specialty: string;
    category: string;
    long_description?: string;
    avatar_url?: string;
    banner_url?: string;
  }
) {
  const supabase = await createSupabaseServerClient();

  // Create community
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .insert({
      owner_id: userId,
      ...data,
      status: 'active',
      verified: false,
      subscriber_count: 0,
      total_revenue: 0
    })
    .select()
    .single();

  if (communityError || !community) {
    throw new Error(communityError?.message || 'Failed to create community');
  }

  // Create default free tier
  const { error: tierError } = await supabase
    .from('community_tiers')
    .insert({
      community_id: community.id,
      name: 'Free',
      description: 'Free access to community',
      price_monthly: 0,
      tier_level: 0,
      features: [
        { name: 'Community Access', description: 'Join the community', enabled: true },
        { name: 'General Chat', description: 'Participate in discussions', enabled: true }
      ],
      perks: ['Access to free content', 'Community chat'],
      is_active: true,
      sort_order: 0
    });

  if (tierError) {
    // Rollback community creation
    await supabase.from('communities').delete().eq('id', community.id);
    throw new Error('Failed to create default tier');
  }

  // Create default Stream Chat channels
  try {
    const streamChannels = await createDefaultCommunityChannels(community.id, userId);
    
    // Store channel references in database
    for (const channelInfo of streamChannels) {
      await supabase
        .from('community_channels')
        .insert({
          community_id: community.id,
          stream_channel_id: channelInfo.channelId,
          name: channelInfo.name,
          minimum_tier_level: channelInfo.minimumTierLevel,
          channel_type: 'text',
          is_announcement_only: channelInfo.name === 'announcements',
          is_active: true,
          sort_order: channelInfo.name === 'announcements' ? 0 : 1,
        });
    }
  } catch (error) {
    console.error('Error creating Stream Chat channels:', error);
    // Don't rollback community creation if Stream Chat fails
    // Community can still function without real-time chat
  }

  return community;
}

/**
 * Join a community (free tier)
 */
export async function joinCommunity(
  userId: string,
  communityId: string,
  tierId: string
) {
  const supabase = await createSupabaseServerClient();

  // Check if already a member
  const { data: existing } = await supabase
    .from('community_memberships')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('Already a member of this community');
  }

  // Get tier to verify it's free
  const { data: tier } = await supabase
    .from('community_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (!tier || tier.price_monthly > 0) {
    throw new Error('This tier requires payment');
  }

  // Create membership
  const { data: membership, error } = await supabase
    .from('community_memberships')
    .insert({
      community_id: communityId,
      user_id: userId,
      tier_id: tierId,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      cancel_at_period_end: false,
      total_messages_sent: 0,
      total_content_viewed: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return membership;
}

