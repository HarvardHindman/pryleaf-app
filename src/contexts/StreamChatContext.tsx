"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { StreamChat } from "stream-chat";
import { useAuth } from "./AuthContext";

interface StreamChatContextType {
  client: StreamChat | null;
  loading: boolean;
}

const StreamChatContext = createContext<StreamChatContextType>({
  client: null,
  loading: true,
});

export const useStreamChat = () => {
  const context = useContext(StreamChatContext);
  if (!context) {
    throw new Error("useStreamChat must be used within a StreamChatProvider");
  }
  return context;
};

interface StreamChatProviderProps {
  children: ReactNode;
}

export function StreamChatProvider({ children }: StreamChatProviderProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const initializeChat = async () => {
      console.log('StreamChat: Initializing chat for user:', user?.id);
      
      if (!user) {
        console.log('StreamChat: No user, disconnecting if connected');
        // If there's a connected client, disconnect the user
        if (client && client.user) {
          try {
            await client.disconnectUser();
            console.log('StreamChat: Disconnected user due to logout');
          } catch (error) {
            console.error('Error disconnecting user:', error);
          }
        }
        setClient(null);
        setLoading(false);
        return;
      }

      try {
        console.log('StreamChat: Getting token for user:', user.id);
        // Get StreamChat token from our API
        const response = await fetch('/api/stream-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get StreamChat token: ${response.status}`);
        }

        const { token, user: streamUser, api_key } = await response.json();
        console.log('StreamChat: Got token for user:', streamUser.id);

        // Get or create the singleton client instance
        const chatClient = StreamChat.getInstance(api_key);
        
        // If there's already a connected user and it's different, disconnect first
        if (chatClient.user && chatClient.user.id !== streamUser.id) {
          console.log('StreamChat: Disconnecting previous user:', chatClient.user.id);
          await chatClient.disconnectUser();
        }

        // Only connect if not already connected to this user
        if (!chatClient.user || chatClient.user.id !== streamUser.id) {
          console.log('StreamChat: Connecting user:', streamUser.id);
          await chatClient.connectUser(streamUser, token);
          console.log('StreamChat: Successfully connected user:', streamUser.id);
        } else {
          console.log('StreamChat: User already connected:', streamUser.id);
        }
        
        setClient(chatClient);
      } catch (error) {
        console.error('Failed to initialize StreamChat:', error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup function - don't disconnect here as the singleton should persist
    return () => {
      // We don't disconnect in cleanup since we're using singleton pattern
      // The client should persist across component unmounts
    };
  }, [user?.id]); // Only depend on user ID to avoid unnecessary reconnections

  return (
    <StreamChatContext.Provider value={{ client, loading }}>
      {children}
    </StreamChatContext.Provider>
  );
}