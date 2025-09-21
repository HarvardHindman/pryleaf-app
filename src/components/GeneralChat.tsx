"use client";

import { useEffect, useState } from "react";
import { Chat, Channel, MessageList, Thread, Window } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { useStreamChat } from "@/contexts/StreamChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Users } from "lucide-react";
import CustomMessageUi from "@/components/ui/custommessageui";
import CustomMessageInput from "@/components/ui/CustomMessageInput";


export default function GeneralChat() {
  const { client, loading } = useStreamChat();
  const { user } = useAuth();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [channelLoading, setChannelLoading] = useState(true);

  // Custom component to disable default quoted message rendering
  const EmptyQuotedMessage = () => null;

  useEffect(() => {
    const initializeChannel = async () => {
      if (!client || !user) {
        setChannel(null);
        setChannelLoading(false);
        return;
      }

      // Reset channel loading when client or user changes
      setChannelLoading(true);

      try {
        // Create or get the general channel (user should already be a member from server-side)
        const generalChannel = client.channel('messaging', 'general', {
          name: 'General Chat',
          image: 'https://via.placeholder.com/40/4f46e5/ffffff?text=G',
        });

        await generalChannel.watch();
        setChannel(generalChannel);
      } catch (error) {
        console.error('Failed to initialize channel:', error);
        setChannel(null);
      } finally {
        setChannelLoading(false);
      }
    };

    initializeChannel();
  }, [client, user?.id]); // Only depend on user ID to avoid unnecessary re-initializations

  if (loading || channelLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please sign in to join the chat</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!client || !channel) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Failed to load chat.</p>
          <p className="text-sm text-gray-500 mb-4">
            {!client ? 'Chat client not connected' : 'Channel not available'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full custom-chat">
      <Chat client={client} theme="str-chat__theme-light">
        <Channel 
          channel={channel} 
          Message={CustomMessageUi}
          QuotedMessage={EmptyQuotedMessage}
        >
          <Window>
            <MessageList />
            <CustomMessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}