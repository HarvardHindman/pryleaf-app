import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/profile/avatar
 * Upload user avatar
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

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${user.id}_${timestamp}.${ext}`;
    const filePath = `avatars/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-content')
      .getPublicUrl(uploadData.path);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile with new avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      avatar_url: urlData.publicUrl,
      message: 'Avatar uploaded successfully'
    });
  } catch (error: any) {
    console.error('Avatar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current avatar URL
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    // Update profile to remove avatar
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove avatar' },
        { status: 500 }
      );
    }

    // Optionally delete the file from storage
    if (profile?.avatar_url) {
      const path = profile.avatar_url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('user-content')
        .remove([path]);
    }

    return NextResponse.json({
      message: 'Avatar removed successfully'
    });
  } catch (error: any) {
    console.error('Avatar delete API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

