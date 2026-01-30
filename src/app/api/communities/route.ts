import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getCommunities, createCommunity } from '@/lib/communityService';

/**
 * GET /api/communities
 * List all communities with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const verified = searchParams.get('verified') === 'true' ? true : undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const { data: communities, error } = await getCommunities({
      category,
      verified,
      search,
      limit,
      offset
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ communities: communities || [] });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities
 * Create a new community (authenticated)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, handle, description, specialty, category, long_description, avatar_url, banner_url } = body;

    // Validate required fields
    if (!name || !handle || !description || !specialty || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate handle format (alphanumeric, lowercase, no spaces)
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(handle)) {
      return NextResponse.json(
        { error: 'Handle must be lowercase alphanumeric (can include - and _)' },
        { status: 400 }
      );
    }

    // Check if handle is already taken
    const { data: existing } = await supabase
      .from('communities')
      .select('id')
      .eq('handle', handle)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Handle already taken' },
        { status: 409 }
      );
    }

    const community = await createCommunity(user.id, {
      name,
      handle,
      description,
      specialty,
      category,
      long_description,
      avatar_url,
      banner_url
    });

    return NextResponse.json(
      { community },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create community' },
      { status: 500 }
    );
  }
}



