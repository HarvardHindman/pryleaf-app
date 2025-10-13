'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle,
  Users,
  ArrowLeft,
  Lock,
  Loader2,
  Crown,
  Image as ImageIcon,
  Heart,
  Share2,
  MoreHorizontal,
  Send,
  UserPlus,
  Settings,
  Play,
  Check,
  FileText,
  Video as VideoIcon
} from 'lucide-react';
import type { Community, CommunityTier } from '@/lib/communityService';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);
  const [tiers, setTiers] = useState<CommunityTier[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [joiningTierId, setJoiningTierId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunityDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/communities/${communityId}`);
        const data = await response.json();
        
        setCommunity(data.community);
        setTiers(data.tiers || []);
        setMembershipStatus(data.membershipStatus);
      } catch (error) {
        console.error('Error fetching community details:', error);
      } finally {
        setLoading(false);
      }
    }

    if (communityId) {
      fetchCommunityDetails();
    }
  }, [communityId]);

  const handleJoinTier = async (tierId: string, priceCents: number) => {
    if (!tierId) return;

    try {
      setJoiningTierId(tierId);
      
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (priceCents === 0) {
          // Free tier - reload page to show updated status
          window.location.reload();
        } else {
          // Paid tier - redirect to Stripe checkout (when implemented)
          alert(data.message || 'Payment integration coming soon!');
        }
      } else {
        alert(data.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community');
    } finally {
      setJoiningTierId(null);
    }
  };

  const getTierBadgeClass = (tierLevel: number) => {
    if (tierLevel === 0) return 'tier-badge tier-badge-free';
    if (tierLevel === 1) return 'tier-badge tier-badge-premium';
    return 'tier-badge tier-badge-elite';
  };

  const renderFeedContent = () => {
    const isMember = membershipStatus?.isMember;
    const isOwner = membershipStatus?.isOwner;

    // If not a member, show join prompt
    if (!isMember) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Lock className="h-16 w-16 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Join to Access the Feed
          </h3>
          <p className="text-center mb-6" style={{ color: 'var(--text-muted)' }}>
            Become a member to access exclusive posts and content.
          </p>
          <Link href={`/community/${communityId}/about`}>
            <button className="btn btn-primary btn-lg">
              View Membership Options
            </button>
          </Link>
        </div>
      );
    }

    return <FeedTab communityId={communityId} isOwner={isOwner} />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Community not found
          </h2>
          <Link href="/community">
            <button className="btn btn-primary mt-4">
              Browse Communities
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isMember = membershipStatus?.isMember;
  const isOwner = membershipStatus?.isOwner;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Banner */}
      {community.banner_url && (
        <div 
          className="w-full h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${community.banner_url})` }}
        />
      )}

      {/* Header */}
      <div 
        className="border-b px-4 md:px-8 py-6"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Link href="/community">
            <button className="btn btn-ghost btn-sm mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Communities
            </button>
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="community-avatar" style={{ width: '6rem', height: '6rem', fontSize: '3rem' }}>
              {community.avatar_url ? (
                <img src={community.avatar_url} alt={community.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{community.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {community.name}
                </h1>
                {community.verified && (
                  <CheckCircle className="h-6 w-6 verified-badge" />
                )}
                {isOwner && (
                  <Link href={`/community/${communityId}/dashboard`}>
                    <button className="btn btn-sm btn-ghost ml-auto">
                      <Settings className="h-4 w-4" />
                      Dashboard
                    </button>
                  </Link>
                )}
              </div>
              <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>
                @{community.handle}
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={getTierBadgeClass(1)}>
                  {community.specialty}
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Users className="h-4 w-4" />
                  {community.subscriber_count.toLocaleString()} members
                </span>
              </div>
              <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
                {community.description}
              </p>

              {/* Membership Status */}
              {membershipStatus && (
                <div className="flex items-center gap-3">
                  {isMember ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--success-background)', color: 'var(--success-text)' }}>
                      <Check className="h-4 w-4" />
                      <span className="font-semibold">Member</span>
                      {isOwner && (
                        <Crown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('about')}
                      className="btn btn-primary"
                    >
                      <UserPlus className="h-4 w-4" />
                      Join Community
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {renderFeedContent()}
      </div>
    </div>
  );
}


// Feed Tab Component
function FeedTab({ communityId, isOwner }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [communityId]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!newPostText.trim()) return;

    try {
      setPosting(true);
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostText,
          type: 'text'
        })
      });

      if (response.ok) {
        setNewPostText('');
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Create Post (Owner/Creator Only) */}
      {isOwner && (
        <div 
          className="p-6 rounded-lg border mb-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Share something with your community..."
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              minHeight: '120px'
            }}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm">
                <ImageIcon className="h-4 w-4" />
                Image
              </button>
              <button className="btn btn-ghost btn-sm">
                <VideoIcon className="h-4 w-4" />
                Video
              </button>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={posting || !newPostText.trim()}
              className="btn btn-primary"
            >
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No posts yet
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {isOwner ? 'Share your first post with the community!' : 'Check back soon for new content.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

// Post Card Component
function PostCard({ post }: any) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-background)' }}>
            <Crown className="h-5 w-5" style={{ color: 'var(--info-text)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Creator
              <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--info-background)', color: 'var(--info-text)' }}>
                Owner
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {new Date(post.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
          {post.content || post.title}
        </p>
        {post.media_url && (
          <div className="mt-4 rounded-lg overflow-hidden">
            {post.type === 'video' ? (
              <video controls className="w-full">
                <source src={post.media_url} />
              </video>
            ) : (
              <img src={post.media_url} alt="Post" className="w-full" />
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm ${liked ? 'text-red-500' : ''}`}
          style={{ color: liked ? '#ef4444' : 'var(--text-muted)' }}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
          {likes}
        </button>
        <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <MessageSquare className="h-5 w-5" />
          {post.comments || 0}
        </button>
        <button className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>
    </div>
  );
}

