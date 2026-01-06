"use client";

import { useEffect, useState } from "react";
import { Chat, Channel, MessageList, Thread, Window } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { useStreamChat } from "@/contexts/StreamChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Users } from "lucide-react";
import CustomMessageUi from "@/components/ui/custommessageui";
import CustomMessageInput from "@/components/ui/CustomMessageInput";


export default function GeneralChat() {
  const { client, loading, isDemoMode } = useStreamChat();
  const { user } = useAuth();
  const { theme } = useTheme();
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
      <div
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--interactive-primary)' }}
          ></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="text-center">
          <Users
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <p
            className="mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Please sign in to join the chat
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--interactive-primary)',
              color: 'var(--surface-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--interactive-primary)';
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Show demo mode UI when in demo mode
  if (isDemoMode || !client || !channel) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div
            className="px-4 py-3 text-center border-b"
            style={{
              backgroundColor: 'var(--surface-tertiary)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)'
            }}
          >
            <p className="text-sm">
              💬 <strong>Demo Mode</strong> - Configure StreamChat credentials to enable live chat
            </p>
          </div>
        )}

        {/* Demo Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Example Message 1 */}
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--interactive-primary)', color: 'white' }}
            >
              A
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Alice
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  2 hours ago
                </span>
              </div>
              <div
                className="rounded-lg px-3 py-2 inline-block"
                style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}
              >
                Hey everyone! Just saw some interesting movement in the market today 📈
              </div>
            </div>
          </div>

          {/* Example Message 2 */}
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#10b981', color: 'white' }}
            >
              B
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Bob
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  1 hour ago
                </span>
              </div>
              <div
                className="rounded-lg px-3 py-2 inline-block"
                style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}
              >
                Yeah! What are your thoughts on $NVDA?
              </div>
            </div>
          </div>

          {/* Example Message 3 */}
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#f59e0b', color: 'white' }}
            >
              C
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Charlie
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  30 minutes ago
                </span>
              </div>
              <div
                className="rounded-lg px-3 py-2 inline-block"
                style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}
              >
                Looking strong! I'm keeping an eye on the tech sector this week.
              </div>
            </div>
          </div>

          {/* Your Message Example */}
          <div className="flex gap-3 justify-end">
            <div className="flex-1 flex flex-col items-end">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Just now
                </span>
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  You
                </span>
              </div>
              <div
                className="rounded-lg px-3 py-2 inline-block"
                style={{ backgroundColor: 'var(--interactive-primary)', color: 'white' }}
              >
                This is a demo message. Configure StreamChat to enable real chat! 🚀
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--interactive-primary)', color: 'white' }}
            >
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Demo Input */}
        <div
          className="border-t p-4"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Messages are disabled in demo mode..."
              disabled
              className="flex-1 px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-tertiary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            />
            <button
              disabled
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-tertiary)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            >
              Send
            </button>
          </div>
          {!isDemoMode && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Chat unavailable. Please refresh or check your connection.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full custom-chat"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      <Chat client={client} theme="str-chat__theme-light" className={theme === 'dark' ? 'dark' : ''}>
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