import { createSupabaseServerClient } from './supabaseServer';

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
  requiredTierLevel: number = 0
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // Ensure we never compare against non-numeric values
  const normalizedTierLevel = Number.isFinite(requiredTierLevel)
    ? requiredTierLevel
    : 0;

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
  const userTierLevel = (membership.tier as any).tier_level ?? -1;
  return userTierLevel >= normalizedTierLevel;
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

  // Chat channels will be created when new chat system is implemented
  // For now, communities are created without chat channels

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

// ============================================================================
// INVITE SYSTEM FUNCTIONS
// ============================================================================

export interface CommunityInvite {
  id: string;
  community_id: string;
  created_by: string;
  code: string;
  tier_id?: string;
  max_uses?: number;
  use_count: number;
  expires_at?: string;
  is_active: boolean;
  name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new invite code for a community
 */
export async function createCommunityInvite(
  communityId: string,
  createdBy: string,
  options?: {
    tierId?: string;
    maxUses?: number;
    expiresInDays?: number;
    name?: string;
  }
) {
  const supabase = await createSupabaseServerClient();

  // Verify user is community owner
  const isOwner = await isCommunityOwner(createdBy, communityId);
  if (!isOwner) {
    throw new Error('Only community owners can create invites');
  }

  // Use database function to create invite with auto-generated code
  const { data: invite, error } = await supabase
    .rpc('create_community_invite', {
      p_community_id: communityId,
      p_created_by: createdBy,
      p_tier_id: options?.tierId || null,
      p_max_uses: options?.maxUses || null,
      p_expires_in_days: options?.expiresInDays || null,
      p_name: options?.name || null
    });

  if (error) {
    throw new Error(error.message);
  }

  return invite;
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string): Promise<{
  isValid: boolean;
  inviteId?: string;
  communityId?: string;
  tierId?: string;
  errorMessage?: string;
}> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .rpc('validate_invite', { p_code: code })
    .single();

  if (error) {
    return { isValid: false, errorMessage: 'Failed to validate invite' };
  }

  return {
    isValid: data.is_valid,
    inviteId: data.invite_id,
    communityId: data.community_id,
    tierId: data.tier_id,
    errorMessage: data.error_message
  };
}

/**
 * Join a community via invite code
 */
export async function joinCommunityViaInvite(
  userId: string,
  inviteCode: string
) {
  const supabase = await createSupabaseServerClient();

  // Validate the invite
  const validation = await validateInviteCode(inviteCode);
  
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Invalid invite code');
  }

  const { inviteId, communityId, tierId } = validation;

  if (!communityId || !inviteId) {
    throw new Error('Invalid invite data');
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('community_memberships')
    .select('id, status')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single();

  if (existing && existing.status === 'active') {
    throw new Error('You are already a member of this community');
  }

  // Get the tier to use (from invite or default free tier)
  let finalTierId = tierId;
  if (!finalTierId) {
    const { data: freeTier } = await supabase
      .from('community_tiers')
      .select('id')
      .eq('community_id', communityId)
      .eq('tier_level', 0)
      .single();

    if (!freeTier) {
      throw new Error('No free tier available');
    }
    finalTierId = freeTier.id;
  }

  // Verify tier is free (paid tiers require Stripe integration)
  const { data: tier } = await supabase
    .from('community_tiers')
    .select('price_monthly, tier_level')
    .eq('id', finalTierId)
    .single();

  if (tier && tier.price_monthly > 0) {
    throw new Error('This invite grants access to a paid tier. Payment integration coming soon.');
  }

  // Create membership
  const { data: membership, error: membershipError } = await supabase
    .from('community_memberships')
    .insert({
      community_id: communityId,
      user_id: userId,
      tier_id: finalTierId,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      cancel_at_period_end: false,
      total_messages_sent: 0,
      total_content_viewed: 0
    })
    .select()
    .single();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  // Log invite usage
  await supabase
    .from('invite_usage_log')
    .insert({
      invite_id: inviteId,
      user_id: userId,
      membership_id: membership.id
    });

  // Increment invite use count
  await supabase.rpc('increment_invite_use_count', { p_invite_id: inviteId });

  return {
    membership,
    communityId,
    tierLevel: tier?.tier_level || 0
  };
}

/**
 * Get all invites for a community
 */
export async function getCommunityInvites(communityId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  // Verify user is owner
  const isOwner = await isCommunityOwner(userId, communityId);
  if (!isOwner) {
    throw new Error('Only community owners can view invites');
  }

  const { data: invites, error } = await supabase
    .from('community_invites')
    .select(`
      *,
      tier:community_tiers(id, name, tier_level)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return invites || [];
}

/**
 * Deactivate an invite
 */
export async function deactivateInvite(
  inviteId: string,
  communityId: string,
  userId: string
) {
  const supabase = await createSupabaseServerClient();

  // Verify user is owner
  const isOwner = await isCommunityOwner(userId, communityId);
  if (!isOwner) {
    throw new Error('Only community owners can deactivate invites');
  }

  const { error } = await supabase
    .from('community_invites')
    .update({ is_active: false })
    .eq('id', inviteId)
    .eq('community_id', communityId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

