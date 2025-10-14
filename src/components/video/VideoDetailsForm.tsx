'use client';

import { useState, useRef } from 'react';
import { X, Upload, Calendar, Lock, Unlock, Image as ImageIcon, Tag, Loader, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface VideoDetailsFormProps {
  communityId: string;
  videoData: {
    storage_path: string;
    content_url: string;
    metadata: {
      duration?: number;
      file_size?: number;
      resolution?: string;
      original_filename?: string;
    };
  };
  tiers: Array<{
    id: string;
    name: string;
    tier_level: number;
  }>;
  onSubmit: (details: VideoFormData) => void;
  onCancel: () => void;
}

export interface VideoFormData {
  title: string;
  description: string;
  thumbnail_url?: string;
  minimum_tier_level: number;
  tags: string[];
  category?: string;
  is_published: boolean;
  scheduled_publish_at?: string;
}

export default function VideoDetailsForm({
  communityId,
  videoData,
  tiers,
  onSubmit,
  onCancel,
}: VideoDetailsFormProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    thumbnail_url: undefined,
    minimum_tier_level: 0,
    tags: [],
    category: undefined,
    is_published: true,
    scheduled_publish_at: undefined,
  });

  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailUrl = formData.thumbnail_url;

      // Upload custom thumbnail if selected
      if (customThumbnail) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const timestamp = Date.now();
        const ext = customThumbnail.name.split('.').pop();
        const filePath = `${communityId}/thumbnails/${timestamp}.${ext}`;

        const { data, error } = await supabase.storage
          .from('community-videos')
          .upload(filePath, customThumbnail);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('community-videos')
          .getPublicUrl(data.path);

        thumbnailUrl = urlData.publicUrl;
      }

      // Determine publishing settings
      let is_published = true;
      let scheduled_publish_at = undefined;

      if (publishMode === 'draft') {
        is_published = false;
      } else if (publishMode === 'schedule') {
        is_published = false;
        scheduled_publish_at = formData.scheduled_publish_at;
      }

      onSubmit({
        ...formData,
        thumbnail_url: thumbnailUrl,
        is_published,
        scheduled_publish_at,
      });
    } catch (error) {
      console.error('Error submitting video details:', error);
      alert('Failed to save video details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Video Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add information about your video
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a compelling title for your video"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your video is about..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thumbnail
            </label>
            <div className="space-y-3">
              {thumbnailPreview ? (
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomThumbnail(null);
                      setThumbnailPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <ImageIcon className="h-12 w-12" />
                  <span className="text-sm font-medium">Upload Custom Thumbnail</span>
                  <span className="text-xs">Recommended: 1280x720 (16:9)</span>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tags (e.g., Tutorial, Trading, Options)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Tag className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Access Level
            </label>
            <div className="space-y-2">
              {tiers.map((tier) => (
                <label
                  key={tier.id}
                  className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier.tier_level}
                    checked={formData.minimum_tier_level === tier.tier_level}
                    onChange={() => setFormData({ ...formData, minimum_tier_level: tier.tier_level })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    {tier.tier_level === 0 ? (
                      <Unlock className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tier.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Publishing Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Publishing
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="publish"
                  checked={publishMode === 'now'}
                  onChange={() => setPublishMode('now')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  Publish Now
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="publish"
                  checked={publishMode === 'schedule'}
                  onChange={() => setPublishMode('schedule')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Schedule for Later
                  </span>
                  {publishMode === 'schedule' && (
                    <input
                      type="datetime-local"
                      value={formData.scheduled_publish_at || ''}
                      onChange={(e) => setFormData({ ...formData, scheduled_publish_at: e.target.value })}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white text-sm"
                      required={publishMode === 'schedule'}
                    />
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="publish"
                  checked={publishMode === 'draft'}
                  onChange={() => setPublishMode('draft')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  Save as Draft
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {publishMode === 'now' ? 'Publish Video' : publishMode === 'schedule' ? 'Schedule Video' : 'Save Draft'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

