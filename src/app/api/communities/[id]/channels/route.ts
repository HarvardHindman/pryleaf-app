import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isCommunityOwner } from '@/lib/communityService';

/**
 * GET /api/communities/[id]/channels
 * Get all chat channels for a community
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

    // Fetch channels
    const { data: channels, error } = await supabase
      .from('community_channels')
      .select('*')
      .eq('community_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ channels: channels || [] });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/channels
 * Create a new chat channel (owner only)
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

    // Check if user is owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the community owner can create channels' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type = 'text',
      required_tier_level = 0,
      is_public = true,
      settings = {}
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    // Create channel in database
    const { data: channel, error } = await supabase
      .from('community_channels')
      .insert({
        community_id: id,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        type,
        required_tier_level,
        is_public,
        settings
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Chat channels will be created when new chat system is implemented

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create channel' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]/channels
 * Update a channel (owner only)
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
        { error: 'Only the community owner can update channels' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id: channelId, ...updateData } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    // Update channel
    const { data: channel, error } = await supabase
      .from('community_channels')
      .update(updateData)
      .eq('id', channelId)
      .eq('community_id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update channel' },
      { status: 500 }
    );
  }
}



