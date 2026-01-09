import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /api/communities/[id]/invites
 * List all invites for a community (owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is community owner
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only community owners can view invites' }, { status: 403 });
    }

    // Fetch all invites with usage stats
    const { data: invites, error: invitesError } = await supabase
      .from('community_invites')
      .select(`
        *,
        tier:community_tiers(id, name, tier_level)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (invitesError) {
      return NextResponse.json({ error: invitesError.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/invites
 * Create a new invite code (owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is community owner
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only community owners can create invites' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      name, 
      tier_id, 
      max_uses, 
      expires_in_days 
    } = body;

    // If tier_id provided, verify it belongs to this community
    if (tier_id) {
      const { data: tier, error: tierError } = await supabase
        .from('community_tiers')
        .select('id')
        .eq('id', tier_id)
        .eq('community_id', communityId)
        .single();

      if (tierError || !tier) {
        return NextResponse.json({ error: 'Invalid tier for this community' }, { status: 400 });
      }
    }

    // Create invite using the database function
    const { data: invite, error: createError } = await supabase
      .rpc('create_community_invite', {
        p_community_id: communityId,
        p_created_by: user.id,
        p_tier_id: tier_id || null,
        p_max_uses: max_uses || null,
        p_expires_in_days: expires_in_days || null,
        p_name: name || null
      });

    if (createError) {
      console.error('Error creating invite:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Fetch the created invite with tier info
    const { data: createdInvite, error: fetchError } = await supabase
      .from('community_invites')
      .select(`
        *,
        tier:community_tiers(id, name, tier_level)
      `)
      .eq('id', invite.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ invite: createdInvite }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invite' },
      { status: 500 }
    );
  }
}

