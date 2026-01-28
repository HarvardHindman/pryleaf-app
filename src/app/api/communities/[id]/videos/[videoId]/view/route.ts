import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/communities/[id]/videos/[videoId]/view
 * Track video view
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id, videoId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { watchDuration, completionPercentage } = body;

    // Check if view already exists
    const { data: existingView } = await supabase
      .from('content_views')
      .select('id, watch_duration, completion_percentage')
      .eq('content_id', videoId)
      .eq('user_id', user.id)
      .single();

    if (existingView) {
      // Update existing view metadata for this user
      await supabase
        .from('content_views')
        .update({
          watch_duration: watchDuration ?? existingView.watch_duration ?? 0,
          completion_percentage: completionPercentage ?? existingView.completion_percentage ?? 0,
        })
        .eq('id', existingView.id);
    } else {
      // Create new unique view record
      await supabase
        .from('content_views')
        .insert({
          content_id: videoId,
          user_id: user.id,
          community_id: id,
          watch_duration: watchDuration || 0,
          completion_percentage: completionPercentage || 0,
        });

      // Increment unique view count
      await supabase
        .from('community_content')
        .update({
          unique_views: sql`unique_views + 1`,
        })
        .eq('id', videoId);
    }

    // Always increment total view count
    await supabase
      .from('community_content')
      .update({
        views: sql`views + 1`,
      })
      .eq('id', videoId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track view' },
      { status: 500 }
    );
  }
}



        .eq('id', existingView.id);

    } else {

      // Create new view record

      await supabase

        .from('content_views')

        .insert({

          content_id: videoId,

          user_id: user.id,

          community_id: id,

          watch_duration: watchDuration || 0,

          completion_percentage: completionPercentage || 0,

          view_count: 1,

        });



      // Increment unique view count

      await supabase

        .from('community_content')

        .update({

          unique_views: supabase.sql`unique_views + 1`,

        })

        .eq('id', videoId);

    }



    // Always increment total view count

    await supabase

      .from('community_content')

      .update({

        views: supabase.sql`views + 1`,

      })

      .eq('id', videoId);



    return NextResponse.json({ success: true });

  } catch (error: any) {

    console.error('Error tracking view:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to track view' },

      { status: 500 }

    );

  }

}






        .eq('id', existingView.id);

    } else {

      // Create new view record

      await supabase

        .from('content_views')

        .insert({

          content_id: videoId,

          user_id: user.id,

          community_id: id,

          watch_duration: watchDuration || 0,

          completion_percentage: completionPercentage || 0,

          view_count: 1,

        });



      // Increment unique view count

      await supabase

        .from('community_content')

        .update({

          unique_views: supabase.sql`unique_views + 1`,

        })

        .eq('id', videoId);

    }



    // Always increment total view count

    await supabase

      .from('community_content')

      .update({

        views: supabase.sql`views + 1`,

      })

      .eq('id', videoId);



    return NextResponse.json({ success: true });

  } catch (error: any) {

    console.error('Error tracking view:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to track view' },

      { status: 500 }

    );

  }

}






        .eq('id', existingView.id);

    } else {

      // Create new view record

      await supabase

        .from('content_views')

        .insert({

          content_id: videoId,

          user_id: user.id,

          community_id: id,

          watch_duration: watchDuration || 0,

          completion_percentage: completionPercentage || 0,

          view_count: 1,

        });



      // Increment unique view count

      await supabase

        .from('community_content')

        .update({

          unique_views: supabase.sql`unique_views + 1`,

        })

        .eq('id', videoId);

    }



    // Always increment total view count

    await supabase

      .from('community_content')

      .update({

        views: supabase.sql`views + 1`,

      })

      .eq('id', videoId);



    return NextResponse.json({ success: true });

  } catch (error: any) {

    console.error('Error tracking view:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to track view' },

      { status: 500 }

    );

  }

}




