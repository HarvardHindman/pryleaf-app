import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isCommunityOwner, hasAccessToResource } from '@/lib/communityService';
import { getCommunityVideos } from '@/lib/videoService';

/**
 * GET /api/communities/[id]/videos
 * Get all videos for a community
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user has access to this community
    const isOwner = user ? await isCommunityOwner(user.id, id) : false;
    const hasAccess = user ? await hasAccessToResource(user.id, id, 0) : false;

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as 'newest' | 'oldest' | 'popular') || 'newest';
    const tags = searchParams.get('tags')?.split(',') || undefined;

    // Owners can see drafts, members can only see published
    const publishedOnly = !isOwner;

    const videos = await getCommunityVideos(id, {
      limit,
      offset,
      search,
      tags,
      sort,
      published_only: publishedOnly,
    });

    // Filter videos by tier access for non-owners
    let accessibleVideos = videos;
    if (!isOwner && user) {
      // Get user's tier level
      const { data: membership } = await supabase
        .from('community_memberships')
        .select('tier:community_tiers(tier_level)')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const userTierLevel = (membership?.tier as any)?.tier_level ?? -1;

      accessibleVideos = videos.filter(
        (video) => video.minimum_tier_level <= userTierLevel
      );
    } else if (!isOwner) {
      // Non-members can only see tier 0 (free) videos
      accessibleVideos = videos.filter((video) => video.minimum_tier_level === 0);
    }

    return NextResponse.json({
      videos: accessibleVideos,
      hasMore: videos.length === limit,
      total: accessibleVideos.length,
    });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/videos
 * Create a new video entry (after upload to storage)
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

    // Check if user is community owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only community owners can upload videos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      content_url,
      storage_path,
      thumbnail_url,
      minimum_tier_level = 0,
      tags = [],
      category,
      duration,
      file_size,
      resolution,
      original_filename,
      is_published = false,
      scheduled_publish_at,
    } = body;

    // Validate required fields
    if (!title || !content_url || !storage_path) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content_url, storage_path' },
        { status: 400 }
      );
    }

    // Create video content entry
    const { data: video, error: videoError } = await supabase
      .from('community_content')
      .insert({
        community_id: id,
        creator_id: user.id,
        content_type: 'video',
        title,
        description,
        content_url,
        thumbnail_url,
        minimum_tier_level,
        is_published,
        published_at: is_published ? new Date().toISOString() : null,
        scheduled_publish_at,
        tags,
        category,
        duration,
        file_size,
      })
      .select()
      .single();

    if (videoError) {
      throw new Error(`Failed to create video: ${videoError.message}`);
    }

    // Create video metadata
    await supabase.from('video_metadata').insert({
      content_id: video.id,
      storage_path,
      storage_bucket: 'community-videos',
      original_filename,
      resolution,
    });

    // Create processing status
    await supabase.from('video_processing').insert({
      content_id: video.id,
      upload_status: 'completed',
      upload_progress: 100,
      upload_completed_at: new Date().toISOString(),
      processing_status: 'completed',
      processing_progress: 100,
      processing_completed_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { video },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create video' },
      { status: 500 }
    );
  }
}




    // Check if user is community owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only community owners can upload videos' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_url,

      storage_path,

      thumbnail_url,

      minimum_tier_level = 0,

      tags = [],

      category,

      duration,

      file_size,

      resolution,

      original_filename,

      is_published = false,

      scheduled_publish_at,

    } = body;



    // Validate required fields

    if (!title || !content_url || !storage_path) {

      return NextResponse.json(

        { error: 'Missing required fields: title, content_url, storage_path' },

        { status: 400 }

      );

    }



    // Create video content entry

    const { data: video, error: videoError } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type: 'video',

        title,

        description,

        content_url,

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        scheduled_publish_at,

        tags,

        category,

        duration,

        file_size,

      })

      .select()

      .single();



    if (videoError) {

      throw new Error(`Failed to create video: ${videoError.message}`);

    }



    // Create video metadata

    await supabase.from('video_metadata').insert({

      content_id: video.id,

      storage_path,

      storage_bucket: 'community-videos',

      original_filename,

      resolution,

    });



    // Create processing status

    await supabase.from('video_processing').insert({

      content_id: video.id,

      upload_status: 'completed',

      upload_progress: 100,

      upload_completed_at: new Date().toISOString(),

      processing_status: 'completed',

      processing_progress: 100,

      processing_completed_at: new Date().toISOString(),

    });



    return NextResponse.json(

      { video },

      { status: 201 }

    );

  } catch (error: any) {

    console.error('Error creating video:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create video' },

      { status: 500 }

    );

  }

}







    // Check if user is community owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only community owners can upload videos' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_url,

      storage_path,

      thumbnail_url,

      minimum_tier_level = 0,

      tags = [],

      category,

      duration,

      file_size,

      resolution,

      original_filename,

      is_published = false,

      scheduled_publish_at,

    } = body;



    // Validate required fields

    if (!title || !content_url || !storage_path) {

      return NextResponse.json(

        { error: 'Missing required fields: title, content_url, storage_path' },

        { status: 400 }

      );

    }



    // Create video content entry

    const { data: video, error: videoError } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type: 'video',

        title,

        description,

        content_url,

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        scheduled_publish_at,

        tags,

        category,

        duration,

        file_size,

      })

      .select()

      .single();



    if (videoError) {

      throw new Error(`Failed to create video: ${videoError.message}`);

    }



    // Create video metadata

    await supabase.from('video_metadata').insert({

      content_id: video.id,

      storage_path,

      storage_bucket: 'community-videos',

      original_filename,

      resolution,

    });



    // Create processing status

    await supabase.from('video_processing').insert({

      content_id: video.id,

      upload_status: 'completed',

      upload_progress: 100,

      upload_completed_at: new Date().toISOString(),

      processing_status: 'completed',

      processing_progress: 100,

      processing_completed_at: new Date().toISOString(),

    });



    return NextResponse.json(

      { video },

      { status: 201 }

    );

  } catch (error: any) {

    console.error('Error creating video:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create video' },

      { status: 500 }

    );

  }

}







    // Check if user is community owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only community owners can upload videos' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_url,

      storage_path,

      thumbnail_url,

      minimum_tier_level = 0,

      tags = [],

      category,

      duration,

      file_size,

      resolution,

      original_filename,

      is_published = false,

      scheduled_publish_at,

    } = body;



    // Validate required fields

    if (!title || !content_url || !storage_path) {

      return NextResponse.json(

        { error: 'Missing required fields: title, content_url, storage_path' },

        { status: 400 }

      );

    }



    // Create video content entry

    const { data: video, error: videoError } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type: 'video',

        title,

        description,

        content_url,

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        scheduled_publish_at,

        tags,

        category,

        duration,

        file_size,

      })

      .select()

      .single();



    if (videoError) {

      throw new Error(`Failed to create video: ${videoError.message}`);

    }



    // Create video metadata

    await supabase.from('video_metadata').insert({

      content_id: video.id,

      storage_path,

      storage_bucket: 'community-videos',

      original_filename,

      resolution,

    });



    // Create processing status

    await supabase.from('video_processing').insert({

      content_id: video.id,

      upload_status: 'completed',

      upload_progress: 100,

      upload_completed_at: new Date().toISOString(),

      processing_status: 'completed',

      processing_progress: 100,

      processing_completed_at: new Date().toISOString(),

    });



    return NextResponse.json(

      { video },

      { status: 201 }

    );

  } catch (error: any) {

    console.error('Error creating video:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create video' },

      { status: 500 }

    );

  }

}




