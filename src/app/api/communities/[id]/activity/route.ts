import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isCommunityOwner } from '@/lib/communityService';

/**
 * GET /api/communities/[id]/activity
 * Get recent activity for a community (owner only)
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

    // Check if user is owner
    const isOwner = await isCommunityOwner(user.id, id);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the community owner can view activity' },
        { status: 403 }
      );
    }

    const activities: any[] = [];
    const now = new Date();

    // Get recent member joins (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentMembers } = await supabase
      .from('community_memberships')
      .select(`
        id,
        created_at,
        user_id,
        tier:community_tiers(name)
      `)
      .eq('community_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Add member join activities
    if (recentMembers) {
      for (const member of recentMembers) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', member.user_id)
          .single();

        const memberName = profile?.full_name || profile?.email?.split('@')[0] || 'A member';
        const tierName = (member.tier as any)?.name || 'Free';
        
        activities.push({
          type: 'member_joined',
          title: memberName,
          description: `joined the ${tierName} tier`,
          timestamp: member.created_at,
          timeAgo: getTimeAgo(member.created_at)
        });
      }
    }

    // Get recent content posts
    const { data: recentContent } = await supabase
      .from('community_content')
      .select('id, title, type, created_at')
      .eq('community_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Add content activities
    if (recentContent) {
      for (const content of recentContent) {
        activities.push({
          type: 'content_posted',
          title: 'New content posted',
          description: content.title || `New ${content.type}`,
          timestamp: content.created_at,
          timeAgo: getTimeAgo(content.created_at)
        });
      }
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      activities: activities.slice(0, 20)
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

