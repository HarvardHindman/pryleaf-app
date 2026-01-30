import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/profile/onboarding/dismiss
 * Update the timestamp when user dismissed the onboarding prompt
 * This allows for persistent reminders (show again after 7 days)
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user profile with dismissal timestamp
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        onboarding_dismissed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating dismissal timestamp:', updateError);
      return NextResponse.json(
        { error: 'Failed to dismiss onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding dismissed',
      dismissed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in onboarding dismiss:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
