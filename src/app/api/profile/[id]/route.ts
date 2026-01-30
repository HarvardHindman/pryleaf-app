import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /api/profile/[id]
 * Get public profile by user ID or username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // Try to determine if id is a UUID or username
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
      .from('user_profiles')
      .select('*');

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('username', id);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if profile is public or if it's the user's own profile
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.id;

    if (!profile.is_public && !isOwnProfile) {
      return NextResponse.json(
        { error: 'This profile is private' },
        { status: 403 }
      );
    }

    // Get user's auth data if it's their own profile
    let userData = null;
    if (isOwnProfile && user) {
      const { data: authUser } = await supabase.auth.getUser();
      userData = {
        email: authUser.user?.email,
        created_at: authUser.user?.created_at,
      };
    }

    // Get community stats
    const { count: ownedCount } = await supabase
      .from('communities')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id);

    const { count: memberCount } = await supabase
      .from('community_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'active');

    return NextResponse.json({
      profile: {
        ...profile,
        total_communities_owned: ownedCount || 0,
        total_communities_joined: memberCount || 0,
      },
      user: userData,
      isOwnProfile,
    });
  } catch (error) {
    console.error('Profile fetch API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

