import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/communities/[id]/banner
 * Upload community banner
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the community
    const { data: community } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .single();

    if (!community || community.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only community owners can upload banners' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('banner') as File;

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

    // Validate file size (max 10MB for banners)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${communityId}_banner_${timestamp}.${ext}`;
    const filePath = `communities/${communityId}/banner/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('community-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Banner upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload banner' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('community-videos')
      .getPublicUrl(uploadData.path);

    // Update community with new banner URL
    const { error: updateError } = await supabase
      .from('communities')
      .update({ banner_url: urlData.publicUrl })
      .eq('id', communityId);

    if (updateError) {
      console.error('Community update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update community with new banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      banner_url: urlData.publicUrl,
      message: 'Banner uploaded successfully'
    });
  } catch (error) {
    console.error('Banner API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

