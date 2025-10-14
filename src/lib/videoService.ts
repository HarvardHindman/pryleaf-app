import { createClient } from '@supabase/supabase-js';

export interface VideoUploadData {
  title: string;
  description: string;
  community_id: string;
  minimum_tier_level: number;
  tags: string[];
  category?: string;
  scheduled_publish_at?: string;
  is_published: boolean;
}

export interface VideoMetadata {
  duration: number;
  file_size: number;
  resolution?: string;
  codec?: string;
  framerate?: number;
  original_filename: string;
}

export interface VideoProcessingStatus {
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  upload_progress: number;
  processing_progress: number;
  error_message?: string;
}

/**
 * Upload video file to Supabase Storage
 */
export async function uploadVideoFile(
  file: File,
  communityId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; url: string }> {
  // Create client-side Supabase client for file upload
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${communityId}/${userId}/${timestamp}_${sanitizedFilename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('community-videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('community-videos')
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Create video content entry in database
 * NOTE: This function should only be called from server-side API routes
 */
export async function createVideoEntry(
  videoData: VideoUploadData,
  storagePath: string,
  storageUrl: string,
  metadata: Partial<VideoMetadata>,
  userId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Create content entry
  const { data: content, error: contentError } = await supabase
    .from('community_content')
    .insert({
      community_id: videoData.community_id,
      creator_id: userId,
      content_type: 'video',
      title: videoData.title,
      description: videoData.description,
      content_url: storageUrl,
      minimum_tier_level: videoData.minimum_tier_level,
      is_published: videoData.is_published,
      published_at: videoData.is_published ? new Date().toISOString() : null,
      scheduled_publish_at: videoData.scheduled_publish_at,
      tags: videoData.tags,
      category: videoData.category,
      duration: metadata.duration,
      file_size: metadata.file_size,
    })
    .select()
    .single();

  if (contentError) {
    throw new Error(`Failed to create video entry: ${contentError.message}`);
  }

  // Create video metadata entry
  const { error: metadataError } = await supabase
    .from('video_metadata')
    .insert({
      content_id: content.id,
      storage_path: storagePath,
      storage_bucket: 'community-videos',
      original_filename: metadata.original_filename,
      resolution: metadata.resolution,
      codec: metadata.codec,
      framerate: metadata.framerate,
    });

  if (metadataError) {
    console.error('Failed to create video metadata:', metadataError);
  }

  // Create processing status entry
  const { error: processingError } = await supabase
    .from('video_processing')
    .insert({
      content_id: content.id,
      upload_status: 'completed',
      upload_progress: 100,
      upload_completed_at: new Date().toISOString(),
      processing_status: 'completed',
      processing_progress: 100,
      processing_completed_at: new Date().toISOString(),
    });

  if (processingError) {
    console.error('Failed to create processing status:', processingError);
  }

  return content;
}

/**
 * Get all videos for a community
 * NOTE: This function should only be called from server-side API routes
 */
export async function getCommunityVideos(
  communityId: string,
  options?: {
    limit?: number;
    offset?: number;
    search?: string;
    tags?: string[];
    sort?: 'newest' | 'oldest' | 'popular';
    published_only?: boolean;
  }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from('community_content')
    .select(`
      *,
      video_metadata(*),
      creator:creator_id(id, email)
    `)
    .eq('community_id', communityId)
    .eq('content_type', 'video');

  // Filter by published status
  if (options?.published_only !== false) {
    query = query.eq('is_published', true);
  }

  // Search filter
  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%`
    );
  }

  // Tags filter
  if (options?.tags && options.tags.length > 0) {
    query = query.contains('tags', options.tags);
  }

  // Sorting
  switch (options?.sort) {
    case 'oldest':
      query = query.order('published_at', { ascending: true });
      break;
    case 'popular':
      query = query.order('views', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('published_at', { ascending: false });
  }

  // Pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data;
}

/**
 * Get single video with full details
 * NOTE: This function should only be called from server-side API routes
 */
export async function getVideo(videoId: string, userId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: video, error } = await supabase
    .from('community_content')
    .select(`
      *,
      video_metadata(*),
      creator:creator_id(id, email),
      community:community_id(id, name, handle, avatar_url)
    `)
    .eq('id', videoId)
    .eq('content_type', 'video')
    .single();

  if (error) {
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  // Check if user has liked the video
  let hasLiked = false;
  if (userId) {
    const { data: likeData } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', videoId)
      .eq('user_id', userId)
      .eq('content_type', 'video')
      .single();

    hasLiked = !!likeData;
  }

  return {
    ...video,
    hasLiked,
  };
}

/**
 * Update video details
 * NOTE: This function should only be called from server-side API routes
 */
export async function updateVideo(
  videoId: string,
  updates: Partial<VideoUploadData>
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('community_content')
    .update({
      title: updates.title,
      description: updates.description,
      minimum_tier_level: updates.minimum_tier_level,
      tags: updates.tags,
      category: updates.category,
      is_published: updates.is_published,
      scheduled_publish_at: updates.scheduled_publish_at,
    })
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update video: ${error.message}`);
  }

  return data;
}

/**
 * Delete video and associated files
 * NOTE: This function should only be called from server-side API routes
 */
export async function deleteVideo(videoId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get video metadata to delete storage file
  const { data: metadata } = await supabase
    .from('video_metadata')
    .select('storage_path, storage_bucket')
    .eq('content_id', videoId)
    .single();

  // Delete from storage
  if (metadata) {
    const { error: storageError } = await supabase.storage
      .from(metadata.storage_bucket)
      .remove([metadata.storage_path]);

    if (storageError) {
      console.error('Failed to delete video file:', storageError);
    }
  }

  // Delete content entry (cascade will handle metadata and processing)
  const { error } = await supabase
    .from('community_content')
    .delete()
    .eq('id', videoId);

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
}

/**
 * Track video view
 * NOTE: This should be called from an API route, not directly from client components
 */
export async function trackVideoView(
  videoId: string,
  userId: string,
  communityId: string,
  watchDuration?: number,
  completionPercentage?: number
) {
  // This function should only be called from API routes
  // Client components should call POST /api/videos/[id]/view instead
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Upsert view record
  const { error } = await supabase
    .from('content_views')
    .upsert({
      content_id: videoId,
      user_id: userId,
      community_id: communityId,
      watch_duration: watchDuration,
      completion_percentage: completionPercentage,
    });

  if (error) {
    console.error('Failed to track view:', error);
    return;
  }

  // Increment view count
  await supabase.rpc('increment_video_views', { video_id: videoId });
}

/**
 * Like/Unlike video
 * NOTE: This should be called from an API route, not directly from client components
 */
export async function toggleVideoLike(videoId: string, userId: string) {
  // This function should only be called from API routes
  // Client components should call POST /api/videos/[id]/like instead
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if already liked
  const { data: existing } = await supabase
    .from('content_likes')
    .select('id')
    .eq('content_id', videoId)
    .eq('user_id', userId)
    .eq('content_type', 'video')
    .single();

  if (existing) {
    // Unlike
    await supabase
      .from('content_likes')
      .delete()
      .eq('id', existing.id);

    // Decrement like count
    await supabase
      .from('community_content')
      .update({ likes: supabase.rpc('decrement', { column: 'likes' }) })
      .eq('id', videoId);

    return { liked: false };
  } else {
    // Like
    await supabase
      .from('content_likes')
      .insert({
        content_id: videoId,
        user_id: userId,
        content_type: 'video',
      });

    // Increment like count
    await supabase
      .from('community_content')
      .update({ likes: supabase.rpc('increment', { column: 'likes' }) })
      .eq('id', videoId);

    return { liked: true };
  }
}

/**
 * Upload custom thumbnail
 */
export async function uploadThumbnail(
  file: File,
  videoId: string,
  communityId: string
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const filePath = `${communityId}/thumbnails/${videoId}_${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from('community-videos')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Thumbnail upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('community-videos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Get video metadata from file (client-side)
 */
export async function extractVideoMetadata(file: File): Promise<Partial<VideoMetadata>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration),
        file_size: file.size,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        original_filename: file.name,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to extract video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

