'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from './AppLayout';

interface AppShellProps {
  children: React.ReactNode;
}

// Routes that should not show the main app layout (e.g., login, register, landing)
const AUTH_ROUTES = ['/login', '/register', '/landing'];

// Routes that need authentication but show a different layout (if any)
const SPECIAL_ROUTES: string[] = [];

/**
 * Layout skeleton shown during auth loading.
 * Shows the sidebar and header structure so there's no flash when content loads.
 */
function LayoutSkeleton() {
  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Sidebar skeleton */}
      <div className="hidden md:flex md:w-28 md:flex-col" style={{ backgroundColor: 'var(--surface-sidebar)' }}>
        <div className="flex flex-col h-full">
          {/* Logo skeleton */}
          <div className="flex-shrink-0 px-3 py-4">
            <div className="flex flex-col items-center">
              <div className="h-6 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
          {/* Nav skeleton */}
          <nav className="flex-1 px-2 py-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center px-2 py-2 rounded-lg">
                <div className="h-5 w-5 rounded animate-pulse mb-1" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="h-3 w-12 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header skeleton */}
        <header className="px-6 py-4" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-6 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              ))}
            </div>
            <div className="flex-1 max-w-lg mx-4">
              <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-8 w-8 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Show layout skeleton while auth is being determined
  // This keeps the layout structure visible to prevent flash
  if (loading) {
    return <LayoutSkeleton />;
  }

  // For auth routes, show without the main app layout
  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  // For all other routes, wrap with the main app layout
  return <AppLayout>{children}</AppLayout>;
}
