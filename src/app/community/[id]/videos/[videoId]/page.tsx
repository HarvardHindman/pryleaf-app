import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import VideoPlayerClient from '@/components/video/VideoPlayerClient';

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ id: string; videoId: string }>;
}) {
  const { id, videoId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get video details
  const { data: video, error: videoError } = await supabase
    .from('community_content')
    .select(`
      *,
      video_metadata(*),
      creator:creator_id(id, email),
      community:community_id(id, name, handle, avatar_url, owner_id)
    `)
    .eq('id', videoId)
    .eq('content_type', 'video')
    .single();

  if (videoError || !video) {
    notFound();
  }

  // Check if user is owner
  const isOwner = user?.id === (video.community as any).owner_id;

  // Check if published
  if (!isOwner && !video.is_published) {
    notFound();
  }

  // Check tier access
  let hasAccess = isOwner;
  let userTierLevel = -1;

  if (user && !isOwner) {
    const { data: membership } = await supabase
      .from('community_memberships')
      .select(`
        tier:community_tiers(tier_level, name)
      `)
      .eq('community_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membership?.tier) {
      userTierLevel = (membership.tier as any).tier_level;
      hasAccess = video.minimum_tier_level <= userTierLevel;
    }
  } else if (!user) {
    hasAccess = video.minimum_tier_level === 0; // Only free videos
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Membership Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This video is exclusive to Tier {video.minimum_tier_level}+ members.
          </p>
          <a
            href={`/community/${id}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Membership Options
          </a>
        </div>
      </div>
    );
  }

  // Get related videos
  const { data: relatedVideos } = await supabase
    .from('community_content')
    .select('id, title, thumbnail_url, duration, views, published_at, minimum_tier_level')
    .eq('community_id', id)
    .eq('content_type', 'video')
    .eq('is_published', true)
    .neq('id', videoId)
    .limit(6)
    .order('published_at', { ascending: false });

  return (
    <VideoPlayerClient
      video={video}
      communityId={id}
      communityName={(video.community as any).name}
      communityHandle={(video.community as any).handle}
      isOwner={isOwner}
      userId={user?.id}
      relatedVideos={relatedVideos || []}
      userTierLevel={userTierLevel}
    />
  );
}

