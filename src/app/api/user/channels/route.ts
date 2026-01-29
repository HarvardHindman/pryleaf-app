import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserMemberships } from '@/lib/communityService';

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

    // For now, return communities without chat channels
    // Chat channels will be added when new chat system is implemented
    const communitiesWithChannels = memberships.map((membership: any) => {
      return {
        community: membership.community,
        tier: membership.tier,
        membership: {
          status: membership.status,
          tier_level: membership.tier.tier_level,
        },
        channels: [], // Empty until new chat system is implemented
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



