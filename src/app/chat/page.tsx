'use client';

// AppLayout is now handled at the root level
import Link from 'next/link';
import GeneralChat from "@/components/GeneralChat";

export default function ChatPage() {
  const chatRooms = [
    { name: "general", description: "General discussion", active: true, type: "text" },
    { name: "trading-signals", description: "Share trading insights", active: false, type: "text" },
    { name: "market-analysis", description: "Daily market analysis", active: false, type: "text" },
    { name: "announcements", description: "Important updates", active: false, type: "text" },
    { name: "off-topic", description: "Non-trading discussions", active: false, type: "text" },
  ];

  return (
    <div className="h-full flex">
        {/* Left Sidebar - Chat Rooms */}
        <div 
          className="w-60 border-r flex flex-col"
          style={{ 
            backgroundColor: 'var(--clr-surface-a0)',
            borderColor: 'var(--clr-surface-a30)'
          }}
        >
          {/* Server Header */}
          <div 
            className="h-20 px-4 flex flex-col justify-center border-b"
            style={{ borderColor: 'var(--clr-surface-a30)' }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: 'var(--clr-primary-a50)' }}
            >
              Pryleaf Community
            </h2>
            <p 
              className="text-xs"
              style={{ color: 'var(--clr-primary-a40)' }}
            >
              Investment & Trading Hub
            </p>
          </div>

          {/* Chat Rooms */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div 
                className="text-xs font-semibold uppercase tracking-wider mb-2 px-2"
                style={{ color: 'var(--clr-primary-a40)' }}
              >
                Text Channels
              </div>
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <Link
                    key={room.name}
                    href={`/chat/${room.name}`}
                    className="flex items-center px-2 py-2 rounded text-sm transition-colors"
                    style={{
                      backgroundColor: room.active ? 'var(--clr-info-a0)' : 'transparent',
                      color: room.active ? 'var(--clr-info-a20)' : 'var(--clr-primary-a40)',
                      border: room.active ? '1px solid var(--clr-info-a10)' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!room.active) {
                        e.currentTarget.style.backgroundColor = 'var(--clr-surface-a10)';
                        e.currentTarget.style.color = 'var(--clr-primary-a50)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!room.active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--clr-primary-a40)';
                      }
                    }}
                  >
                    <span className="mr-2" style={{ color: 'var(--clr-primary-a30)' }}>#</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{room.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div 
            className="h-20 px-6 flex items-center border-b shadow-sm"
            style={{ 
              backgroundColor: 'var(--clr-surface-a0)',
              borderColor: 'var(--clr-surface-a30)'
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h1 
                  className="text-lg font-semibold flex items-center"
                  style={{ color: 'var(--clr-primary-a50)' }}
                >
                  <span className="mr-1" style={{ color: 'var(--clr-primary-a40)' }}>#</span>
                  general
                  <span 
                    className="ml-2 text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'var(--clr-surface-a20)',
                      color: 'var(--clr-primary-a40)'
                    }}
                  >
                    Public
                  </span>
                </h1>
              </div>
            </div>
          </div>
          
          {/* Chat takes up remaining space */}
          <div className="flex-1 overflow-hidden">
            <GeneralChat />
          </div>
        </div>

        {/* Right Sidebar - Online Users */}
        <div 
          className="w-48 border-l flex flex-col"
          style={{ 
            backgroundColor: 'var(--clr-surface-a0)',
            borderColor: 'var(--clr-surface-a30)'
          }}
        >
          {/* Online Header */}
          <div 
            className="h-20 px-3 flex items-center border-b"
            style={{ borderColor: 'var(--clr-surface-a30)' }}
          >
            <h3 
              className="text-sm font-semibold"
              style={{ color: 'var(--clr-primary-a50)' }}
            >
              Online — 1
            </h3>
          </div>

          {/* Online Members List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              <div 
                className="flex items-center text-sm"
                style={{ color: 'var(--clr-primary-a40)' }}
              >
                <div 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: 'var(--clr-success-a20)' }}
                ></div>
                <span className="text-xs">You</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}