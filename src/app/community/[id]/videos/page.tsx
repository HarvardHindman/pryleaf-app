import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { notFound, redirect } from 'next/navigation';
import VideoLibraryClient from '@/components/video/VideoLibraryClient';

export default async function CommunityVideosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get community details
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();

  if (communityError || !community) {
    notFound();
  }

  // Check if user is owner
  const isOwner = user?.id === community.owner_id;

  // Get user's membership and tier level
  let userTierLevel = -1; // Not a member
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
    }
  } else if (isOwner) {
    userTierLevel = 999; // Owner has access to everything
  }

  // Get community tiers for filtering
  const { data: tiers } = await supabase
    .from('community_tiers')
    .select('id, name, tier_level')
    .eq('community_id', id)
    .order('tier_level', { ascending: true });

  return (
    <VideoLibraryClient
      communityId={id}
      communityName={community.name}
      communityHandle={community.handle}
      isOwner={isOwner}
      userTierLevel={userTierLevel}
      tiers={tiers || []}
    />
  );
}

