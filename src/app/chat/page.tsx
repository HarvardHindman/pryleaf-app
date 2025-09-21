import AppLayout from "@/components/AppLayout";
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
    <AppLayout>
      <div className="h-full flex">
        {/* Left Sidebar - Chat Rooms */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
          {/* Server Header */}
          <div className="h-20 px-4 flex flex-col justify-center border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pryleaf Community</h2>
            <p className="text-xs text-gray-500">Investment & Trading Hub</p>
          </div>

          {/* Chat Rooms */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                Text Channels
              </div>
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <a
                    key={room.name}
                    href={`/chat/${room.name}`}
                    className={`flex items-center px-2 py-2 rounded text-sm transition-colors ${
                      room.active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2 text-gray-400">#</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{room.name}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-20 px-6 flex items-center bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-gray-500 mr-1">#</span>
                  general
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Public
                  </span>
                </h1>
                <p className="text-sm text-gray-500">Connect with the Pryleaf investment community</p>
              </div>
              <div className="flex items-center space-x-2 text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
          
          {/* Chat takes up remaining space */}
          <div className="flex-1 overflow-hidden">
            <GeneralChat />
          </div>
        </div>

        {/* Right Sidebar - Online Users */}
        <div className="w-48 bg-white border-l border-gray-200 flex flex-col">
          {/* Online Header */}
          <div className="h-20 px-3 flex items-center border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Online — 1</h3>
          </div>

          {/* Online Members List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs">You</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}