'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { UserPlus, Copy, Trash2, Loader2, Check, Link as LinkIcon, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Invite {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_by: string;
}

export default function CommunityInvitesPage() {
  const params = useParams();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, [communityId]);

  async function fetchInvites() {
    try {
      const response = await fetch(`/api/communities/${communityId}/invites`);
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInvite() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        await fetchInvites();
      }
    } catch (error) {
      console.error('Error generating invite:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    try {
      const response = await fetch(`/api/communities/${communityId}/invites/${inviteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setInvites(invites.filter(i => i.id !== inviteId));
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  }

  function copyInviteLink(code: string) {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Invite Links
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Generate and manage invite links for your community
            </p>
          </div>
          <button
            onClick={generateInvite}
            disabled={generating}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--interactive-primary)',
              color: 'white'
            }}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Generate Link
          </button>
        </div>

        {/* Invites List */}
        {invites.length === 0 ? (
          <div 
            className="rounded-lg p-12 text-center border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <LinkIcon className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No invite links yet
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              Generate your first invite link to start inviting members.
            </p>
            <button
              onClick={generateInvite}
              disabled={generating}
              className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--interactive-primary)',
                color: 'white'
              }}
            >
              {generating ? 'Generating...' : 'Generate First Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-lg p-4 border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <code 
                      className="text-sm font-mono px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--surface-tertiary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {invite.code}
                    </code>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {invite.use_count} {invite.max_uses ? `/ ${invite.max_uses}` : ''} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(invite.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {window.location.origin}/invite/{invite.code}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => copyInviteLink(invite.code)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: copiedCode === invite.code ? 'var(--success-bg)' : 'var(--surface-tertiary)',
                      color: copiedCode === invite.code ? 'var(--success-text)' : 'var(--text-primary)',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    {copiedCode === invite.code ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Delete invite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
