import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isCommunityOwner } from '@/lib/communityService';
import { getVideo, updateVideo, deleteVideo } from '@/lib/videoService';

/**
 * GET /api/communities/[id]/videos/[videoId]
 * Get single video details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id, videoId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const video = await getVideo(videoId, user?.id);

    // Check access
    const isOwner = user ? await isCommunityOwner(user.id, id) : false;
    
    if (!isOwner && !video.is_published) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check tier access
    if (!isOwner && user) {
      const { data: membership } = await supabase
        .from('community_memberships')
        .select('tier:community_tiers(tier_level)')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const userTierLevel = (membership?.tier as any)?.tier_level ?? -1;

      if (video.minimum_tier_level > userTierLevel) {
        return NextResponse.json(
          { error: 'Insufficient tier level', requiredTier: video.minimum_tier_level },
          { status: 403 }
        );
      }
    } else if (!isOwner && video.minimum_tier_level > 0) {
      return NextResponse.json(
        { error: 'This video requires membership', requiredTier: video.minimum_tier_level },
        { status: 403 }
      );
    }

    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]/videos/[videoId]
 * Update video details (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id, videoId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is community owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only community owners can update videos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const video = await updateVideo(videoId, body);

    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/videos/[videoId]
 * Delete video (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id, videoId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is community owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only community owners can delete videos' },
        { status: 403 }
      );
    }

    await deleteVideo(videoId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}

