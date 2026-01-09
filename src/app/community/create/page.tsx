'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  Loader2,
  Lightbulb
} from 'lucide-react';

const categories = [
  'Options Trading',
  'Technical Analysis',
  'Value Investing',
  'Crypto & DeFi',
  'Day Trading',
  'Swing Trading',
  'Market Analysis',
  'Other'
];

export default function CreateCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    specialty: '',
    category: categories[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate handle from name if handle is empty
    if (name === 'name' && !formData.handle) {
      const autoHandle = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
      setFormData(prev => ({ ...prev, handle: autoHandle }));
    }

    // Auto-set specialty from name if empty
    if (name === 'name' && !formData.specialty) {
      setFormData(prev => ({ ...prev, specialty: value }));
    }
  };

  const validate = () => {
    if (!formData.name || !formData.handle || !formData.description) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Validate handle format
    const handleRegex = /^[a-z0-9_-]+$/;
    if (!handleRegex.test(formData.handle)) {
      setError('Handle can only contain lowercase letters, numbers, hyphens, and underscores');
      return false;
    }

    if (formData.handle.length < 3) {
      setError('Handle must be at least 3 characters');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create community');
      }

      // Success! Redirect to the new community dashboard
      router.push(`/community/${data.community.id}?created=true`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header */}
      <div 
        className="border-b px-8 py-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <button className="btn btn-ghost btn-sm mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard to Communities
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--info-background)' }}
            >
              <Lightbulb className="h-6 w-6" style={{ color: 'var(--info-text)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Create Your Community
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Get started in less than a minute. Add details later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Info Box */}
          <div 
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--info-background)',
              borderColor: 'var(--info-border)',
              color: 'var(--info-text)'
            }}
          >
            <p className="text-sm">
              <strong>What happens next:</strong> We'll create your community with a free tier and default chat channels. You can customize tiers, pricing, and settings anytime from your dashboard.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--danger-background)',
                borderColor: 'var(--danger-border)',
                color: 'var(--danger-text)'
              }}
            >
              {error}
            </div>
          )}

          {/* Simple Form */}
          <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Community Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Sarah's Options Trading Academy"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface-primary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                  maxLength={100}
                  required
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  This is how your community will be displayed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Handle * <span style={{ color: 'var(--text-muted)' }}>(@{formData.handle || 'yourhandle'})</span>
                </label>
                <input
                  type="text"
                  name="handle"
                  value={formData.handle}
                  onChange={handleChange}
                  placeholder="yourhandle"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface-primary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                  pattern="[a-z0-9_-]+"
                  maxLength={30}
                  required
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Lowercase letters, numbers, hyphens, and underscores only
                </p>
              </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe what your community is about..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                maxLength={200}
                required
              />
              <p className="mt-1 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                {formData.description.length}/200
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Choose the category that best fits your community
              </p>
            </div>

            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--success-background)',
                borderColor: 'var(--success-border)',
                color: 'var(--success-text)'
              }}
            >
              <p className="text-sm font-medium mb-2">✨ What you'll get:</p>
              <ul className="text-sm space-y-1">
                <li>• Free tier created automatically</li>
                <li>• Chat channels (#announcements, #general)</li>
                <li>• Full creator dashboard access</li>
                <li>• Add paid tiers anytime</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Your Community...
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  Create Community
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

