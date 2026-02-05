'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  Video,
  Image as ImageIcon,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

type ContentFilter = 'all' | 'article' | 'video' | 'resource';

export default function LibraryPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContent();
  }, [communityId]);

  async function fetchContent() {
    try {
      setLoading(true);
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

  const filteredContent = content
    .filter(item => contentFilter === 'all' || item.content_type === contentFilter)
    .filter(item => item.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="px-6 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Library
        </h1>

        {/* Subtle divider line */}
        <div className="mb-6 border-b" style={{ borderColor: 'var(--border-default)' }} />

        {/* Search and Content Type Filters */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative w-80">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setContentFilter('all')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: contentFilter === 'all' ? 'var(--text-primary)' : 'var(--surface-primary)',
                border: contentFilter === 'all' ? 'none' : '1px solid var(--border-default)',
                color: contentFilter === 'all' ? 'var(--surface-primary)' : 'var(--text-primary)'
              }}
            >
              All
            </button>
            <button
              onClick={() => setContentFilter('article')}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: contentFilter === 'article' ? 'var(--text-primary)' : 'var(--surface-primary)',
                border: contentFilter === 'article' ? 'none' : '1px solid var(--border-default)',
                color: contentFilter === 'article' ? 'var(--surface-primary)' : 'var(--text-primary)'
              }}
            >
              <FileText className="h-4 w-4" />
              Posts
            </button>
            <button
              onClick={() => setContentFilter('video')}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: contentFilter === 'video' ? 'var(--text-primary)' : 'var(--surface-primary)',
                border: contentFilter === 'video' ? 'none' : '1px solid var(--border-default)',
                color: contentFilter === 'video' ? 'var(--surface-primary)' : 'var(--text-primary)'
              }}
            >
              <Video className="h-4 w-4" />
              Videos
            </button>
            <button
              onClick={() => setContentFilter('resource')}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: contentFilter === 'resource' ? 'var(--text-primary)' : 'var(--surface-primary)',
                border: contentFilter === 'resource' ? 'none' : '1px solid var(--border-default)',
                color: contentFilter === 'resource' ? 'var(--surface-primary)' : 'var(--text-primary)'
              }}
            >
              <ImageIcon className="h-4 w-4" />
              Images
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-20">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--surface-tertiary)' }}
            >
              <FileText className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No posts yet
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Use your library to keep track of everything you publish. Post an update today to kick things off.
            </p>
            <button
              onClick={() => {
                // TODO: Open create modal
                console.log('Create post');
              }}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--surface-primary)'
              }}
            >
              Create a post
            </button>
            </div>
          ) : (
            <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-default)'
                }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>
                      {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {item.views > 0 && (
                      <>
                        <span>•</span>
                        <span>{item.views} views</span>
                      </>
                    )}
                    {item.likes > 0 && (
                      <>
                        <span>•</span>
                        <span>{item.likes} likes</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg transition-colors ml-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
