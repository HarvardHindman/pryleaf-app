import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/communities/[id]/videos/[videoId]/like
 * Toggle video like
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

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', videoId)
      .eq('user_id', user.id)
      .eq('content_type', 'video')
      .single();

    if (existingLike) {
      // Unlike - remove like
      await supabase
        .from('content_likes')
        .delete()
        .eq('id', existingLike.id);

      // Decrement like count
      await supabase
        .from('community_content')
        .update({
          likes: sql`GREATEST(likes - 1, 0)`, // Prevent negative
        })
        .eq('id', videoId);

      return NextResponse.json({ liked: false });
    } else {
      // Like - add like
      await supabase
        .from('content_likes')
        .insert({
          content_id: videoId,
          user_id: user.id,
          content_type: 'video',
        });

      // Increment like count
      await supabase
        .from('community_content')
        .update({
          likes: sql`likes + 1`,
        })
        .eq('id', videoId);

      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    );
  }
}



      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`GREATEST(likes - 1, 0)`, // Prevent negative

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: false });

    } else {

      // Like - add like

      await supabase

        .from('content_likes')

        .insert({

          content_id: videoId,

          user_id: user.id,

          content_type: 'video',

        });



      // Increment like count

      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`likes + 1`,

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: true });

    }

  } catch (error: any) {

    console.error('Error toggling like:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to toggle like' },

      { status: 500 }

    );

  }

}






      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`GREATEST(likes - 1, 0)`, // Prevent negative

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: false });

    } else {

      // Like - add like

      await supabase

        .from('content_likes')

        .insert({

          content_id: videoId,

          user_id: user.id,

          content_type: 'video',

        });



      // Increment like count

      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`likes + 1`,

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: true });

    }

  } catch (error: any) {

    console.error('Error toggling like:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to toggle like' },

      { status: 500 }

    );

  }

}






      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`GREATEST(likes - 1, 0)`, // Prevent negative

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: false });

    } else {

      // Like - add like

      await supabase

        .from('content_likes')

        .insert({

          content_id: videoId,

          user_id: user.id,

          content_type: 'video',

        });



      // Increment like count

      await supabase

        .from('community_content')

        .update({

          likes: supabase.sql`likes + 1`,

        })

        .eq('id', videoId);



      return NextResponse.json({ liked: true });

    }

  } catch (error: any) {

    console.error('Error toggling like:', error);

    return NextResponse.json(

      { error: error.message || 'Failed to toggle like' },

      { status: 500 }

    );

  }

}




