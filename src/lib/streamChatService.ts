import { StreamChat } from 'stream-chat';

// Server-side Stream Chat client initialization
export function getStreamServerClient() {
  return StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );
}

/**
 * Create a community channel in Stream Chat
 */
export async function createCommunityChannel(
  communityId: string,
  channelName: string,
  minimumTierLevel: number,
  options?: {
    description?: string;
    isAnnouncementOnly?: boolean;
  }
) {
  const client = getStreamServerClient();

  const channelId = `community_${communityId}_${channelName.toLowerCase().replace(/\s+/g, '-')}`;
  
  const channel = client.channel('messaging', channelId, {
    name: channelName,
    image: options?.description ? undefined : 'https://via.placeholder.com/40',
    created_by_id: 'system',
    community_id: communityId,
    minimum_tier_level: minimumTierLevel,
    is_announcement_only: options?.isAnnouncementOnly || false,
  });

  await channel.create();

  return {
    channelId,
    channel
  };
}

/**
 * Grant user access to community channels based on their tier level
 */
export async function grantCommunityChannelAccess(
  userId: string,
  communityId: string,
  userTierLevel: number
) {
  const client = getStreamServerClient();

  // Query all channels for this community
  const filter = {
    type: 'messaging',
    community_id: communityId,
  };

  const channels = await client.queryChannels(filter);

  // Add user to channels they have access to
  for (const channel of channels) {
    const channelTierLevel = (channel.data?.minimum_tier_level as number) || 0;
    
    if (userTierLevel >= channelTierLevel) {
      try {
        await channel.addMembers([userId]);
      } catch (error) {
        // User might already be a member, continue
        console.log(`User ${userId} already in channel ${channel.id}`);
      }
    }
  }
}

/**
 * Revoke user access to all community channels
 */
export async function revokeCommunityChannelAccess(
  userId: string,
  communityId: string
) {
  const client = getStreamServerClient();

  const filter = {
    type: 'messaging',
    community_id: communityId,
    members: { $in: [userId] },
  };

  const channels = await client.queryChannels(filter);

  for (const channel of channels) {
    try {
      await channel.removeMembers([userId]);
    } catch (error) {
      console.log(`Error removing user ${userId} from channel ${channel.id}`);
    }
  }
}

/**
 * Update user's channel access when tier changes
 */
export async function updateCommunityChannelAccess(
  userId: string,
  communityId: string,
  newTierLevel: number
) {
  const client = getStreamServerClient();

  const filter = {
    type: 'messaging',
    community_id: communityId,
  };

  const channels = await client.queryChannels(filter);

  for (const channel of channels) {
    const channelTierLevel = (channel.data?.minimum_tier_level as number) || 0;
    const isMember = channel.state.members[userId] !== undefined;

    if (newTierLevel >= channelTierLevel && !isMember) {
      // Grant access
      try {
        await channel.addMembers([userId]);
      } catch (error) {
        console.log(`Error adding user ${userId} to channel ${channel.id}`);
      }
    } else if (newTierLevel < channelTierLevel && isMember) {
      // Revoke access
      try {
        await channel.removeMembers([userId]);
      } catch (error) {
        console.log(`Error removing user ${userId} from channel ${channel.id}`);
      }
    }
  }
}

/**
 * Get all channels user has access to across communities
 */
export async function getUserCommunityChannels(userId: string) {
  const client = getStreamServerClient();

  const filter = {
    type: 'messaging',
    members: { $in: [userId] },
    community_id: { $exists: true },
  };

  const sort = [{ last_message_at: -1 as const }];

  const channels = await client.queryChannels(filter, sort, {
    watch: false,
    state: true,
  });

  // Group by community
  const channelsByCommunity: Record<string, any[]> = {};

  for (const channel of channels) {
    const communityId = channel.data?.community_id as string;
    if (!communityId) continue;

    if (!channelsByCommunity[communityId]) {
      channelsByCommunity[communityId] = [];
    }

    channelsByCommunity[communityId].push({
      id: channel.id,
      name: channel.data?.name,
      unreadCount: channel.state.unreadCount || 0,
      lastMessageAt: channel.state.last_message_at,
      minimumTierLevel: channel.data?.minimum_tier_level || 0,
      isAnnouncementOnly: channel.data?.is_announcement_only || false,
    });
  }

  return channelsByCommunity;
}

/**
 * Create default channels for a new community
 */
export async function createDefaultCommunityChannels(
  communityId: string,
  creatorId: string
) {
  const client = getStreamServerClient();

  const defaultChannels = [
    {
      name: 'announcements',
      description: 'Important updates from the creator',
      minimumTierLevel: 0,
      isAnnouncementOnly: true,
    },
    {
      name: 'general',
      description: 'General community discussion',
      minimumTierLevel: 0,
      isAnnouncementOnly: false,
    },
  ];

  const createdChannels = [];

  for (const channelConfig of defaultChannels) {
    const channelId = `community_${communityId}_${channelConfig.name}`;
    
    const channel = client.channel('messaging', channelId, {
      name: channelConfig.name,
      created_by_id: creatorId,
      community_id: communityId,
      minimum_tier_level: channelConfig.minimumTierLevel,
      is_announcement_only: channelConfig.isAnnouncementOnly,
    });

    await channel.create();
    
    // Add creator as member
    await channel.addMembers([creatorId], {
      is_moderator: true,
    });

    createdChannels.push({
      channelId,
      name: channelConfig.name,
      minimumTierLevel: channelConfig.minimumTierLevel,
    });
  }

  return createdChannels;
}

