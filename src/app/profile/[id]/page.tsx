'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Loader2,
  ArrowLeft,
  Youtube,
  Linkedin,
  Globe,
  Users,
  Video,
  MessageSquare,
  Crown,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  website_url?: string;
  twitter_handle?: string;
  youtube_url?: string;
  linkedin_url?: string;
  location?: string;
  is_public: boolean;
  show_email: boolean;
  total_communities_owned: number;
  total_communities_joined: number;
  total_videos_uploaded: number;
  total_messages_sent: number;
  created_at: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/profile/${profileId}`);
        const data = await response.json();

        if (response.ok) {
          setProfile(data.profile);
          setIsOwnProfile(data.isOwnProfile);
          if (data.user?.email) {
            setUserEmail(data.user.email);
          }
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (error) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="max-w-4xl mx-auto">
          {/* Profile header skeleton */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-64 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center">
          {error === 'This profile is private' ? (
            <>
              <Lock className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Private Profile
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                This user's profile is set to private
              </p>
            </>
          ) : (
            <>
              <User className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Profile not found
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                {error || 'This profile does not exist'}
              </p>
            </>
          )}
          <Link href="/">
            <button className="btn btn-primary">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Banner */}
      <div 
        className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative"
        style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-0">
            <div 
              className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold overflow-hidden"
              style={{ 
                backgroundColor: 'var(--surface-primary)',
                borderColor: 'var(--border-default)'
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16" style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 pb-6 flex justify-end gap-3">
            <Link href="/">
              <button className="btn btn-outline btn-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>
            {isOwnProfile && (
              <Link href="/profile">
                <button className="btn btn-primary btn-sm">
                  Edit Profile
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {profile.display_name || 'Anonymous User'}
              </h1>
              {profile.username && (
                <p className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>
                  @{profile.username}
                </p>
              )}

              {profile.bio && (
                <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                {profile.show_email && userEmail && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Mail className="h-4 w-4" />
                    {userEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(profile.website_url || profile.twitter_handle || profile.youtube_url || profile.linkedin_url) && (
              <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Links
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)'
                      }}
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {profile.twitter_handle && (
                    <a
                      href={`https://x.com/${profile.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)'
                      }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X
                    </a>
                  )}
                  {profile.youtube_url && (
                    <a
                      href={profile.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)'
                      }}
                    >
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)'
                      }}
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-6">
            {/* Member Since */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Member Since
              </h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {new Date(profile.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

