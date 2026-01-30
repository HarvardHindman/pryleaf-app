'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Crown, X, ArrowRight, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityCTABanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { dismissOnboarding } = useAuth();
  const router = useRouter();

  const handleDismiss = async () => {
    setIsDismissed(true);
    await dismissOnboarding();
  };

  const handleJoinInvite = () => {
    router.push('/invite');
  };

  const handleCreate = () => {
    router.push('/community/create');
  };

  if (isDismissed) return null;

  return (
    <div 
      className="relative rounded-xl p-6 shadow-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
        backgroundColor: 'var(--surface-secondary)',
        border: '1px solid var(--border-default)'
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Icon */}
        <div 
          className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--interactive-bg-muted)' }}
        >
          <Users 
            className="h-8 w-8"
            style={{ color: 'var(--interactive-primary)' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Join or Create a Community
          </h3>
          <p 
            className="text-sm mb-4 md:mb-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            Have an invite code? Join a community to connect with investors, or create your own to build your following.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleJoinInvite}
            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-md"
            style={{ 
              backgroundColor: 'var(--interactive-primary)',
              color: 'white'
            }}
          >
            <Link2 className="h-4 w-4" />
            Join via Invite
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)'
            }}
          >
            <Crown className="h-4 w-4" />
            Create Community
          </button>
        </div>
      </div>
    </div>
  );
}
