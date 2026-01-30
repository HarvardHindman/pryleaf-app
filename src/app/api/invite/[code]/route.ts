import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /api/invite/[code]
 * Get invite details (public - for showing community info before joining)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createSupabaseServerClient();

    // Validate invite using database function
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_invite', { p_code: code })
      .single();

    if (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate invite' },
        { status: 500 }
      );
    }

    if (!validation.is_valid) {
      return NextResponse.json(
        { 
          valid: false, 
          error: validation.error_message 
        },
        { status: 400 }
      );
    }

    // Fetch community and invite details
    const { data: invite, error: inviteError } = await supabase
      .from('community_invites')
      .select(`
        id,
        code,
        name,
        max_uses,
        use_count,
        expires_at,
        tier:community_tiers(
          id,
          name,
          tier_level,
          price_monthly
        ),
        community:communities(
          id,
          name,
          handle,
          description,
          avatar_url,
          banner_url,
          specialty,
          category,
          subscriber_count,
          verified
        )
      `)
      .eq('code', code)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if user is authenticated and already a member
    let userStatus = null;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && invite.community) {
      const { data: membership } = await supabase
        .from('community_memberships')
        .select('id, status')
        .eq('community_id', (invite.community as any).id)
        .eq('user_id', user.id)
        .single();

      userStatus = {
        isAuthenticated: true,
        isMember: !!membership,
        membershipStatus: membership?.status || null
      };
    } else {
      userStatus = {
        isAuthenticated: !!user,
        isMember: false,
        membershipStatus: null
      };
    }

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        code: invite.code,
        name: invite.name,
        expiresAt: invite.expires_at,
        usesRemaining: invite.max_uses ? invite.max_uses - invite.use_count : null
      },
      community: invite.community,
      tier: invite.tier,
      userStatus
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invite details' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invite/[code]
 * Accept invite and join community
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to accept an invite' }, { status: 401 });
    }

    // Validate invite
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_invite', { p_code: code })
      .single();

    if (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
    }

    if (!validation.is_valid) {
      return NextResponse.json(
        { error: validation.error_message },
        { status: 400 }
      );
    }

    const { invite_id, community_id, tier_id } = validation;

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('community_memberships')
      .select('id, status')
      .eq('community_id', community_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json(
          { error: 'You are already a member of this community' },
          { status: 409 }
        );
      }
      // Could potentially reactivate cancelled membership here
    }

    // Get the tier to use (either from invite or default free tier)
    let finalTierId = tier_id;
    if (!finalTierId) {
      // Get the default free tier for this community
      const { data: freeTier, error: tierError } = await supabase
        .from('community_tiers')
        .select('id, tier_level')
        .eq('community_id', community_id)
        .eq('tier_level', 0)
        .single();

      if (tierError || !freeTier) {
        return NextResponse.json(
          { error: 'No free tier available for this community' },
          { status: 400 }
        );
      }
      finalTierId = freeTier.id;
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('community_tiers')
      .select('*')
      .eq('id', finalTierId)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    // If tier requires payment, don't allow direct join via invite
    if (tier.price_monthly > 0) {
      return NextResponse.json(
        { error: 'This invite grants access to a paid tier. Payment integration coming soon.' },
        { status: 501 }
      );
    }

    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from('community_memberships')
      .insert({
        community_id,
        user_id: user.id,
        tier_id: finalTierId,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        cancel_at_period_end: false,
        total_messages_sent: 0,
        total_content_viewed: 0
      })
      .select(`
        *,
        community:communities(id, name, handle),
        tier:community_tiers(id, name, tier_level)
      `)
      .single();

    if (membershipError) {
      console.error('Membership error:', membershipError);
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    // Log invite usage
    await supabase
      .from('invite_usage_log')
      .insert({
        invite_id,
        user_id: user.id,
        membership_id: membership.id
      });

    // Increment invite use count
    await supabase.rpc('increment_invite_use_count', { p_invite_id: invite_id });

    // Chat channel access will be granted when new chat system is implemented

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the community!',
      membership: {
        id: membership.id,
        community: membership.community,
        tier: membership.tier
      }
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invite' },
      { status: 500 }
    );
  }
}

