import { NextRequest, NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    // Check if StreamChat credentials are configured
    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.warn('StreamChat credentials not configured. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET in .env.local');
      return NextResponse.json({ 
        error: 'StreamChat not configured. Chat features are disabled.' 
      }, { status: 503 })
    }

    // Initialize StreamChat server client
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    )

    // Get the current user from Supabase
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create or update user in StreamChat with appropriate role
    const streamUser = {
      id: user.id,
      name: user.email?.split('@')[0] || 'User',
      email: user.email,
      role: 'user', // Explicitly set the role
    }

    await serverClient.upsertUser(streamUser)

    // Ensure the general channel exists and user has access
    try {
      const channel = serverClient.channel('messaging', 'general', {
        name: 'General Chat',
        image: 'https://via.placeholder.com/40/4f46e5/ffffff?text=G',
        created_by_id: user.id,
      })
      
      // Create the channel if it doesn't exist and add the user as a member
      await channel.create()
      
      // Add the user as a member to ensure they have read permissions
      await channel.addMembers([user.id])
      
    } catch (channelError: any) {
      // Channel might already exist, try to add user as member
      if (channelError.code === 4) { // Channel already exists
        try {
          const channel = serverClient.channel('messaging', 'general')
          await channel.addMembers([user.id])
        } catch (memberError) {
          console.log('User might already be a member:', memberError)
        }
      } else {
        console.log('Channel creation error:', channelError)
      }
    }

    // Generate user token
    const token = serverClient.createToken(user.id)

    return NextResponse.json({ 
      token,
      user: streamUser,
      api_key: process.env.NEXT_PUBLIC_STREAM_API_KEY
    })
  } catch (error) {
    console.error('StreamChat token generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}