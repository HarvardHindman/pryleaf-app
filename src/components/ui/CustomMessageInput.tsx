"use client";

import { useState, useEffect } from "react";
import { MessageInput, useChannelStateContext } from "stream-chat-react";
import type { Message } from "stream-chat";

export default function CustomMessageInput() {
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const { channel } = useChannelStateContext();

  useEffect(() => {
    const handleReplyEvent = (event: CustomEvent) => {
      setQuotedMessage(event.detail.message);
    };

    document.addEventListener('streamChatReply', handleReplyEvent as EventListener);
    return () => {
      document.removeEventListener('streamChatReply', handleReplyEvent as EventListener);
    };
  }, []);

  const clearQuotedMessage = () => {
    setQuotedMessage(null);
  };

  // Send message with quoted_message_id (Stream Chat's official quote system)
  const handleSubmit = async (params: any) => {
    if (!channel) return;

    try {
      const messageToSend = {
        text: params.message.text,
        attachments: params.message.attachments || [],
        quoted_message_id: quotedMessage?.id, // Official Stream Chat field for quotes
      };

      await channel.sendMessage(messageToSend);
      clearQuotedMessage();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  return (
    <div className="relative">
      {/* Quoted Message Preview - Minimal Style */}
      {quotedMessage && (
        <div className="mx-4 mb-2 border-l-2 border-gray-300 pl-3 py-2">
          <div className="flex justify-between items-start">
            <div className="flex-1 opacity-70">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Replying to {quotedMessage.user?.name || 'Unknown User'}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {quotedMessage.text || 'Message'}
              </div>
            </div>
            <button
              onClick={clearQuotedMessage}
              className="ml-2 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Message Input */}
      <MessageInput 
        focus={false}
        overrideSubmitHandler={quotedMessage ? handleSubmit : undefined}
      />
    </div>
  );
}