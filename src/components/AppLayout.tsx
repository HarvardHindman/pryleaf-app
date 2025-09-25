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
  DollarSign,
  Globe,
  Building2,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TickerSearch from '@/components/TickerSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const navigation = [
    { name: 'Dashboard', href: '/', icon: PieChart, current: currentPath === '/' },
    { name: 'Markets', href: '/markets', icon: TrendingUp, current: currentPath === '/markets' },
    { name: 'Portfolio', href: '/portfolio', icon: DollarSign, current: currentPath === '/portfolio' },
    { name: 'Analytics', href: '/analytics', icon: LineChart, current: currentPath === '/analytics' },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, current: currentPath === '/watchlist' },
    { name: 'Chat', href: '/chat', icon: MessageSquare, current: currentPath === '/chat' },
  ];
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
      <div className="hidden md:flex md:w-40 md:flex-col">
        <div
          className="flex flex-col h-full border-r"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          {/* Logo Section */}
          <div className="flex-shrink-0 px-3 py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <img 
                  src="/pryleaf.PNG" 
                  alt="Pryleaf" 
                  className="h-7 w-auto group-hover:opacity-80 transition-opacity mr-2"
                />
                <span className="text-base font-bold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--clr-primary-a40)' }}>
                  Pryleaf
                </span>
              </Link>
            </div>
          </div>

          {/* Main Navigation - Investment Tools */}
          <nav className="flex-1 px-2 py-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  item.current
                    ? 'shadow-sm'
                    : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: item.current ? 'var(--info-background)' : 'transparent',
                  color: item.current ? 'var(--info-text)' : 'var(--text-muted)',
                  border: item.current ? '1px solid var(--info-border)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!item.current) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
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
                <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Server Selection - Bottom Section */}
          <div className="flex-shrink-0 px-2 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="space-y-2">
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Server
              </div>
              
              {/* Current Server */}
              <div className="flex items-center px-2 py-1.5 rounded-md text-sm" style={{
                backgroundColor: 'var(--info-background)',
                color: 'var(--info-text)',
                border: '1px solid var(--info-border)'
              }}>
                <Server className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Pryleaf</span>
              </div>

              {/* Add Server */}
              <button 
                className="flex items-center w-full px-2 py-1.5 rounded-md text-sm transition-all duration-200 border border-dashed hover:border-solid"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border-subtle)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Join Server</span>
              </button>
            </div>
          </div>
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
              
              {/* Mobile Server Section */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Community Server
                  </h3>
                </div>
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <Server className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Pryleaf Community</span>
                </div>
                <button className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                  <Plus className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Join Server</span>
                </button>
              </div>
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