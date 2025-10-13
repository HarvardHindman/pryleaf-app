'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Users, Calendar, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityMembersPage() {
  const params = useParams();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAccessAndFetchMembers() {
      try {
        // Check membership first
        const communityResponse = await fetch(`/api/communities/${communityId}`);
        const communityData = await communityResponse.json();
        
        if (communityData.membershipStatus?.isMember) {
          setHasAccess(true);
          
          // Fetch members
          const membersResponse = await fetch(`/api/communities/${communityId}/members`);
          if (membersResponse.ok) {
            const data = await membersResponse.json();
            setMembers(data.members || []);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      checkAccessAndFetchMembers();
    } else {
      setLoading(false);
    }
  }, [communityId, user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center px-4">
          <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Members Only
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Join this community to see the member directory
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Members ({members.length})
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Connect with other community members
          </p>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No members yet
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Be the first to join!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                    style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}
                  >
                    {member.name?.[0] || member.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {member.name || 'Member'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {member.tier_name || 'Free'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(member.joined_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

