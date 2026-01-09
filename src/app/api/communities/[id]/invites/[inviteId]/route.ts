import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /api/communities/[id]/invites/[inviteId]
 * Get single invite details (owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: communityId, inviteId } = await params;
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
      return NextResponse.json({ error: 'Only community owners can view invite details' }, { status: 403 });
    }

    // Fetch invite with usage logs
    const { data: invite, error: inviteError } = await supabase
      .from('community_invites')
      .select(`
        *,
        tier:community_tiers(id, name, tier_level),
        usage_logs:invite_usage_log(
          id,
          user_id,
          used_at
        )
      `)
      .eq('id', inviteId)
      .eq('community_id', communityId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({ invite });
  } catch (error: any) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invite' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]/invites/[inviteId]
 * Update invite (deactivate, update name, etc.) (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: communityId, inviteId } = await params;
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
      return NextResponse.json({ error: 'Only community owners can update invites' }, { status: 403 });
    }

    const body = await request.json();
    const { is_active, name } = body;

    // Update invite
    const { data: invite, error: updateError } = await supabase
      .from('community_invites')
      .update({
        ...(is_active !== undefined && { is_active }),
        ...(name !== undefined && { name })
      })
      .eq('id', inviteId)
      .eq('community_id', communityId)
      .select(`
        *,
        tier:community_tiers(id, name, tier_level)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ invite });
  } catch (error: any) {
    console.error('Error updating invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update invite' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/invites/[inviteId]
 * Delete/deactivate an invite (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: communityId, inviteId } = await params;
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
      return NextResponse.json({ error: 'Only community owners can delete invites' }, { status: 403 });
    }

    // Soft delete by deactivating (preserves history)
    const { error: updateError } = await supabase
      .from('community_invites')
      .update({ is_active: false })
      .eq('id', inviteId)
      .eq('community_id', communityId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invite deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete invite' },
      { status: 500 }
    );
  }
}

