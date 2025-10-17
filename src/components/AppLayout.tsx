'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  X,
  LogOut,
  MessageSquare,
  Sun,
  Moon,
  Plus,
  Hash,
  Users,
  Compass,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Globe,
  Building2,
  Server,
  Video,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TickerSearch from '@/components/TickerSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import CommunityNavigation from '@/components/CommunityNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // Load last active community from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lastActiveCommunity');
      if (stored) {
        setSelectedCommunityId(stored);
      }
    }
  }, []);

  // Fetch user's communities and prioritize owned communities
  useEffect(() => {
    async function loadDefaultCommunity() {
      if (!user) return;
      
      try {
        // Fetch all communities to check ownership
        const communitiesResponse = await fetch('/api/communities');
        const communitiesData = await communitiesResponse.json();
        
        // Find owned communities
        const ownedCommunities = (communitiesData.communities || []).filter(
          (c: any) => c.owner_id === user.id
        );
        
        // If user owns a community, prioritize it and store it
        if (ownedCommunities.length > 0) {
          const ownedId = ownedCommunities[0].id;
          setSelectedCommunityId(ownedId);
          localStorage.setItem('lastActiveCommunity', ownedId);
          return; // Don't continue with memberships
        }
        
        // Otherwise, use memberships
        const response = await fetch('/api/user/channels');
        const data = await response.json();
        
        const memberCommunities = data.communities || [];
        if (memberCommunities.length > 0) {
          // Only set if no stored community exists
          const stored = localStorage.getItem('lastActiveCommunity');
          if (!stored) {
            const defaultId = memberCommunities[0].community.id;
            setSelectedCommunityId(defaultId);
            localStorage.setItem('lastActiveCommunity', defaultId);
          }
        }
      } catch (error) {
        console.error('Error loading communities:', error);
      }
    }
    
    loadDefaultCommunity();
  }, [user]);

  // Check if user is owner of selected community
  useEffect(() => {
    async function checkOwnership() {
      if (!user || !communityId) {
        setIsOwner(false);
        return;
      }
      
      try {
        // Check directly from the community endpoint
        const response = await fetch(`/api/communities/${communityId}`);
        const data = await response.json();
        
        console.log('Checking ownership for community:', communityId);
        console.log('Community data:', data);
        console.log('User ID:', user.id);
        console.log('Owner ID:', data.community?.owner_id);
        console.log('Membership status:', data.membershipStatus);
        
        // Check if user is the owner - use membershipStatus.isOwner or compare owner_id
        const ownerStatus = data.membershipStatus?.isOwner || data.community?.owner_id === user.id;
        console.log('Is owner:', ownerStatus);
        setIsOwner(ownerStatus);
      } catch (error) {
        console.error('Error checking ownership:', error);
        setIsOwner(false);
      }
    }
    
    checkOwnership();
  }, [user, communityId]);

  // Update selected community when URL changes
  useEffect(() => {
    if (urlCommunityId && urlCommunityId !== 'create') {
      setSelectedCommunityId(urlCommunityId);
      localStorage.setItem('lastSelectedCommunity', urlCommunityId);
    }
  }, [urlCommunityId]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: PieChart, current: currentPath === '/' },
    { name: 'Markets', href: '/markets', icon: TrendingUp, current: currentPath === '/markets' },
    { name: 'Analytics', href: '/analytics', icon: LineChart, current: currentPath === '/analytics' },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, current: currentPath === '/watchlist' },
    { name: 'Community', href: '/community', icon: Video, current: currentPath.startsWith('/community') && !isOnCommunityDetail },
  ];

  // Community-specific tabs
  // If no community is selected, redirect to /community page
  const fallbackHref = '/community';
  const communityTabs = communityId ? [
    ...(isOwner ? [{ name: 'Dashboard', href: `/community/${communityId}/dashboard`, icon: BarChart3, current: urlCommunityId === communityId && communitySubPath === 'dashboard' }] : []),
    { name: 'Videos', href: `/community/${communityId}/videos`, icon: Play, current: urlCommunityId === communityId && communitySubPath === 'videos' },
    { name: 'Chat', href: `/chat`, icon: MessageSquare, current: currentPath === '/chat' },
    { name: 'Members', href: `/community/${communityId}/members`, icon: Users, current: urlCommunityId === communityId && communitySubPath === 'members' },
    { name: 'About', href: `/community/${communityId}/about`, icon: Compass, current: urlCommunityId === communityId && communitySubPath === 'about' },
  ] : [
    // No community selected - all tabs redirect to /community page
    { name: 'Dashboard', href: fallbackHref, icon: BarChart3, current: false },
    { name: 'Videos', href: fallbackHref, icon: Play, current: false },
    { name: 'Chat', href: fallbackHref, icon: MessageSquare, current: false },
    { name: 'Members', href: fallbackHref, icon: Users, current: false },
    { name: 'About', href: fallbackHref, icon: Compass, current: false },
  ];

  console.log('Community ID:', communityId);
  console.log('Is Owner:', isOwner);
  console.log('Community Tabs:', communityTabs);
  const headerNav = [
    { name: 'News', href: '/news', icon: Globe },
    { name: 'Research', href: '/research', icon: Building2 },
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
          className="flex flex-col h-full border-r"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          {/* Logo Section */}
          <div className="flex-shrink-0 px-3 py-3">
            <div className="flex flex-col items-center">
              <Link href="/" className="flex flex-col items-center group">
                <img 
                  src="/pryleaf.PNG" 
                  alt="Pryleaf" 
                  className="h-7 w-auto group-hover:opacity-80 transition-opacity mb-0.5"
                />
                <span className="text-xs font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--interactive-primary)' }}>
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
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 text-xs font-medium ${
                  item.current
                    ? 'shadow-sm'
                    : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: item.current ? 'var(--interactive-primary)' : 'transparent',
                  color: item.current ? 'var(--surface-primary)' : 'var(--text-muted)',
                  border: item.current ? '1px solid var(--interactive-primary)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!item.current) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.current) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <item.icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-center leading-tight">{item.name}</span>
              </Link>
            ))}

            {/* Community Tabs (always shown, redirect to /community if no community selected) */}
            {user && communityTabs.length > 0 && (
              <>
                <div className="pt-2 pb-1">
                  <div 
                    className="text-[10px] font-semibold uppercase tracking-wider text-center px-2"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    Community
                  </div>
                </div>
                {communityTabs.map((tab) => (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 text-xs font-medium ${
                      tab.current
                        ? 'shadow-sm'
                        : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: tab.current ? 'var(--success-background)' : 'transparent',
                      color: tab.current ? 'var(--success-text)' : 'var(--text-muted)',
                      border: tab.current ? '1px solid var(--success-border)' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!tab.current) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tab.current) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
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
            <div className="flex-shrink-0 px-2 py-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-center mb-1" style={{ color: 'var(--text-subtle)' }}>
                  Switch
                </div>
                <CommunityNavigation />
              </div>
            </div>
          )}
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
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Communities Section */}
              {user && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="px-3 mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      My Communities
                    </h3>
                    <Link href="/community">
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        Browse
                      </span>
                    </Link>
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
                  className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                  title={item.name}
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
              {/* Quick Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors" 
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <Link href="/settings" className="p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors" title="Settings">
                <Settings className="h-5 w-5" />
              </Link>
              
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
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
          className="flex-1 overflow-y-auto scrollbar-hidden"
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