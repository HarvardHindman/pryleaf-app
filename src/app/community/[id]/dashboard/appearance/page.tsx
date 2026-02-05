'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Palette, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface CommunityAppearance {
  name: string;
  avatar_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
}

export default function CommunityAppearancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [community, setCommunity] = useState<CommunityAppearance | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);

  useEffect(() => {
    fetchCommunity();
  }, [communityId]);

  async function fetchCommunity() {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity({
          name: data.community.name,
          avatar_url: data.community.avatar_url,
          banner_url: data.community.banner_url,
          theme_color: data.community.theme_color
        });
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(type: 'avatar' | 'banner', file: File) {
    setUploading(type);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`/api/communities/${communityId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCommunity(prev => prev ? {
          ...prev,
          [type === 'avatar' ? 'avatar_url' : 'banner_url']: data.url
        } : null);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setUploading(null);
    }
  }

  async function removeImage(type: 'avatar' | 'banner') {
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type === 'avatar' ? 'avatar_url' : 'banner_url']: null
        })
      });

      if (response.ok) {
        setCommunity(prev => prev ? {
          ...prev,
          [type === 'avatar' ? 'avatar_url' : 'banner_url']: null
        } : null);
      }
    } catch (error) {
      console.error(`Error removing ${type}:`, error);
    }
  }

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Community not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Appearance
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Customize your community's visual identity
          </p>
        </div>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Community Avatar
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Recommended size: 512x512px
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {community.avatar_url ? (
                <div className="relative">
                  <Image
                    src={community.avatar_url}
                    alt={community.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removeImage('avatar')}
                    className="absolute -top-2 -right-2 p-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--surface-primary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <ImageIcon className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('avatar', file);
                  }}
                  disabled={uploading === 'avatar'}
                />
                <div
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-tertiary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {uploading === 'avatar' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading === 'avatar' ? 'Uploading...' : 'Upload Avatar'}
                </div>
              </label>
            </div>
          </div>

          {/* Banner Upload */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Community Banner
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Recommended size: 1920x400px
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {community.banner_url ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden">
                  <Image
                    src={community.banner_url}
                    alt={`${community.name} banner`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage('banner')}
                    className="absolute top-2 right-2 p-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--surface-primary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-full h-40 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface-tertiary)' }}
                >
                  <ImageIcon className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}

              <label className="cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('banner', file);
                  }}
                  disabled={uploading === 'banner'}
                />
                <div
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit"
                  style={{
                    backgroundColor: 'var(--surface-tertiary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {uploading === 'banner' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading === 'banner' ? 'Uploading...' : 'Upload Banner'}
                </div>
              </label>
            </div>
          </div>

          {/* Theme Color (Future Enhancement) */}
          <div 
            className="rounded-lg p-6 border opacity-50"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Theme Color
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Coming soon: Customize your community's primary color
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
