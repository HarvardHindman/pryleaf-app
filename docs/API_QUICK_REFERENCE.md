# API Quick Reference

Quick reference for all community platform API endpoints.

## Communities

### List All Communities
```typescript
GET /api/communities
Query params: ?category=Options&verified=true&search=sarah

Response: {
  communities: Community[]
}
```

### Get Community Details
```typescript
GET /api/communities/[id]

Response: {
  community: Community,
  tiers: CommunityTier[],
  membershipStatus?: {
    isMember: boolean,
    currentTier?: CommunityTier,
    status?: MembershipStatus
  }
}
```

### Create Community
```typescript
POST /api/communities
Auth: Required (creator)

Body: {
  name: string,
  handle: string,
  description: string,
  specialty: string,
  category: string
}

Response: { community: Community }
```

### Update Community
```typescript
PATCH /api/communities/[id]
Auth: Required (owner only)

Body: Partial<Community>

Response: { community: Community }
```

## Tiers

### Get Community Tiers
```typescript
GET /api/communities/[id]/tiers

Response: { tiers: CommunityTier[] }
```

### Create Tier
```typescript
POST /api/communities/[id]/tiers
Auth: Required (owner only)

Body: {
  name: string,
  description: string,
  price_monthly: number, // in cents
  tier_level: number,
  features: TierFeature[],
  perks: string[]
}

Response: { tier: CommunityTier }
```

## Memberships

### Join Community
```typescript
POST /api/communities/[id]/join
Auth: Required

Body: {
  tierId: string
}

Response: {
  membership?: CommunityMembership,  // if free tier
  checkoutUrl?: string,              // if paid tier
  sessionId?: string                 // Stripe session ID
}
```

### Get User Memberships
```typescript
GET /api/user/memberships
Auth: Required

Response: {
  memberships: (CommunityMembership & {
    community: Community,
    tier: CommunityTier
  })[]
}
```

### Upgrade/Downgrade Tier
```typescript
PATCH /api/communities/[id]/membership
Auth: Required

Body: {
  newTierId: string
}

Response: {
  membership?: CommunityMembership,
  checkoutUrl?: string
}
```

### Cancel Membership
```typescript
DELETE /api/communities/[id]/membership
Auth: Required

Response: {
  membership: CommunityMembership,
  message: "Membership cancelled. Access until [date]"
}
```

## Channels

### Get Accessible Channels
```typescript
GET /api/communities/[id]/channels
Auth: Required

Response: {
  channels: CommunityChannel[],
  userTierLevel: number
}
```

### Create Channel
```typescript
POST /api/communities/[id]/channels
Auth: Required (owner only)

Body: {
  name: string,
  description?: string,
  minimum_tier_level: number,
  channel_type: ChannelType
}

Response: {
  channel: CommunityChannel,
  streamChannel: StreamChannel
}
```

## Content

### Get Community Content
```typescript
GET /api/communities/[id]/content
Query params: ?type=video&tier_level=1

Response: {
  content: CommunityContent[],
  userTierLevel: number
}
```

### Get Single Content
```typescript
GET /api/communities/[id]/content/[contentId]
Auth: Required

Response: {
  content: CommunityContent,
  hasAccess: boolean,
  requiredTier?: CommunityTier,
  signedUrl?: string // if has access
}
```

### Upload Content
```typescript
POST /api/communities/[id]/content
Auth: Required (owner only)

Body: FormData {
  title: string,
  description: string,
  content_type: ContentType,
  file: File,
  minimum_tier_level: number,
  thumbnail?: File
}

Response: {
  content: CommunityContent,
  uploadUrl: string
}
```

### Track Content View
```typescript
POST /api/communities/[id]/content/[contentId]/view
Auth: Required

Body: {
  watch_duration: number,
  completion_percentage: number
}

Response: {
  view: ContentView
}
```

## Payments

### Create Checkout Session
```typescript
POST /api/stripe/checkout
Auth: Required

Body: {
  communityId: string,
  tierId: string,
  billingInterval: 'monthly' | 'yearly'
}

Response: {
  sessionId: string,
  url: string // Redirect to Stripe Checkout
}
```

### Create Customer Portal
```typescript
POST /api/stripe/portal
Auth: Required

Body: {
  communityId: string
}

Response: {
  url: string // Redirect to Stripe Portal
}
```

### Webhook Handler
```typescript
POST /api/stripe/webhook
Headers: stripe-signature

Events handled:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
- charge.refunded

Response: { received: true }
```

## Analytics (Creator Only)

### Get Community Analytics
```typescript
GET /api/communities/[id]/analytics
Auth: Required (owner only)
Query: ?period=30d

Response: {
  overview: {
    totalRevenue: number,
    monthlyRevenue: number,
    totalMembers: number,
    membersByTier: Record<string, number>,
    growthRate: number
  },
  engagement: {
    activeMembers: number,
    messagesSent: number,
    contentViews: number,
    avgWatchTime: number
  },
  topContent: CommunityContent[],
  recentMembers: CommunityMembership[]
}
```

## Helper Utilities

### Check Access
```typescript
// Server-side utility
export async function checkAccess(
  userId: string,
  communityId: string,
  requiredTierLevel: number
): Promise<boolean>

// Usage in API routes
const hasAccess = await checkAccess(user.id, communityId, 1);
if (!hasAccess) {
  return NextResponse.json(
    { error: 'Insufficient tier level' },
    { status: 403 }
  );
}
```

### Get User Tier Level
```typescript
// Server-side utility
export async function getUserTierLevel(
  userId: string,
  communityId: string
): Promise<number>

// Returns:
// -1: Not a member
// 0: Free tier
// 1+: Paid tier level
// 999: Community owner
```

## Error Responses

All endpoints return errors in this format:

```typescript
{
  error: string,           // Human-readable error message
  code?: string,          // Error code (e.g., 'INSUFFICIENT_TIER')
  details?: any           // Additional context
}
```

Common status codes:
- `400` - Bad request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (e.g., duplicate membership)
- `500` - Internal server error

## Rate Limiting

Consider implementing rate limiting:

```typescript
// Example with upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// In API route
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

## Testing

### Example Test Cases

```typescript
// Jest/Vitest example
describe('POST /api/communities', () => {
  it('creates community for authenticated user', async () => {
    const response = await fetch('/api/communities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Community',
        handle: 'testcom',
        description: 'A test community',
        specialty: 'Testing',
        category: 'Other'
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.community.id).toBeDefined();
  });
  
  it('rejects unauthenticated requests', async () => {
    const response = await fetch('/api/communities', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(401);
  });
});
```

## Next.js App Router Patterns

### Server Component Data Fetching

```typescript
// app/community/[id]/page.tsx
export default async function CommunityPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServerClient();
  
  const { data: community } = await supabase
    .from('communities')
    .select('*, tiers:community_tiers(*)')
    .eq('id', params.id)
    .single();
  
  return <CommunityProfile community={community} />;
}
```

### Client Component with React Query

```typescript
// components/CommunityList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function CommunityList() {
  const { data, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const res = await fetch('/api/communities');
      return res.json();
    }
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {data.communities.map(community => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}
```

## WebSocket / Realtime (Future)

For real-time updates without polling:

```typescript
// Using Supabase Realtime
const channel = supabase
  .channel('community_updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'community_memberships',
      filter: `community_id=eq.${communityId}`
    },
    (payload) => {
      console.log('New member joined!', payload);
      // Update UI
    }
  )
  .subscribe();
```

---

This API structure provides a solid foundation for your community platform. Implement endpoints incrementally, starting with the most critical paths (community listing, joining, content access).

