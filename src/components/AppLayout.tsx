'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, 
  BarChart3, 
  Menu,
  X,
  MessageSquare,
  Building2,
  Play,
  Zap,
  Users,
  TrendingUp,
  Award,
  UserPlus,
  Palette,
  DollarSign
} from 'lucide-react';
import TickerSearch from '@/components/TickerSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';
import UserMenu from '@/components/UserMenu';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTestOnboarding, setShowTestOnboarding] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { 
    isUserOwner, 
    getCommunityById, 
    selectedCommunityId, 
    setSelectedCommunityId 
  } = useCommunityCache();

  // Get current path for navigation highlighting
  const currentPath = usePathname();

  // Check if we're on a specific community page and store it
  const communityMatch = currentPath.match(/^\/community\/([^\/]+)(?:\/(.+))?$/);
  const urlCommunityId = communityMatch ? communityMatch[1] : null;
  const communitySubPath = communityMatch ? communityMatch[2] : null;
  
  // Use URL community or selected community
  const communityId = urlCommunityId && urlCommunityId !== 'create' ? urlCommunityId : selectedCommunityId;
  
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
    { name: 'Chat', href: '/chat', icon: MessageSquare, current: currentPath === '/chat' },
    { name: 'Research', href: '/research', icon: Building2, current: currentPath === '/research' },
  ];

  // Check if user is owner using cache
  const isOwner = communityId ? isUserOwner(communityId) : false;

  // Community tabs - Only show for owners
  const communityTabs = communityId && isOwner ? [
    { 
      name: 'Dashboard', 
      href: `/community/${communityId}/dashboard`, 
      icon: BarChart3, 
      current: urlCommunityId === communityId && (communitySubPath === 'dashboard' || !communitySubPath)
    },
    { 
      name: 'Library', 
      href: `/community/${communityId}/dashboard/content`, 
      icon: Play, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/content'
    },
    { 
      name: 'Members', 
      href: `/community/${communityId}/dashboard/members`, 
      icon: Users, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/members'
    },
    { 
      name: 'Tiers', 
      href: `/community/${communityId}/dashboard/tiers`, 
      icon: Award, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/tiers'
    },
    { 
      name: 'Earnings', 
      href: `/community/${communityId}/dashboard/earnings`, 
      icon: DollarSign, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/earnings'
    },
    { 
      name: 'Analytics', 
      href: `/community/${communityId}/dashboard/analytics`, 
      icon: TrendingUp, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/analytics'
    },
    { 
      name: 'Invites', 
      href: `/community/${communityId}/dashboard/invites`, 
      icon: UserPlus, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/invites'
    },
    { 
      name: 'Appearance', 
      href: `/community/${communityId}/dashboard/appearance`, 
      icon: Palette, 
      current: urlCommunityId === communityId && communitySubPath === 'dashboard/appearance'
    },
  ] : [];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${mobile ? '' : 'border-r'}`}
      style={{
        backgroundColor: 'var(--surface-sidebar)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Logo Section - Horizontal */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <Link href="/landing" className="flex items-center gap-3 group">
          <Image 
            src="/prylogo.png" 
            alt="Pryleaf" 
            width={32}
            height={32}
            className="group-hover:opacity-80 transition-opacity flex-shrink-0"
          />
          <span 
            className="text-lg font-bold group-hover:opacity-80 transition-opacity"
            style={{ color: 'var(--interactive-primary)' }}
          >
            Pryleaf
          </span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 px-4 pt-2 pb-4">
        <TickerSearch />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all"
            style={{
              backgroundColor: item.current ? 'var(--surface-tertiary)' : 'transparent',
              border: item.current ? '1px solid var(--border-default)' : '1px solid transparent',
              color: 'var(--text-primary)'
            }}
            onClick={mobile ? () => setSidebarOpen(false) : undefined}
            onMouseEnter={(e) => {
              if (!item.current) {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.current) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}

        {/* Community Tabs */}
        {user && communityTabs.length > 0 && (
          <>
            <div 
              className="mx-4 my-3 border-t"
              style={{ borderColor: 'var(--border-default)' }}
            />
            {communityTabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: tab.current ? 'var(--surface-tertiary)' : 'transparent',
                  border: tab.current ? '1px solid var(--border-default)' : '1px solid transparent',
                  color: 'var(--text-primary)'
                }}
                onClick={mobile ? () => setSidebarOpen(false) : undefined}
                onMouseEnter={(e) => {
                  if (!tab.current) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!tab.current) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
              >
                <tab.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{tab.name}</span>
              </Link>
            ))}
          </>
        )}

        {/* Test Buttons - Small at bottom */}
        <div className="mt-auto pt-4">
          <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Test
          </div>
          <button
            onClick={() => setShowTestOnboarding(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-left"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-muted)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Zap className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs">Onboarding</span>
          </button>
        </div>
      </nav>

      {/* Bottom Section - User Menu */}
      {user && (
        <div className="flex-shrink-0">
          <UserMenu />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Test Onboarding Modal */}
      <OnboardingModal 
        isOpen={showTestOnboarding} 
        onClose={() => setShowTestOnboarding(false)} 
      />

      <div
        className="h-screen flex overflow-hidden"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div 
            className="relative flex flex-col max-w-xs w-full h-full"
            style={{ backgroundColor: 'var(--surface-sidebar)' }}
          >
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Minimal top bar - only mobile menu button */}
        <header
          className="md:hidden px-6 py-4 border-b"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <button
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 ${pathname?.startsWith('/symbol/') ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{
            backgroundColor: 'var(--surface-secondary)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {children}
          <style jsx>{`
            main::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </main>
      </div>
    </div>
    </>
  );
}
