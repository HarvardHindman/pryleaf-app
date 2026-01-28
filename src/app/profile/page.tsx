'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Link as LinkIcon, 
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Youtube,
  Linkedin,
  Globe,
  Shield,
  Bell,
  Users,
  Video,
  MessageSquare,
  Crown
} from 'lucide-react';
import Link from 'next/link';

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
  timezone?: string;
  is_public: boolean;
  show_email: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  total_communities_owned: number;
  total_communities_joined: number;
  total_videos_uploaded: number;
  total_messages_sent: number;
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        setFormData(data.profile);
      } else {
        showMessage('error', data.error || 'Failed to load profile');
      }
    } catch (error) {
      showMessage('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setEditMode(false);
        showMessage('success', 'Profile updated successfully!');
      } else {
        showMessage('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(profile || {});
    setEditMode(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null);
        showMessage('success', 'Avatar updated successfully!');
      } else {
        showMessage('error', data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      showMessage('error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Password changed successfully!');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', data.error || 'Failed to change password');
      }
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Please log in
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            You need to be logged in to view your profile
          </p>
          <Link href="/login">
            <button className="btn btn-primary">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
                <div className="h-6 w-32 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Banner */}
      <div 
        className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative"
        style={{ backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-0">
            <div className="relative">
              <div 
                className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-16 w-16" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full transition-colors"
                style={{
                  backgroundColor: 'var(--interactive-primary)',
                  color: 'var(--surface-primary)'
                }}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 pb-6 flex justify-end gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="btn btn-outline"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="btn btn-outline"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-start gap-3"
            style={{
              backgroundColor: message.type === 'success' ? 'var(--success-background)' : 'var(--danger-background)',
              color: message.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
              border: `1px solid ${message.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
            }}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Profile Information
              </h2>

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Display Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.display_name || ''}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                      maxLength={50}
                      placeholder="Your display name"
                    />
                  ) : (
                    <p style={{ color: 'var(--text-primary)' }}>{profile?.display_name || 'Not set'}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Username
                  </label>
                  {editMode ? (
                    <div>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                        className="w-full px-4 py-2 border rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)'
                        }}
                        maxLength={30}
                        placeholder="username"
                        pattern="[a-z0-9_]+"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                        3-30 characters, lowercase letters, numbers, and underscores only
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-primary)' }}>
                      {profile?.username ? `@${profile.username}` : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Bio
                  </label>
                  {editMode ? (
                    <div>
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg resize-none"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)'
                        }}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell us about yourself..."
                      />
                      <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-subtle)' }}>
                        {formData.bio?.length || 0}/500
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-primary)' }}>{profile?.bio || 'No bio yet'}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Location
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="City, Country"
                    />
                  ) : profile?.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-primary)' }}>{profile.location}</p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Not set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links Card */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Social Links
              </h2>

              <div className="space-y-4">
                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Globe className="h-4 w-4" />
                    Website
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      value={formData.website_url || ''}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="https://yourwebsite.com"
                    />
                  ) : profile?.website_url ? (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--interactive-primary)' }}>
                      {profile.website_url}
                    </a>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Not set</p>
                  )}
                </div>

                {/* X (Twitter) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </label>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-muted)' }}>@</span>
                      <input
                        type="text"
                        value={formData.twitter_handle || ''}
                        onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="username"
                      />
                    </div>
                  ) : profile?.twitter_handle ? (
                    <a href={`https://x.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--interactive-primary)' }}>
                      @{profile.twitter_handle}
                    </a>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Not set</p>
                  )}
                </div>

                {/* YouTube */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      value={formData.youtube_url || ''}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="https://youtube.com/@username"
                    />
                  ) : profile?.youtube_url ? (
                    <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--interactive-primary)' }}>
                      {profile.youtube_url}
                    </a>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Not set</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : profile?.linkedin_url ? (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--interactive-primary)' }}>
                      {profile.linkedin_url}
                    </a>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Not set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lock className="h-5 w-5" />
                Security
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Password</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {showPasswordForm ? 'Change your password' : 'Last changed recently'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn btn-outline btn-sm"
                  >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border rounded-lg"
                          style={{
                            backgroundColor: 'var(--surface-secondary)',
                            borderColor: 'var(--border-default)',
                            color: 'var(--text-primary)'
                          }}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Eye className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border rounded-lg"
                          style={{
                            backgroundColor: 'var(--surface-secondary)',
                            borderColor: 'var(--border-default)',
                            color: 'var(--text-primary)'
                          }}
                          placeholder="Enter new password"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Eye className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border rounded-lg"
                          style={{
                            backgroundColor: 'var(--surface-secondary)',
                            borderColor: 'var(--border-default)',
                            color: 'var(--text-primary)'
                          }}
                          placeholder="Confirm new password"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Eye className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="btn btn-primary w-full"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy & Preferences */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Shield className="h-5 w-5" />
                Privacy & Preferences
              </h2>

              <div className="space-y-4">
                {/* Public Profile */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Public Profile</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Allow others to view your profile
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editMode ? formData.is_public : profile?.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      disabled={!editMode}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Show Email */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Email</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Display email on public profile
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editMode ? formData.show_email : profile?.show_email}
                      onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                      disabled={!editMode}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Receive email updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editMode ? formData.email_notifications : profile?.email_notifications}
                      onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                      disabled={!editMode}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Receive push notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editMode ? formData.push_notifications : profile?.push_notifications}
                      onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                      disabled={!editMode}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Account Info
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>Member Since</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {profile?.username && (
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>Profile URL</p>
                    <p className="text-sm mt-1 break-all" style={{ color: 'var(--interactive-primary)' }}>
                      /profile/{profile.username}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

