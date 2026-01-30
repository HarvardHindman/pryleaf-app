import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { hasAccessToResource } from '@/lib/communityService';
import { makeCacheKey, withCache } from '@/lib/apiCache';

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
    const hasAccess = await hasAccessToResource(user.id, id, 0);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You must be a member to view members' },
        { status: 403 }
      );
    }

    const cacheKey = makeCacheKey(['members', id]);

    const members = await withCache(cacheKey, 30_000, async () => {
      // Fetch members
      const { data: memberships, error } = await supabase
        .from('community_memberships')
        .select(`
        id,
        user_id,
        created_at,
        status,
        last_active_at,
        total_messages_sent,
        total_content_viewed,
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
            .from('user_profiles')
            .select('display_name, username, avatar_url')
            .eq('id', membership.user_id)
            .single();

          const displayName = profile?.display_name || profile?.username || 'Member';

          return {
            id: membership.id,
            user_id: membership.user_id,
            name: displayName,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            tier_name: (membership.tier as any)?.name,
            tier_level: (membership.tier as any)?.tier_level,
            joined_at: membership.created_at,
            status: membership.status,
            last_active_at: membership.last_active_at,
            total_messages_sent: membership.total_messages_sent || 0,
            total_content_viewed: membership.total_content_viewed || 0
          };
        })
      );

      return members;
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}




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

  } catch (error) {

    console.error('Error fetching members:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to fetch members' },

      { status: 500 }

    );

  }

}









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

  } catch (error) {

    console.error('Error fetching members:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to fetch members' },

      { status: 500 }

    );

  }

}









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

  } catch (error) {

    console.error('Error fetching members:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to fetch members' },

      { status: 500 }

    );

  }

}








