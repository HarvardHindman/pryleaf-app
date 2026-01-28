'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  BarChart3, 
  Settings, 
  User, 
  ChevronDown,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Globe,
  Building2,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TickerSearch from '@/components/TickerSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';
import CommunityNavigation from '@/components/CommunityNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { 
    ownedCommunities, 
    isUserOwner, 
    getCommunityById, 
    selectedCommunityId, 
    setSelectedCommunityId 
  } = useCommunityCache();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current path for navigation highlighting
  const currentPath = usePathname();

  // Check if we're on a specific community page and store it
  const communityMatch = currentPath.match(/^\/community\/([^\/]+)(?:\/(.+))?$/);
  const urlCommunityId = communityMatch ? communityMatch[1] : null;
  const communitySubPath = communityMatch ? communityMatch[2] : null;
  
  // Use URL community or selected community
  const communityId = urlCommunityId && urlCommunityId !== 'create' ? urlCommunityId : selectedCommunityId;
  const isOnCommunityDetail = communityId && communityId !== 'create';
  
  // Get current community name for sidebar display
  const currentCommunity = communityId ? getCommunityById(communityId) : null;
  const communityDisplayName = currentCommunity ? currentCommunity.name : 'Community';

  // Update selected community when URL changes
  useEffect(() => {
    if (urlCommunityId && urlCommunityId !== 'create' && urlCommunityId !== selectedCommunityId) {
      setSelectedCommunityId(urlCommunityId);
    }
  }, [urlCommunityId, selectedCommunityId, setSelectedCommunityId]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: currentPath === '/' },
    { name: 'Research', href: '/research', icon: Building2, current: currentPath === '/research' },
  ];

  // Check if user is owner using cache
  const isOwner = communityId ? isUserOwner(communityId) : false;

  // Community-specific tabs - Simplified!
  // Only show community tabs if a community is selected
  const communityTabs = communityId ? [
    ...(isOwner ? [{ name: 'Community', href: `/community/${communityId}/dashboard`, icon: BarChart3, current: urlCommunityId === communityId && communitySubPath === 'dashboard' }] : []),
    { name: 'Videos', href: `/community/${communityId}/videos`, icon: Play, current: urlCommunityId === communityId && communitySubPath === 'videos' },
    { name: 'Chat', href: `/chat`, icon: MessageSquare, current: currentPath === '/chat' },
  ] : [];
  const headerNav = [
    { name: 'News', href: '/news', icon: Globe },
    { name: 'Tools', href: '/tools', icon: Settings },
  ];

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {/* Sidebar */}
      <div className="hidden md:flex md:w-28 md:flex-col">
        <div
          className="flex flex-col h-full"
          style={{
            backgroundColor: 'var(--surface-sidebar)'
          }}
        >
          {/* Logo Section */}
          <div className="flex-shrink-0 px-3 py-4">
            <div className="flex flex-col items-center">
              <Link href="/landing" className="flex flex-col items-center group">
                <span className="text-lg font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--interactive-primary)' }}>
                  Pryleaf
                </span>
              </Link>
            </div>
          </div>

          {/* Main Navigation - Investment Tools */}
          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 text-xs font-medium hover:shadow-sm active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <item.icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-center leading-tight">{item.name}</span>
              </Link>
            ))}

            {/* Community Tabs */}
            {user && communityTabs.length > 0 && (
              <>
                {communityTabs.map((tab) => (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className="flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 text-xs font-medium hover:shadow-sm active:scale-95"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <tab.icon className="h-5 w-5 mb-1 flex-shrink-0" />
                    <span className="text-center leading-tight">{tab.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Community Switcher - Bottom Section */}
          {user && (
            <div className="flex-shrink-0 px-2 py-2">
              <CommunityNavigation />
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full" style={{ backgroundColor: 'var(--surface-sidebar)' }}>
            {/* Mobile logo section */}
            <div className="flex-shrink-0 px-6 py-6">
              <div className="flex flex-col items-center">
                <Link href="/landing" className="group">
                  <span className="text-2xl font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--interactive-primary)' }}>
                    Pryleaf
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Mobile navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="flex-shrink-0 h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Communities Section */}
              {user && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  {/* Community Banner for Mobile */}
                  <div 
                    className="mx-3 mb-3 px-3 py-2 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--surface-tertiary)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="text-xs font-semibold truncate flex-1"
                        style={{ color: 'var(--text-primary)' }}
                        title={communityDisplayName}
                      >
                        {communityDisplayName}
                      </div>
                    </div>
                  </div>
                  <div className="px-2">
                    <CommunityNavigation />
                  </div>
                </div>
              )}
            </nav>

            {/* Mobile bottom section */}
            <div className="flex-shrink-0 p-4 space-y-2">
              <Link
                href="/settings"
                className="group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="flex-shrink-0 h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                Settings
              </Link>
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
        <header
          className="px-6 py-4"
          style={{ backgroundColor: 'var(--surface-secondary)' }}
        >
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
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-2 py-1 text-xs text-gray-600 transition-colors hover-interactive"
                  title={item.name}
                  style={{
                    ['--hover-color' as any]: 'var(--interactive-primary)'
                  } as React.CSSProperties}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Search bar - seamless design */}
            <div className="flex-1 max-w-lg">
              <TickerSearch />
            </div>

            {/* Settings & Account icons */}
            <div className="flex items-center space-x-2 ml-4">
              <Link 
                href="/settings" 
                className="p-2 rounded-full text-gray-400 transition-colors group" 
                title="Settings"
              >
                <Settings className="h-5 w-5 group-hover:opacity-80" style={{ ['--hover-color' as any]: 'var(--interactive-primary)' } as React.CSSProperties} />
              </Link>
              
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full text-gray-400 transition-colors group"
                    title="Account"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm">{user.email?.split('@')[0]}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--surface-primary)] rounded-md shadow-lg border border-[var(--border-default)] z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                          {user.email}
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={signOut}
                          className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                        >
                          <LogOut className="inline h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-3 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--interactive-primary)] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1 text-sm bg-[var(--interactive-primary)] text-[var(--surface-primary)] rounded-md hover:bg-[var(--interactive-hover)] transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 scrollbar-hidden ${pathname?.startsWith('/symbol/') ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{
            backgroundColor: 'var(--surface-secondary)',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* Internet Explorer 10+ */
          }}
        >
          {children}
          {/* Hide scrollbars for WebKit browsers */}
          <style jsx>{`
            main::-webkit-scrollbar {
              display: none; /* Safari and Chrome */
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}