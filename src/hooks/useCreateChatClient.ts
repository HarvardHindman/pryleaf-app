import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import type { User } from 'stream-chat';

interface UseCreateChatClientParams {
  apiKey: string;
  userData: User;
  tokenOrProvider: string;
}

export const useCreateChatClient = ({ apiKey, userData, tokenOrProvider }: UseCreateChatClientParams) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const client = StreamChat.getInstance(apiKey);
    let didUserConnectInterrupt = false;

    const connectionPromise = client.connectUser(userData, tokenOrProvider).then(() => {
      if (!didUserConnectInterrupt) {
        setChatClient(client);
      }
    });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('connection closed');
        });
    };
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};