'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Share2, MoreVertical, Eye, Clock, Play, Lock, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoPlayerClientProps {
  video: any;
  communityId: string;
  communityName: string;
  communityHandle: string;
  isOwner: boolean;
  userId?: string;
  relatedVideos: any[];
  userTierLevel: number;
}

export default function VideoPlayerClient({
  video,
  communityId,
  communityName,
  communityHandle,
  isOwner,
  userId,
  relatedVideos,
  userTierLevel,
}: VideoPlayerClientProps) {
  const [liked, setLiked] = useState(video.hasLiked || false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Track view on mount
  useEffect(() => {
    if (userId) {
      trackView();
    }
  }, [userId]);

  // Track watch progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !userId) return;

    let watchStartTime = Date.now();
    let lastUpdate = Date.now();

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) { // Update every 10 seconds
        const watchDuration = Math.floor((now - watchStartTime) / 1000);
        const completionPercentage = Math.floor((video.currentTime / video.duration) * 100);
        
        updateViewProgress(watchDuration, completionPercentage);
        lastUpdate = now;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [userId]);

  const trackView = async () => {
    try {
      await fetch(`/api/communities/${communityId}/videos/${video.id}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const updateViewProgress = async (watchDuration: number, completionPercentage: number) => {
    try {
      await fetch(`/api/communities/${communityId}/videos/${video.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchDuration, completionPercentage }),
      });
    } catch (error) {
      console.error('Failed to update view progress:', error);
    }
  };

  const handleLike = async () => {
    if (!userId) {
      alert('Please sign in to like videos');
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/videos/${video.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: video.title,
        text: video.description,
        url: url,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/videos/${video.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/community/${communityId}/videos`);
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('An error occurred while deleting the video');
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  };

  const canAccessRelatedVideo = (relatedVideo: any) => {
    return isOwner || relatedVideo.minimum_tier_level <= userTierLevel;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Link */}
        <Link
          href={`/community/${communityId}/videos`}
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Videos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={video.content_url}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {video.title}
              </h1>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatViews(video.views)} views
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTimeAgo(video.published_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      liked
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{likeCount}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="font-medium">Share</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="font-medium">Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Community Info */}
              <div className="flex items-center gap-3 py-4 border-t border-b border-gray-200 dark:border-gray-700">
                <Link
                  href={`/community/${communityId}`}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {communityName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {communityName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{communityHandle}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Description */}
              <div className="mt-4">
                <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${
                  !showFullDescription && video.description.length > 300 ? 'line-clamp-3' : ''
                }`}>
                  {video.description}
                </p>
                {video.description.length > 300 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium mt-2"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {video.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                More Videos
              </h2>

              {relatedVideos.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                  No more videos available
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedVideos.map((relatedVideo) => {
                    const hasAccess = canAccessRelatedVideo(relatedVideo);
                    return (
                      <Link
                        key={relatedVideo.id}
                        href={hasAccess ? `/community/${communityId}/videos/${relatedVideo.id}` : '#'}
                        className={`group block ${!hasAccess ? 'cursor-not-allowed opacity-60' : ''}`}
                        onClick={(e) => {
                          if (!hasAccess) {
                            e.preventDefault();
                            alert('You need a higher tier membership to access this video');
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="relative w-40 aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            {relatedVideo.thumbnail_url ? (
                              <img
                                src={relatedVideo.thumbnail_url}
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-6 w-6 text-gray-400" />
                              </div>
                            )}

                            {!hasAccess && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Lock className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                              {relatedVideo.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatViews(relatedVideo.views)} views
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatTimeAgo(relatedVideo.published_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

