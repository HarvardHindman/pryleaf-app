import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserMemberships } from '@/lib/communityService';
import { getUserCommunityChannels } from '@/lib/streamChatService';

/**
 * GET /api/user/channels
 * Get all community channels the user has access to
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's memberships
    const memberships = await getUserMemberships(user.id);

    // Get Stream Chat channels
    const channelsByCommunity = await getUserCommunityChannels(user.id);

    // Combine with community data
    const communitiesWithChannels = memberships.map((membership: any) => {
      const channels = channelsByCommunity[membership.community_id] || [];
      
      return {
        community: membership.community,
        tier: membership.tier,
        membership: {
          status: membership.status,
          tier_level: membership.tier.tier_level,
        },
        channels,
      };
    });

    return NextResponse.json({
      communities: communitiesWithChannels
    });
  } catch (error: any) {
    console.error('Error fetching user channels:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

