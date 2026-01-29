'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="text-center max-w-md px-6">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Chat Coming Soon
        </h1>
        <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
          We're building a new chat experience powered by Supabase Realtime.
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Real-time messaging, community channels, and more will be available soon!
        </p>
      </div>
    </div>
  );
}
