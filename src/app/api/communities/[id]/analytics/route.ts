import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isCommunityOwner } from '@/lib/communityService';

/**
 * GET /api/communities/[id]/analytics
 * Get analytics for a community (owner only)
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
        { error: 'Only the community owner can view analytics' },
        { status: 403 }
      );
    }

    // Get total members
    const { count: totalMembers } = await supabase
      .from('community_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', id)
      .eq('status', 'active');

    // Get total posts
    const { count: totalPosts } = await supabase
      .from('community_content')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', id)
      .eq('type', 'post');

    // Get total revenue (sum of all memberships)
    const { data: memberships } = await supabase
      .from('community_memberships')
      .select('tier:community_tiers(price_monthly)')
      .eq('community_id', id)
      .eq('status', 'active');

    const monthlyRevenue = memberships?.reduce((sum, membership) => {
      return sum + ((membership.tier as any)?.price_monthly || 0);
    }, 0) || 0;

    // Get view counts from content
    const { data: content } = await supabase
      .from('community_content')
      .select('view_count')
      .eq('community_id', id);

    const totalViews = content?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;

    // Calculate engagement rate (simple version)
    const engagementRate = totalPosts > 0 && totalMembers > 0 
      ? Math.min(100, Math.round((totalViews / (totalPosts * (totalMembers || 1))) * 100))
      : 0;

    // Get new members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newMembersThisMonth } = await supabase
      .from('community_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', id)
      .gte('created_at', startOfMonth.toISOString());

    // Get member breakdown by tier
    const { data: tierBreakdown } = await supabase
      .from('community_memberships')
      .select(`
        tier:community_tiers(name, tier_level)
      `)
      .eq('community_id', id)
      .eq('status', 'active');

    // Count members by tier
    const membersByTier: any = {
      free: 0,
      premium: 0,
      elite: 0
    };

    if (tierBreakdown) {
      for (const membership of tierBreakdown) {
        const tierLevel = (membership.tier as any)?.tier_level || 0;
        const tierName = (membership.tier as any)?.name?.toLowerCase() || 'free';
        
        if (tierLevel === 0 || tierName.includes('free')) {
          membersByTier.free++;
        } else if (tierLevel === 1 || tierName.includes('standard') || tierName.includes('basic')) {
          membersByTier.premium++;
        } else {
          membersByTier.elite++;
        }
      }
    }

    // Get revenue by tier
    const revenueByTier: any = {
      free: 0,
      premium: 0,
      elite: 0
    };

    if (memberships) {
      for (const membership of memberships) {
        const price = (membership.tier as any)?.price_monthly || 0;
        const tierName = (membership.tier as any)?.name?.toLowerCase() || 'free';
        
        if (price === 0 || tierName.includes('free')) {
          revenueByTier.free += price;
        } else if (tierName.includes('standard') || tierName.includes('basic')) {
          revenueByTier.premium += price;
        } else {
          revenueByTier.elite += price;
        }
      }
    }

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      totalPosts: totalPosts || 0,
      monthlyRevenue,
      totalRevenue: monthlyRevenue, // For now, same as monthly
      totalViews,
      engagementRate,
      newMembersThisMonth: newMembersThisMonth || 0,
      growthRate: totalMembers > 0 && newMembersThisMonth > 0
        ? Math.round((newMembersThisMonth / totalMembers) * 100)
        : 0,
      membersByTier,
      revenueByTier
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}



