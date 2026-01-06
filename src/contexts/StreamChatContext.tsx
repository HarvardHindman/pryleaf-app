"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { StreamChat } from "stream-chat";
import { useAuth } from "./AuthContext";

interface StreamChatContextType {
  client: StreamChat | null;
  loading: boolean;
  isDemoMode?: boolean;
}

const StreamChatContext = createContext<StreamChatContextType>({
  client: null,
  loading: true,
  isDemoMode: false,
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
  const [isDemoMode, setIsDemoMode] = useState(false);
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
        setIsDemoMode(false);
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
          const errorData = await response.json().catch(() => ({}));
          console.warn(`StreamChat token fetch failed (${response.status}). Switching to demo mode.`, errorData);
          
          // Create demo client with mock credentials
          await initializeDemoMode(user.id, user.email || 'demo@example.com');
          return;
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
        setIsDemoMode(false);
      } catch (error) {
        console.warn('StreamChat initialization failed. Switching to demo mode:', error);
        await initializeDemoMode(user.id, user.email || 'demo@example.com');
      } finally {
        setLoading(false);
      }
    };

    // Demo mode initialization function
    const initializeDemoMode = async (userId: string, userEmail: string) => {
      try {
        console.log('StreamChat: Initializing DEMO MODE');
        
        // Use a demo API key - this won't actually connect but will create a client instance
        const demoApiKey = 'demo-api-key';
        const demoClient = new StreamChat(demoApiKey);
        
        // Create mock user data
        const mockUser = {
          id: userId,
          name: userEmail.split('@')[0] || 'Demo User',
          email: userEmail,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail.split('@')[0])}&background=4f46e5&color=fff`,
        };
        
        // Create a mock token (won't be used for actual connection)
        const mockToken = 'demo-token-' + userId;
        
        // Set up the client with mock data (this won't actually connect to Stream servers)
        // The client will be in an "offline" state but components can still render
        setClient(demoClient);
        setIsDemoMode(true);
        
        console.log('StreamChat: Demo mode initialized successfully');
      } catch (demoError) {
        console.error('Failed to initialize demo mode:', demoError);
        setClient(null);
        setIsDemoMode(false);
      }
      setLoading(false);
    };

    initializeChat();

    // Cleanup function - don't disconnect here as the singleton should persist
    return () => {
      // We don't disconnect in cleanup since we're using singleton pattern
      // The client should persist across component unmounts
    };
  }, [user?.id]); // Only depend on user ID to avoid unnecessary reconnections

  return (
    <StreamChatContext.Provider value={{ client, loading, isDemoMode }}>
      {children}
    </StreamChatContext.Provider>
  );
}