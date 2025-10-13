'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Hash,
  Lock,
  Unlock,
  Users,
  Settings,
  Shield,
  MessageSquare,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Loader2,
  Check,
  X,
  Crown
} from 'lucide-react';

export default function ChatSettingsPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);

  useEffect(() => {
    fetchChannels();
  }, [communityId]);

  async function fetchChannels() {
    try {
      const response = await fetch(`/api/communities/${communityId}/channels`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Chat Channels
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage your community chat channels and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Create Channel
        </button>
      </div>

      {/* Info Card */}
      <div 
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--info-background)',
          borderColor: 'var(--info-border)'
        }}
      >
        <p className="text-sm" style={{ color: 'var(--info-text)' }}>
          <strong>💡 Tip:</strong> Channels are automatically synced with member tiers. Members can only access channels for their tier level and below.
        </p>
      </div>

      {/* Channels List */}
      <div className="space-y-3">
        {channels.length === 0 ? (
          <div 
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: 'var(--surface-primary)' }}
          >
            <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No channels yet
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              Create your first channel to start chatting with your community
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Create First Channel
            </button>
          </div>
        ) : (
          channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={() => setEditingChannel(channel)}
              onDelete={async () => {
                if (confirm(`Delete channel #${channel.name}?`)) {
                  // TODO: Delete channel
                  await fetchChannels();
                }
              }}
            />
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingChannel) && (
        <ChannelEditorModal
          channel={editingChannel}
          communityId={communityId}
          onClose={() => {
            setShowCreateModal(false);
            setEditingChannel(null);
          }}
          onSave={async () => {
            await fetchChannels();
            setShowCreateModal(false);
            setEditingChannel(null);
          }}
        />
      )}
    </div>
  );
}

function ChannelCard({ channel, onEdit, onDelete }: any) {
  const [settings, setSettings] = useState({
    slowMode: channel.settings?.slowMode || false,
    membersOnly: channel.settings?.membersOnly || true,
    notifications: channel.settings?.notifications !== false
  });

  const getTierBadge = (level: number) => {
    if (level === 0) return { text: 'All Members', color: 'info' };
    if (level === 1) return { text: 'Standard+', color: 'success' };
    if (level === 2) return { text: 'Premium+', color: 'warning' };
    return { text: 'Elite Only', color: 'danger' };
  };

  const tierBadge = getTierBadge(channel.required_tier_level || 0);

  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-start justify-between">
        {/* Channel Info */}
        <div className="flex items-start gap-4 flex-1">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--surface-secondary)' }}
          >
            <Hash className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                #{channel.name}
              </h3>
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: `var(--${tierBadge.color}-background)`,
                  color: `var(--${tierBadge.color}-text)`
                }}
              >
                {tierBadge.text}
              </span>
              {channel.type === 'announcement' && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--warning-background)', color: 'var(--warning-text)' }}
                >
                  Announcement
                </span>
              )}
            </div>

            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              {channel.description || 'No description'}
            </p>

            {/* Quick Settings */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {channel.member_count || 0} members
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSettings({ ...settings, slowMode: !settings.slowMode })}
                  className={`flex items-center gap-2 text-sm ${settings.slowMode ? 'text-blue-500' : ''}`}
                  style={{ color: settings.slowMode ? 'var(--info-text)' : 'var(--text-muted)' }}
                >
                  <Shield className="h-4 w-4" />
                  Slow Mode
                </button>

                <button
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  className={`flex items-center gap-2 text-sm ${settings.notifications ? 'text-blue-500' : ''}`}
                  style={{ color: settings.notifications ? 'var(--info-text)' : 'var(--text-muted)' }}
                >
                  {settings.notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  Notifications
                </button>

                {channel.type === 'announcement' ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Lock className="h-4 w-4" />
                    Read-Only
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Unlock className="h-4 w-4" />
                    Open Chat
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-ghost btn-sm">
            <Edit className="h-4 w-4" />
          </button>
          {channel.name !== 'general' && channel.name !== 'announcements' && (
            <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelEditorModal({ channel, communityId, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: channel?.name || '',
    description: channel?.description || '',
    type: channel?.type || 'text',
    required_tier_level: channel?.required_tier_level || 0,
    is_public: channel?.is_public !== false,
    settings: {
      slowMode: channel?.settings?.slowMode || false,
      slowModeInterval: channel?.settings?.slowModeInterval || 5,
      membersOnly: channel?.settings?.membersOnly !== false,
      allowReactions: channel?.settings?.allowReactions !== false,
      allowThreads: channel?.settings?.allowThreads !== false,
      readOnly: channel?.type === 'announcement'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/communities/${communityId}/channels`, {
        method: channel ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: channel?.id,
          name: formData.name.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving channel:', error);
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
              {channel ? 'Edit Channel' : 'Create Channel'}
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Channel Name *
              </label>
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="general, trading-alerts, premium"
                  pattern="[a-z0-9-]+"
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this channel for?"
                rows={2}
                className="w-full px-4 py-2 rounded-lg border resize-none"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Channel Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Channel Type
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'text', settings: { ...formData.settings, readOnly: false } })}
                className={`p-4 rounded-lg border text-left ${formData.type === 'text' ? 'border-blue-500' : ''}`}
                style={{
                  backgroundColor: formData.type === 'text' ? 'var(--info-background)' : 'var(--surface-secondary)',
                  borderColor: formData.type === 'text' ? 'var(--info-border)' : 'var(--border-default)'
                }}
              >
                <MessageSquare className="h-5 w-5 mb-2" style={{ color: 'var(--text-primary)' }} />
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Text Channel</div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Regular chat channel</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'announcement', settings: { ...formData.settings, readOnly: true } })}
                className={`p-4 rounded-lg border text-left ${formData.type === 'announcement' ? 'border-blue-500' : ''}`}
                style={{
                  backgroundColor: formData.type === 'announcement' ? 'var(--info-background)' : 'var(--surface-secondary)',
                  borderColor: formData.type === 'announcement' ? 'var(--info-border)' : 'var(--border-default)'
                }}
              >
                <Crown className="h-5 w-5 mb-2" style={{ color: 'var(--text-primary)' }} />
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Announcement</div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner-only posting</p>
              </button>
            </div>
          </div>

          {/* Access Control */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Access Control
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Minimum Tier Level
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
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Channel Settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.slowMode}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, slowMode: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Slow Mode
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Limit how often members can send messages
                  </p>
                </div>
              </label>

              {formData.settings.slowMode && (
                <div className="ml-7">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.settings.slowModeInterval}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, slowModeInterval: parseInt(e.target.value) }
                    })}
                    className="w-32 px-3 py-1 rounded border text-sm"
                    style={{
                      backgroundColor: 'var(--surface-secondary)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>seconds</span>
                </div>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.allowReactions}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowReactions: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Allow Reactions
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Members can react to messages with emojis
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.settings.allowThreads}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowThreads: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Allow Threads
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Members can create threaded conversations
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              <Check className="h-4 w-4" />
              {channel ? 'Save Changes' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

