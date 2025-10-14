import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { hasAccessToResource } from '@/lib/communityService';

/**
 * GET /api/communities/[id]/members
 * Get all members of a community (members only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has access to this community
    const hasAccess = await hasAccessToResource(user.id, id, 'post', null);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You must be a member to view members' },
        { status: 403 }
      );
    }

    // Fetch members
    const { data: memberships, error } = await supabase
      .from('community_memberships')
      .select(`
        id,
        user_id,
        created_at,
        tier:community_tiers(name, tier_level)
      `)
      .eq('community_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get user details for each member
    const members = await Promise.all(
      (memberships || []).map(async (membership) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, avatar_url')
          .eq('id', membership.user_id)
          .single();

        return {
          id: membership.id,
          user_id: membership.user_id,
          name: profile?.full_name || profile?.email?.split('@')[0] || 'Member',
          email: profile?.email,
          avatar_url: profile?.avatar_url,
          tier_name: (membership.tier as any)?.name,
          tier_level: (membership.tier as any)?.tier_level,
          joined_at: membership.created_at
        };
      })
    );

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}



