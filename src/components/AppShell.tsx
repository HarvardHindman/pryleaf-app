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

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For auth routes, show without the main app layout
  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  // For all other routes, wrap with the main app layout
  return <AppLayout>{children}</AppLayout>;
}
