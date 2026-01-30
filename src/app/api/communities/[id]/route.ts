import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getCommunityDetails, isCommunityOwner } from '@/lib/communityService';

/**
 * GET /api/communities/[id]
 * Get community details with tiers and membership status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { community, tiers, membershipStatus } = await getCommunityDetails(
      id,
      user?.id
    );

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      community,
      tiers,
      membershipStatus
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch community' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]
 * Update community (owner only)
 */
export async function PATCH(
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

    // Check if user is owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Only community owner can update' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      long_description,
      avatar_url,
      banner_url,
      accent_color,
      specialty,
      category,
      settings
    } = body;

    // Update community
    const { data: community, error } = await supabase
      .from('communities')
      .update({
        ...(name && { name }),
        ...(description && { description }),
        ...(long_description !== undefined && { long_description }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(banner_url !== undefined && { banner_url }),
        ...(accent_color !== undefined && { accent_color }),
        ...(specialty && { specialty }),
        ...(category && { category }),
        ...(settings && { settings })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update community' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]
 * Delete community (owner only)
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

    // Check if user is owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Only community owner can delete' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to 'archived'
    const { error } = await supabase
      .from('communities')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Community archived successfully'
    });
  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete community' },
      { status: 500 }
    );
  }
}

