import { DefaultChannelData, DefaultAttachmentData } from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {
    name?: string;
    image?: string;
  }

  interface CustomAttachmentData extends DefaultAttachmentData {
    name?: string;
    image?: string;
    url?: string;
  }
}