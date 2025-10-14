'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Upload,
  Video as VideoIcon,
  Image as ImageIcon,
  FileText,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  Lock,
  Loader2,
  X,
  Check,
  Crown,
  Play
} from 'lucide-react';

type ContentType = 'all' | 'post' | 'video' | 'image' | 'file';

export default function ContentManagementPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadType, setUploadType] = useState<'video' | 'post' | 'image'>('post');

  useEffect(() => {
    fetchContent();
  }, [communityId]);

  async function fetchContent() {
    try {
      const response = await fetch(`/api/communities/${communityId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredContent = filter === 'all' 
    ? content 
    : content.filter(item => item.type === filter);

  const stats = {
    total: content.length,
    posts: content.filter(c => c.type === 'post').length,
    videos: content.filter(c => c.type === 'video').length,
    images: content.filter(c => c.media_url && c.type !== 'video').length,
    totalViews: content.reduce((sum, c) => sum + (c.view_count || 0), 0),
    totalLikes: content.reduce((sum, c) => sum + (c.likes || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Content Library
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage your community posts, videos, and media
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUploadType('video');
              setShowCreateModal(true);
            }}
            className="btn btn-outline"
          >
            <VideoIcon className="h-4 w-4" />
            Upload Video
          </button>
          <button
            onClick={() => {
              setUploadType('post');
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Content"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={VideoIcon}
          label="Videos"
          value={stats.videos}
          color="purple"
        />
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={stats.totalLikes.toLocaleString()}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All Content"
          count={stats.total}
        />
        <FilterButton
          active={filter === 'post'}
          onClick={() => setFilter('post')}
          label="Posts"
          count={stats.posts}
          icon={FileText}
        />
        <FilterButton
          active={filter === 'video'}
          onClick={() => setFilter('video')}
          label="Videos"
          count={stats.videos}
          icon={VideoIcon}
        />
        <FilterButton
          active={filter === 'image'}
          onClick={() => setFilter('image')}
          label="Images"
          count={stats.images}
          icon={ImageIcon}
        />
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div 
          className="text-center py-16 rounded-lg"
          style={{ backgroundColor: 'var(--surface-primary)' }}
        >
          <Upload className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No content yet
          </h3>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Start creating content to engage with your community
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onEdit={() => {/* Handle edit */}}
              onDelete={async () => {
                if (confirm('Delete this content?')) {
                  // TODO: Delete content
                  await fetchContent();
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Upload Modal */}
      {showCreateModal && (
        <ContentUploadModal
          type={uploadType}
          communityId={communityId}
          onClose={() => setShowCreateModal(false)}
          onSave={async () => {
            await fetchContent();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap = {
    blue: 'info',
    purple: 'info',
    green: 'success',
    red: 'danger'
  };

  const bgColor = colorMap[color as keyof typeof colorMap] || 'info';

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `var(--${bgColor}-background)` }}
        >
          <Icon className="h-4 w-4" style={{ color: `var(--${bgColor}-text)` }} />
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function FilterButton({ active, onClick, label, count, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
        active ? 'btn-primary' : 'btn-outline'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
      <span className="text-xs opacity-75">({count})</span>
    </button>
  );
}

function ContentCard({ content, onEdit, onDelete }: any) {
  const isVideo = content.type === 'video';
  const hasMedia = content.media_url;

  return (
    <div 
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Thumbnail/Preview */}
      <div 
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        {hasMedia ? (
          <>
            {isVideo ? (
              <>
                <video 
                  src={content.media_url} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </>
            ) : (
              <img 
                src={content.media_url} 
                alt={content.title}
                className="w-full h-full object-cover"
              />
            )}
          </>
        ) : (
          <FileText className="h-16 w-16" style={{ color: 'var(--text-muted)' }} />
        )}
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span 
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ 
              backgroundColor: isVideo ? 'var(--info-background)' : 'var(--surface-primary)',
              color: isVideo ? 'var(--info-text)' : 'var(--text-primary)'
            }}
          >
            {isVideo ? 'Video' : 'Post'}
          </span>
        </div>

        {/* Tier Badge */}
        {content.required_tier_level > 0 && (
          <div className="absolute top-2 right-2">
            <span 
              className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: 'var(--warning-background)', color: 'var(--warning-text)' }}
            >
              <Crown className="h-3 w-3" />
              Tier {content.required_tier_level}+
            </span>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {content.title || 'Untitled'}
        </h3>
        
        {content.content && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {content.content}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {content.view_count || 0}
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {content.likes || 0}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {content.comments || 0}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          <Calendar className="h-3 w-3" />
          {new Date(content.created_at || Date.now()).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={onEdit} className="btn btn-outline btn-sm flex-1">
            <Edit className="h-3 w-3" />
            Edit
          </button>
          <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentUploadModal({ type, communityId, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: type,
    media_url: '',
    required_tier_level: 0,
    schedule_at: '',
    is_pinned: false
  });

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let mediaUrl = formData.media_url;

      // If file selected, upload it first
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('communityId', communityId);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mediaUrl = uploadData.url;
        }
      }

      // Create post/content
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          media_url: mediaUrl
        })
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {type === 'video' ? 'Upload Video' : 'Create Post'}
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give your content a catchy title"
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {type === 'video' ? 'Description' : 'Content'} *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={type === 'video' ? 'Describe your video...' : 'Share your thoughts...'}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border resize-none"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* File Upload */}
          {type === 'video' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Video File *
              </label>
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                style={{ borderColor: 'var(--border-default)' }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                {file ? (
                  <div>
                    <VideoIcon className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--success-text)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>Click to upload video</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      MP4, MOV, or AVI (max 500MB)
                    </p>
                  </div>
                )}
              </div>
              <p 
                className="mt-4 p-3 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}
              >
                <strong>Note:</strong> Video upload requires file storage service (Supabase Storage, Cloudflare R2, etc.)
              </p>
            </div>
          )}

          {/* Access Control */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Who can access this?
            </label>
            <select
              value={formData.required_tier_level}
              onChange={(e) => setFormData({ ...formData, required_tier_level: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <option value={0}>All Members (Free+)</option>
              <option value={1}>Standard Tier+</option>
              <option value={2}>Premium Tier+</option>
              <option value={3}>Elite Tier Only</option>
            </select>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.schedule_at}
              onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Leave empty to publish immediately
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="w-4 h-4"
              />
              <span style={{ color: 'var(--text-primary)' }}>
                Pin to top of feed
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {type === 'video' ? 'Uploading...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {formData.schedule_at ? 'Schedule' : 'Publish Now'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



