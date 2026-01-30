import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      
      // If profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          profile: newProfile,
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
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
    const {
      username,
      display_name,
      bio,
      avatar_url,
      banner_url,
      website_url,
      twitter_handle,
      youtube_url,
      linkedin_url,
      location,
      timezone,
      is_public,
      show_email,
      email_notifications,
      push_notifications,
    } = body;

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 30) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 30 characters' },
          { status: 400 }
        );
      }

      if (!/^[a-z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain lowercase letters, numbers, and underscores' },
          { status: 400 }
        );
      }

      // Check if username is taken
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate display_name length
    if (display_name && display_name.length > 50) {
      return NextResponse.json(
        { error: 'Display name must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;
    if (website_url !== undefined) updates.website_url = website_url;
    if (twitter_handle !== undefined) updates.twitter_handle = twitter_handle;
    if (youtube_url !== undefined) updates.youtube_url = youtube_url;
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
    if (location !== undefined) updates.location = location;
    if (timezone !== undefined) updates.timezone = timezone;
    if (is_public !== undefined) updates.is_public = is_public;
    if (show_email !== undefined) updates.show_email = show_email;
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;
    if (push_notifications !== undefined) updates.push_notifications = push_notifications;

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

