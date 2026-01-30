import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { joinCommunity, getUserTierLevel } from '@/lib/communityService';

/**
 * POST /api/communities/[id]/join
 * Join a community (subscribe to a tier)
 */
export async function POST(
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

    const { tierId } = await request.json();

    if (!tierId) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      );
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('community_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('community_id', id)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      );
    }

    // Check if tier is active
    if (!tier.is_active) {
      return NextResponse.json(
        { error: 'This tier is not currently available' },
        { status: 400 }
      );
    }

    // If free tier, create membership directly
    if (tier.price_monthly === 0) {
      const membership = await joinCommunity(user.id, id, tierId);

      // Chat channel access will be granted when new chat system is implemented

      return NextResponse.json({
        membership,
        message: 'Successfully joined community!'
      });
    }

    // For paid tiers, return checkout session (Stripe integration)
    // TODO: Implement Stripe checkout session creation
    // For now, return a placeholder
    return NextResponse.json({
      error: 'Paid subscriptions require Stripe integration',
      tier,
      message: 'Payment integration coming soon'
    }, { status: 501 }); // Not Implemented

    // Future implementation:
    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: tier.stripe_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/community/${params.id}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/community/${params.id}?cancelled=true`,
      metadata: {
        community_id: params.id,
        tier_id: tierId,
        user_id: user.id,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
    */
  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join community' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/join
 * Leave a community (cancel membership)
 */
export async function DELETE(
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

    // Get membership
    const { data: membership, error: membershipError } = await supabase
      .from('community_memberships')
      .select('*, tier:community_tiers(*)')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    // If free tier, delete immediately
    if ((membership.tier as any).price_monthly === 0) {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membership.id);

      if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Chat channel access revocation will be implemented when new chat system is added

    return NextResponse.json({
        message: 'Successfully left community'
      });
    }

    // For paid subscriptions, cancel but keep access until period end
    const { error } = await supabase
      .from('community_memberships')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', membership.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // TODO: Cancel Stripe subscription
    // await stripe.subscriptions.update(membership.stripe_subscription_id, {
    //   cancel_at_period_end: true
    // });

    return NextResponse.json({
      message: 'Subscription cancelled. Access until period end.',
      expiresAt: membership.current_period_end
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave community' },
      { status: 500 }
    );
  }
}

