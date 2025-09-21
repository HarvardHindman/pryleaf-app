"use client";

import { useState, useEffect, useRef } from "react";
import { useChannelStateContext } from "stream-chat-react";
import type { Message } from "stream-chat";
import { Plus, Smile } from "lucide-react";

export default function CustomMessageInput() {
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { channel } = useChannelStateContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !inputValue.trim()) return;

    try {
      const messageToSend = {
        text: inputValue.trim(),
        quoted_message_id: quotedMessage?.id,
      };

      await channel.sendMessage(messageToSend);
      setInputValue("");
      clearQuotedMessage();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  return (
    <div className="relative">
      {/* Quoted Message Preview */}
      {quotedMessage && (
        <div className="mx-4 mb-2 border-l-2 pl-3 py-2" style={{ borderColor: 'var(--clr-surface-a30)' }}>
          <div className="flex justify-between items-start">
            <div className="flex-1 opacity-70">
              <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--clr-primary-a40)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Replying to {quotedMessage.user?.name || 'Unknown User'}</span>
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--clr-primary-a40)' }}>
                {quotedMessage.text || 'Message'}
              </div>
            </div>
            <button
              onClick={clearQuotedMessage}
              className="ml-2 p-1 rounded transition-colors"
              style={{ 
                color: 'var(--clr-primary-a30)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
                e.currentTarget.style.color = 'var(--clr-primary-a40)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--clr-primary-a30)';
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Modern Input Bar */}
      <div className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="relative">
          <div 
            className="flex items-end rounded-xl border transition-all"
            style={{ 
              backgroundColor: 'var(--clr-surface-a10)',
              borderColor: 'var(--clr-surface-a30)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--clr-info-a20)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--clr-info-a20)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--clr-surface-a30)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Plus Button - Inside Left */}
            <button
              type="button"
              className="flex-shrink-0 p-3 rounded-l-xl transition-colors"
              style={{ color: 'var(--clr-primary-a40)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--clr-primary-a50)';
                e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--clr-primary-a40)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none bg-transparent border-0 outline-none px-2 py-3 min-h-[44px] max-h-[120px] theme-input"
              style={{ 
                color: 'var(--clr-primary-a50)'
              }}
              rows={1}
            />

            {/* Emoji Button - Inside Right */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex-shrink-0 p-3 rounded-r-xl transition-colors"
                style={{ color: 'var(--clr-primary-a40)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--clr-primary-a50)';
                  e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--clr-primary-a40)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Simple Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  className="absolute bottom-full right-0 mb-2 rounded-lg shadow-lg p-3 z-10"
                  style={{ 
                    backgroundColor: 'var(--clr-surface-a0)',
                    border: '1px solid var(--clr-surface-a30)'
                  }}
                >
                  <div className="grid grid-cols-5 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setInputValue(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded text-lg transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}