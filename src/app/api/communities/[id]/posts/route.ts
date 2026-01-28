import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { hasAccessToResource, isCommunityOwner } from '@/lib/communityService';

/**
 * GET /api/communities/[id]/posts
 * Get all posts for a community (members only)
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
    const isOwner = await isCommunityOwner(user.id, id);

    if (!hasAccess && !isOwner) {
      return NextResponse.json(
        { error: 'You must be a member to view posts' },
        { status: 403 }
      );
    }

    // Fetch posts (without tier join since community_content uses minimum_tier_level, not tier_id)
    let query = supabase
      .from('community_content')
      .select('*')
      .eq('community_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!isOwner) {
      query = query.eq('is_published', true);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/posts
 * Create a new post (owner only)
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
        { error: 'Only the community owner can create posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      content_type = 'article',
      content_url,
      thumbnail_url,
      minimum_tier_level = 0,
      is_published = true,
      tags = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Post must have a title' },
        { status: 400 }
      );
    }

    // Create post using correct schema fields
    const { data: post, error } = await supabase
      .from('community_content')
      .insert({
        community_id: id,
        creator_id: user.id,
        content_type, // 'article' for posts, 'video' for videos
        title,
        description,
        content_url: content_url || '', // Required field in schema
        thumbnail_url,
        minimum_tier_level,
        is_published,
        published_at: is_published ? new Date().toISOString() : null,
        tags
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}





      return NextResponse.json(

        { error: 'Unauthorized' },

        { status: 401 }

      );

    }



    // Check if user is owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only the community owner can create posts' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_type = 'article',

      content_url,

      thumbnail_url,

      minimum_tier_level = 0,

      is_published = true,

      tags = []

    } = body;



    if (!title) {

      return NextResponse.json(

        { error: 'Post must have a title' },

        { status: 400 }

      );

    }



    // Create post using correct schema fields

    const { data: post, error } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type, // 'article' for posts, 'video' for videos

        title,

        description,

        content_url: content_url || '', // Required field in schema

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        tags

      })

      .select()

      .single();



    if (error) {

      throw error;

    }



    return NextResponse.json({ post });

  } catch (error: any) {

    console.error('Error creating post:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create post' },

      { status: 500 }

    );

  }

}










      return NextResponse.json(

        { error: 'Unauthorized' },

        { status: 401 }

      );

    }



    // Check if user is owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only the community owner can create posts' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_type = 'article',

      content_url,

      thumbnail_url,

      minimum_tier_level = 0,

      is_published = true,

      tags = []

    } = body;



    if (!title) {

      return NextResponse.json(

        { error: 'Post must have a title' },

        { status: 400 }

      );

    }



    // Create post using correct schema fields

    const { data: post, error } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type, // 'article' for posts, 'video' for videos

        title,

        description,

        content_url: content_url || '', // Required field in schema

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        tags

      })

      .select()

      .single();



    if (error) {

      throw error;

    }



    return NextResponse.json({ post });

  } catch (error: any) {

    console.error('Error creating post:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create post' },

      { status: 500 }

    );

  }

}










      return NextResponse.json(

        { error: 'Unauthorized' },

        { status: 401 }

      );

    }



    // Check if user is owner

    const isOwner = await isCommunityOwner(user.id, id);

    if (!isOwner) {

      return NextResponse.json(

        { error: 'Only the community owner can create posts' },

        { status: 403 }

      );

    }



    const body = await request.json();

    const {

      title,

      description,

      content_type = 'article',

      content_url,

      thumbnail_url,

      minimum_tier_level = 0,

      is_published = true,

      tags = []

    } = body;



    if (!title) {

      return NextResponse.json(

        { error: 'Post must have a title' },

        { status: 400 }

      );

    }



    // Create post using correct schema fields

    const { data: post, error } = await supabase

      .from('community_content')

      .insert({

        community_id: id,

        creator_id: user.id,

        content_type, // 'article' for posts, 'video' for videos

        title,

        description,

        content_url: content_url || '', // Required field in schema

        thumbnail_url,

        minimum_tier_level,

        is_published,

        published_at: is_published ? new Date().toISOString() : null,

        tags

      })

      .select()

      .single();



    if (error) {

      throw error;

    }



    return NextResponse.json({ post });

  } catch (error: any) {

    console.error('Error creating post:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to create post' },

      { status: 500 }

    );

  }

}








