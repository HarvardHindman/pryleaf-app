import {
  useMessageContext,
  MessageText,
  ReactionsList,
  ReactionSelector,
  useComponentContext,
  useChannelStateContext,
  useChatContext,
} from "stream-chat-react";
import { useState } from "react";

const CustomMessageUi = () => {
  const { message } = useMessageContext();
  const { QuotedMessage } = useComponentContext();
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const [showReactionSelector, setShowReactionSelector] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Format the timestamp
  const formatTime = (date: string | Date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleReply = () => {
    // Dispatch a custom event that the GeneralChat component will listen for
    const replyEvent = new CustomEvent('streamChatReply', {
      detail: { message },
      bubbles: true
    });
    document.dispatchEvent(replyEvent);
    
    // Also try to focus the message input
    setTimeout(() => {
      const messageInput = document.querySelector('.str-chat__input-flat textarea') as HTMLTextAreaElement;
      if (messageInput) {
        messageInput.focus();
      }
    }, 100);
  };

  const handleReactionClick = () => {
    setShowReactionSelector(!showReactionSelector);
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleEdit = () => {
    console.log('Edit message:', message.id);
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await client.deleteMessage(message.id);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
    setShowDropdown(false);
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
    setShowDropdown(false);
  };

  const handleFlag = async () => {
    try {
      await client.flagMessage(message.id);
    } catch (error) {
      console.error('Error flagging message:', error);
    }
    setShowDropdown(false);
  };

  return (
    <div 
      className="flex gap-3 px-4 py-2 transition-colors group" 
      data-message-id={message.id}
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex-1 min-w-0">
        {/* Show quoted message with minimal, faint design */}
        {(message as any).quoted_message && (
          <div className="mb-1 opacity-60">
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--clr-primary-a30)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="font-medium">
                {(message as any).quoted_message.user?.name || (message as any).quoted_message.user?.id}
              </span>
            </div>
            <div className="text-xs truncate ml-4 max-w-md" style={{ color: 'var(--clr-primary-a30)' }}>
              {(message as any).quoted_message.text}
            </div>
          </div>
        )}

        {/* Time and Username Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--clr-primary-a40)' }}>
            {formatTime(message.created_at || new Date())}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--clr-primary-a50)' }}>
            {message.user?.name || message.user?.id || 'Unknown User'}
          </span>
        </div>
        {/* Message Content */}
        <div className="text-left">
          <MessageText />
        </div>
        {/* Reactions List */}
        <ReactionsList />
        {/* Reaction Selector */}
        {showReactionSelector && (
          <div className="mt-2">
            <ReactionSelector />
          </div>
        )}
      </div>
      
      {/* Action Buttons - Right Side */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Reactions Button */}
        <button
          onClick={handleReactionClick}
          className="p-2 rounded-md transition-colors"
          title="Add Reaction"
          style={{ color: 'var(--clr-primary-a40)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Reply Button */}
        <button
          onClick={handleReply}
          className="p-2 rounded-md transition-colors"
          title="Reply"
          style={{ color: 'var(--clr-primary-a40)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="p-2 rounded-md transition-colors"
            title="More Options"
            style={{ color: 'var(--clr-primary-a40)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--clr-surface-a20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div 
              className="absolute right-0 top-full mt-1 rounded-md shadow-lg py-1 z-10 min-w-[120px]"
              style={{ 
                backgroundColor: 'var(--clr-surface-a0)',
                border: '1px solid var(--clr-surface-a30)'
              }}
            >
              <button
                onClick={handleCopy}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                style={{ color: 'var(--clr-primary-a50)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </button>
              
              {message.user?.id === client.userID && (
                <>
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--clr-primary-a50)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--clr-danger-a20)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--clr-danger-a0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
              
              <hr style={{ margin: '4px 0', borderColor: 'var(--clr-surface-a30)' }} />
              
              <button
                onClick={handleFlag}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                style={{ color: 'var(--clr-primary-a50)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Flag Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomMessageUi;