import AppLayout from "@/components/AppLayout";
import GeneralChat from "@/components/GeneralChat";

export default function ChatPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Simple header without card styling */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                 # general
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
    </AppLayout>
  );
}