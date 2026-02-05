'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Crown,
  Search,
  Loader2,
  Settings,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        const response = await fetch(`/api/communities/${communityId}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId) {
      fetchMembers();
    }
  }, [communityId]);

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Members ({members.length})
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage your community members and their roles
            </p>
          </div>
          
          <Link href={`/community/${communityId}/dashboard/tiers`}>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--surface-tertiary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <Award className="h-4 w-4" />
              Manage Tiers
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div 
            className="rounded-lg p-12 text-center border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {searchQuery ? 'No members found' : 'No members yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {searchQuery ? 'Try adjusting your search' : 'Invite members to join your community'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="p-4 rounded-lg border hover:shadow-sm transition-shadow"
                style={{ 
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ 
                      backgroundColor: 'var(--surface-tertiary)',
                      color: 'var(--interactive-primary)'
                    }}
                  >
                    {member.name?.charAt(0) || member.username?.charAt(0) || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                      {member.name || member.username || 'Member'}
                    </div>
                    {member.username && (
                      <div className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>
                        @{member.username}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ 
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {member.tier_name || 'Free'}
                      </span>
                      {member.tier_level > 0 && (
                        <Crown className="h-3 w-3" style={{ color: 'var(--interactive-primary)' }} />
                      )}
                    </div>
                  </div>
                  <button
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Member settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                {/* Member Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2" style={{ borderColor: 'var(--border-default)' }}>
                  <div>
                    <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      Messages
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {member.total_messages_sent || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      Content Viewed
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {member.total_content_viewed || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
