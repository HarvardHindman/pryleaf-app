'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, Hash, Plus, Loader2, Send, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function CommunityChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const { isUserOwner } = useCommunityCache();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const isOwner = isUserOwner(communityId);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const response = await fetch(`/api/communities/${communityId}`);
        if (response.ok) {
          const data = await response.json();
          setCommunity(data.community);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId) {
      fetchCommunity();
    }
  }, [communityId]);

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Chat channels sidebar */}
      <div 
        className="w-64 border-r flex flex-col"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MessageSquare className="h-4 w-4" />
            Channels
          </h2>
          {isOwner && (
            <button
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Channel Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div 
            className="p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            style={{ 
              backgroundColor: 'var(--surface-tertiary)',
              color: 'var(--text-primary)'
            }}
          >
            <Hash className="h-4 w-4" />
            <span className="text-sm font-medium">general</span>
          </div>
        </div>

        {isOwner && (
          <div className="p-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button
              className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <Plus className="h-3 w-3" />
              Add Channel
            </button>
          </div>
        )}
      </div>

      {/* Chat messages area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b" style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}>
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              general
            </h2>
            <span className="text-xs px-2 py-0.5 rounded" style={{ 
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text-muted)'
            }}>
              {community?.name}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Chat Coming Soon
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Real-time chat will be available soon. This is where you'll connect with community members.
            </p>
          </div>
        </div>

        <div className="p-4 border-t" style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              disabled
              className="flex-1 px-4 py-2.5 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--surface-tertiary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                opacity: 0.5
              }}
            />
            <button
              disabled
              className="px-4 py-2.5 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--interactive-primary)',
                color: 'white',
                opacity: 0.5
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
