'use client';

import { useState } from 'react';
import { 
  Search, 
  Home, 
  TrendingUp, 
  BarChart3, 
  Bookmark, 
  Settings, 
  User, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TickerSearch from '@/components/TickerSearch';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: true },
  ];
  const headerNav = [
    { name: 'Markets', href: '/markets', icon: TrendingUp },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-32 md:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          {/* Logo Section */}
          <div className="flex-shrink-0 px-3 py-6">
            <div className="flex flex-col items-center">
              <a href="/" className="flex flex-col items-center group">
                <img 
                  src="/pryleaf.PNG" 
                  alt="Pryleaf" 
                  className="h-16 w-auto group-hover:opacity-80 transition-opacity mb-2"
                />
                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors text-center">
                  Pryleaf
                </span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex flex-col items-center px-2 py-3 text-xs font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 mb-1 ${
                  item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <span className="text-center">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Bottom Section - Settings & User (removed, now in header) */}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {/* Mobile logo section */}
            <div className="flex-shrink-0 px-6 py-6">
              <div className="flex flex-col items-center">
                <img 
                  src="/pryleaf.PNG" 
                  alt="Pryleaf" 
                  className="h-20 w-auto mb-2"
                />
                <span className="text-sm font-bold text-gray-600 text-center">
                  Pryleaf
                </span>
              </div>
            </div>
            
            {/* Mobile navigation */}
            <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex flex-col items-center px-3 py-4 text-sm font-medium rounded-lg ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`flex-shrink-0 h-6 w-6 mb-2 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="text-center">{item.name}</span>
                </a>
              ))}
            </nav>

            {/* Mobile bottom section */}
            <div className="flex-shrink-0 p-4 space-y-2">
              <a
                href="/settings"
                className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="flex-shrink-0 h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                Settings
              </a>
              <button className="group flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <User className="flex-shrink-0 h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                <span className="flex-1 text-left">Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header with nav, search, and settings/account */}
        <header className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Header nav (Markets, Analytics, Watchlist) */}
            <nav className="flex items-center space-x-2 mr-4">
              {headerNav.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                  title={item.name}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{item.name}</span>
                </a>
              ))}
            </nav>

            {/* Search bar - seamless design */}
            <div className="flex-1 max-w-lg">
              <TickerSearch />
            </div>

            {/* Settings & Account icons */}
            <div className="flex items-center space-x-2 ml-4">
              <a href="/settings" className="p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors" title="Settings">
                <Settings className="h-5 w-5" />
              </a>
              <button className="p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors" title="Account">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}