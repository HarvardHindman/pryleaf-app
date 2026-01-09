'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Crown,
  Link2,
  ExternalLink,
  Play,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

interface InviteData {
  valid: boolean;
  error?: string;
  invite?: {
    id: string;
    code: string;
    name: string | null;
    expiresAt: string | null;
    usesRemaining: number | null;
  };
  community?: {
    id: string;
    name: string;
    handle: string;
    description: string;
    avatar_url: string | null;
    banner_url: string | null;
    specialty: string;
    category: string;
    subscriber_count: number;
    verified: boolean;
  };
  tier?: {
    id: string;
    name: string;
    tier_level: number;
    price_monthly: number;
  } | null;
  userStatus?: {
    isAuthenticated: boolean;
    isMember: boolean;
    membershipStatus: string | null;
  };
}

export default function InviteCodePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { invalidateCache } = useCommunityCache();
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const code = params.code as string;

  useEffect(() => {
    async function fetchInviteData() {
      try {
        const response = await fetch(`/api/invite/${code}`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Invalid invite');
          setInviteData({ valid: false, error: data.error });
        } else {
          setInviteData(data);
        }
      } catch (err) {
        setError('Failed to load invite');
        setInviteData({ valid: false, error: 'Failed to load invite' });
      } finally {
        setLoading(false);
      }
    }

    fetchInviteData();
  }, [code]);

  const handleAcceptInvite = async () => {
    if (!user) {
      router.push(`/login?returnTo=/invite/${code}`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/invite/${code}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to join community');
        setJoining(false);
        return;
      }

      setSuccess(true);
      invalidateCache('all');
      
      setTimeout(() => {
        router.push(`/community/${inviteData?.community?.id}`);
      }, 2000);
    } catch (err) {
      setError('Failed to join community');
      setJoining(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div 
        className="min-h-full flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ background: 'var(--interactive-primary)' }}
          />
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)'
            }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Loading invite...</p>
        </div>
      </div>
    );
  }

  // Invalid Invite State
  if (!inviteData?.valid || !inviteData.community) {
    return (
      <div 
        className="min-h-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
            style={{ background: 'var(--error-text)' }}
          />
        </div>
        <div className="w-full max-w-md text-center relative z-10">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ backgroundColor: 'var(--error-background)' }}
          >
            <AlertCircle className="h-10 w-10" style={{ color: 'var(--error-text)' }} />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Invite Not Found
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
            {inviteData?.error || error || 'This invite link is invalid or has expired.'}
          </p>
          <Link href="/invite">
            <button 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)',
                color: 'white',
                boxShadow: '0 10px 40px -10px var(--interactive-primary)'
              }}
            >
              <Link2 className="h-5 w-5" />
              Try Another Code
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div 
        className="min-h-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--success-text)' }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--interactive-primary)' }}
          />
        </div>
        <div className="w-full max-w-md text-center relative z-10">
          <div className="relative inline-block mb-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--success-background) 0%, rgba(34, 197, 94, 0.2) 100%)',
                boxShadow: '0 0 60px rgba(34, 197, 94, 0.4)'
              }}
            >
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Welcome to {inviteData.community.name}!
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
            You've successfully joined the community.
          </p>
          <div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-default)' }}
          >
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Redirecting to community...</span>
          </div>
        </div>
      </div>
    );
  }

  const { community, tier, invite, userStatus } = inviteData;

  return (
    <div 
      className="min-h-full px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--interactive-primary)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--interactive-primary)' }}
        />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Invite Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ 
              background: 'linear-gradient(135deg, var(--interactive-bg-muted) 0%, rgba(59, 130, 246, 0.1) 100%)',
              color: 'var(--interactive-primary)',
              border: '1px solid var(--interactive-primary)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <Link2 className="h-4 w-4" />
            {invite?.name || 'Exclusive Invite'}
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            You've been invited
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            Join an exclusive community
          </p>
        </div>

        {/* Community Card */}
        <div 
          className="rounded-2xl overflow-hidden mb-6 transition-transform hover:scale-[1.01]"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 20px 60px -20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Banner */}
          <div className="relative">
            {community.banner_url ? (
              <div 
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${community.banner_url})` }}
              />
            ) : (
              <div 
                className="h-36 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)'
                }}
              >
                {/* Pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }}
                />
              </div>
            )}
            
            {/* Avatar positioned on banner edge */}
            <div className="absolute -bottom-12 left-6">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden ring-4"
                style={{ 
                  backgroundColor: 'var(--surface-primary)',
                  ringColor: 'var(--surface-primary)'
                }}
              >
                {community.avatar_url ? (
                  <img 
                    src={community.avatar_url} 
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ color: 'var(--interactive-primary)' }}>
                    {community.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-16 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {community.name}
                  </h2>
                  {community.verified && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  @{community.handle}
                </p>
              </div>
            </div>

            <p className="mb-5" style={{ color: 'var(--text-secondary)' }}>
              {community.description}
            </p>

            {/* Stats & Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              >
                <Users className="h-4 w-4" style={{ color: 'var(--interactive-primary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>
                  {community.subscriber_count.toLocaleString()} members
                </span>
              </div>
              <div 
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ 
                  background: 'linear-gradient(135deg, var(--info-background) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  color: 'var(--info-text)'
                }}
              >
                {community.specialty}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Play, label: 'Videos' },
                { icon: MessageSquare, label: 'Chat' },
                { icon: TrendingUp, label: 'Insights' }
              ].map(({ icon: Icon, label }) => (
                <div 
                  key={label}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--surface-secondary)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tier being granted */}
            {tier && (
              <div 
                className="flex items-center gap-4 p-4 rounded-xl mb-5"
                style={{ 
                  background: 'linear-gradient(135deg, var(--warning-background) 0%, rgba(234, 179, 8, 0.05) 100%)',
                  border: '1px solid rgba(234, 179, 8, 0.2)'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                >
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {tier.name} Tier Access
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {tier.price_monthly === 0 ? 'Free membership included' : `Valued at $${tier.price_monthly / 100}/month`}
                  </p>
                </div>
              </div>
            )}

            {/* Invite metadata */}
            {(invite?.expiresAt || invite?.usesRemaining !== null) && (
              <div 
                className="flex flex-wrap gap-4 text-sm p-3 rounded-xl"
                style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-muted)' }}
              >
                {invite?.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                )}
                {invite?.usesRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {invite.usesRemaining} spots left
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="flex items-center gap-3 px-4 py-4 rounded-xl text-sm mb-4"
            style={{ 
              backgroundColor: 'var(--error-background)',
              color: 'var(--error-text)',
              border: '1px solid var(--error-border)'
            }}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Already a member */}
        {userStatus?.isMember ? (
          <div 
            className="text-center p-8 rounded-2xl"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--success-background)' }}
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              You're already a member!
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              You have access to this community
            </p>
            <Link href={`/community/${community.id}`}>
              <button 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)',
                  color: 'white',
                  boxShadow: '0 10px 40px -10px var(--interactive-primary)'
                }}
              >
                Go to Community
                <ExternalLink className="h-5 w-5" />
              </button>
            </Link>
          </div>
        ) : (
          /* Action Buttons */
          <div className="space-y-4">
            <button
              onClick={handleAcceptInvite}
              disabled={joining}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--interactive-primary) 0%, var(--interactive-hover) 100%)',
                color: 'white',
                boxShadow: '0 10px 40px -10px var(--interactive-primary)'
              }}
            >
              {joining ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Joining community...
                </>
              ) : user ? (
                <>
                  Accept Invite & Join
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  Sign in to Join
                  <ArrowRight className="h-6 w-6" />
                </>
              )}
            </button>

            {!user && (
              <div className="text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Don't have an account?{' '}
                  <Link 
                    href={`/register?returnTo=/invite/${code}`}
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--interactive-primary)' }}
                  >
                    Create one for free
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
