import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserMemberships } from '@/lib/communityService';

/**
 * GET /api/user/memberships
 * Get all memberships for the authenticated user
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

    const memberships = await getUserMemberships(user.id);

    return NextResponse.json({ memberships });
  } catch (error: any) {
    console.error('Error fetching user memberships:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch memberships' },
      { status: 500 }
    );
  }
}

