'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Grid3x3, List, Search, Filter, SlidersHorizontal, Play, Lock, Eye, Clock } from 'lucide-react';
import VideoUploadModal from './VideoUploadModal';
import VideoDetailsForm, { VideoFormData } from './VideoDetailsForm';

interface VideoLibraryClientProps {
  communityId: string;
  communityName: string;
  communityHandle: string;
  isOwner: boolean;
  userTierLevel: number;
  tiers: Array<{
    id: string;
    name: string;
    tier_level: number;
  }>;
}

interface Video {
  id: string;
  title: string;
  description: string;
  content_url: string;
  thumbnail_url?: string;
  duration?: number;
  views: number;
  likes: number;
  published_at: string;
  minimum_tier_level: number;
  tags: string[];
  creator_id: string;
}

export default function VideoLibraryClient({
  communityId,
  communityName,
  communityHandle,
  isOwner,
  userTierLevel,
  tiers,
}: VideoLibraryClientProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [uploadedVideoData, setUploadedVideoData] = useState<any>(null);

  useEffect(() => {
    fetchVideos();
  }, [sortBy, searchQuery]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/communities/${communityId}/videos?${params}`);
      const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (data: any) => {
    setUploadedVideoData(data);
    setShowUploadModal(false);
    setShowDetailsForm(true);
  };

  const handleDetailsSubmit = async (details: VideoFormData) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          content_url: uploadedVideoData.content_url,
          storage_path: uploadedVideoData.storage_path,
          duration: uploadedVideoData.metadata.duration,
          file_size: uploadedVideoData.metadata.file_size,
          resolution: uploadedVideoData.metadata.resolution,
          original_filename: uploadedVideoData.metadata.original_filename,
        }),
      });

      if (response.ok) {
        setShowDetailsForm(false);
        setUploadedVideoData(null);
        fetchVideos();
      } else {
        alert('Failed to save video details');
      }
    } catch (error) {
      console.error('Error saving video:', error);
      alert('An error occurred while saving the video');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  const canAccessVideo = (video: Video) => {
    return isOwner || video.minimum_tier_level <= userTierLevel;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header */}
      <div className="border-b" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/community/${communityId}`}
            className="inline-flex items-center text-sm mb-4 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--interactive-primary)' }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {communityName}
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <Play className="h-8 w-8" style={{ color: 'var(--interactive-primary)' }} />
                Videos
              </h1>
              <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 interactive-primary"
              >
                <Upload className="h-5 w-5" />
                Upload Video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="border-b" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--border-default)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 rounded transition-colors"
                  style={{
                    backgroundColor: viewMode === 'grid' ? 'var(--interactive-primary)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--surface-primary)' : 'var(--text-muted)'
                  }}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded transition-colors"
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--interactive-primary)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--surface-primary)' : 'var(--text-muted)'
                  }}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--interactive-primary)' }}></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <Play className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No videos yet
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {isOwner
                ? 'Upload your first video to get started!'
                : 'Check back later for new content.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => {
              const hasAccess = canAccessVideo(video);
              return (
                <Link
                  key={video.id}
                  href={hasAccess ? `/community/${communityId}/videos/${video.id}` : '#'}
                  className={`group ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    if (!hasAccess) {
                      e.preventDefault();
                      alert('You need a higher tier membership to access this video');
                    }
                  }                  }
                >
                  <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--surface-primary)' }}>
                    {/* Thumbnail */}
                    <div className="relative aspect-video" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}

                      {/* Lock Icon for Restricted Content */}
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                            <p className="text-white text-sm font-medium">
                              Tier {video.minimum_tier_level}+ Only
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatViews(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTimeAgo(video.published_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => {
              const hasAccess = canAccessVideo(video);
              return (
                <Link
                  key={video.id}
                  href={hasAccess ? `/community/${communityId}/videos/${video.id}` : '#'}
                  className={`group ${!hasAccess ? 'cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    if (!hasAccess) {
                      e.preventDefault();
                      alert('You need a higher tier membership to access this video');
                    }
                  }                  }
                >
                  <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex gap-4 p-4" style={{ backgroundColor: 'var(--surface-primary)' }}>
                    {/* Thumbnail */}
                    <div className="relative w-64 aspect-video rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}

                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:opacity-80 transition-opacity line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {video.title}
                      </h3>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                        {video.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatViews(video.views)} views
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(video.published_at)}</span>
                        {!hasAccess && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1" style={{ color: 'var(--interactive-primary)' }}>
                              <Lock className="h-4 w-4" />
                              Tier {video.minimum_tier_level}+ Only
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <VideoUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          communityId={communityId}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Details Form Modal */}
      {showDetailsForm && uploadedVideoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="max-w-3xl w-full">
            <VideoDetailsForm
              communityId={communityId}
              videoData={uploadedVideoData}
              tiers={tiers}
              onSubmit={handleDetailsSubmit}
              onCancel={() => {
                setShowDetailsForm(false);
                setUploadedVideoData(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

