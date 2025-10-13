# Community Platform - Technical Specification

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Models](#data-models)
3. [API Design](#api-design)
4. [Access Control Logic](#access-control-logic)
5. [User Flows](#user-flows)
6. [State Management](#state-management)
7. [Edge Cases](#edge-cases)
8. [Migration Strategy](#migration-strategy)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Community   │  │   Creator    │  │  Subscriber  │      │
│  │   Browser    │  │  Dashboard   │  │    Portal    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼───────┐
        │  Next.js API   │      │  Supabase    │
        │    Routes      │◄─────┤   Database   │
        └───────┬────────┘      └──────────────┘
                │
        ┌───────┴────────┬──────────────┬─────────────┐
        │                │              │             │
    ┌───▼────┐    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
    │ Stream │    │  Stripe   │  │Supabase │  │  Resend   │
    │  Chat  │    │  Payment  │  │ Storage │  │   Email   │
    └────────┘    └───────────┘  └─────────┘  └───────────┘
```

### Component Breakdown

#### Frontend Components
```
src/app/
├── community/
│   ├── page.tsx                    # Community discovery/browse
│   ├── [communityId]/
│   │   ├── page.tsx                # Individual community home
│   │   ├── chat/
│   │   │   └── [channelId]/page.tsx # Channel chat view
│   │   ├── content/
│   │   │   ├── page.tsx            # Content library
│   │   │   └── [contentId]/page.tsx # Video/content player
│   │   ├── members/page.tsx        # Member directory
│   │   └── settings/page.tsx       # Community settings (creator only)
│   └── create/page.tsx             # Create new community

src/components/
├── community/
│   ├── CommunityCard.tsx           # Community preview card
│   ├── CommunityHeader.tsx         # Banner, logo, stats
│   ├── TierSelector.tsx            # Tier selection/pricing
│   ├── ChannelList.tsx             # Sidebar channel list
│   ├── ContentCard.tsx             # Video/content preview
│   ├── MembershipBadge.tsx         # User tier indicator
│   ├── CreatorDashboard/
│   │   ├── Analytics.tsx           # Revenue, engagement stats
│   │   ├── TierManagement.tsx      # Configure pricing tiers
│   │   ├── ChannelManager.tsx      # Create/manage channels
│   │   ├── ContentUploader.tsx     # Upload videos/content
│   │   └── MemberList.tsx          # Manage members
│   └── subscription/
│       ├── CheckoutModal.tsx       # Stripe checkout flow
│       ├── SubscriptionManager.tsx # Manage active subs
│       └── PaymentHistory.tsx      # Transaction history
```

---

## Data Models

### Comprehensive Schema with Relationships

```typescript
// Type definitions for all entities

interface Community {
  id: string;
  owner_id: string;
  name: string;
  handle: string; // @handle, unique
  description: string;
  long_description?: string; // Markdown supported
  avatar_url?: string;
  banner_url?: string;
  specialty: string; // e.g., "Options Trading"
  category: CommunityCategory;
  verified: boolean;
  subscriber_count: number;
  total_revenue: number; // Lifetime revenue
  status: 'active' | 'paused' | 'archived';
  settings: CommunitySettings;
  created_at: Date;
  updated_at: Date;
}

type CommunityCategory = 
  | 'Options Trading'
  | 'Technical Analysis'
  | 'Value Investing'
  | 'Crypto & DeFi'
  | 'Day Trading'
  | 'Swing Trading'
  | 'Market Analysis'
  | 'Other';

interface CommunitySettings {
  auto_accept_members: boolean;
  allow_member_invites: boolean;
  show_member_count: boolean;
  require_email_verification: boolean;
  moderation_enabled: boolean;
  welcome_message?: string;
}

interface CommunityTier {
  id: string;
  community_id: string;
  name: string; // "Free", "Premium", "Elite"
  description: string;
  price_monthly: number; // In cents (e.g., 4900 = $49.00)
  price_yearly?: number; // Optional annual pricing (with discount)
  tier_level: number; // 0 = free, 1-5 = paid tiers
  features: TierFeature[];
  perks: string[]; // List of benefits
  max_members?: number; // Optional capacity limit
  stripe_price_id?: string; // Stripe Price ID for subscriptions
  is_active: boolean;
  sort_order: number; // Display order
  created_at: Date;
  updated_at: Date;
}

interface TierFeature {
  name: string;
  description: string;
  enabled: boolean;
  icon?: string;
}

interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  tier_id: string;
  status: MembershipStatus;
  
  // Subscription details
  subscribed_at: Date;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  cancelled_at?: Date;
  
  // Payment integration
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  
  // Engagement tracking
  last_active_at?: Date;
  total_messages_sent: number;
  total_content_viewed: number;
  
  created_at: Date;
  updated_at: Date;
}

type MembershipStatus = 
  | 'active'      // Active subscription
  | 'cancelled'   // Cancelled but still has access until period end
  | 'expired'     // Subscription ended
  | 'paused'      // Payment failed, grace period
  | 'pending';    // Awaiting payment confirmation

interface CommunityChannel {
  id: string;
  community_id: string;
  stream_channel_id: string; // Stream Chat channel ID
  name: string; // "general", "premium-chat", "elite-lounge"
  description?: string;
  minimum_tier_level: number; // Required tier to access
  channel_type: ChannelType;
  is_announcement_only: boolean; // Only creator can post
  is_active: boolean;
  sort_order: number;
  
  // Moderation settings
  slow_mode_duration?: number; // Seconds between messages
  message_retention_days?: number; // Auto-delete old messages
  
  created_at: Date;
  updated_at: Date;
}

type ChannelType = 
  | 'text'         // Regular text chat
  | 'announcement' // One-way announcements
  | 'voice'        // Voice channel (future)
  | 'live';        // Live streaming (future)

interface CommunityContent {
  id: string;
  community_id: string;
  creator_id: string;
  
  // Content details
  title: string;
  description: string;
  content_type: ContentType;
  content_url: string; // URL to video/article
  thumbnail_url?: string;
  
  // Access control
  minimum_tier_level: number;
  is_published: boolean;
  published_at?: Date;
  scheduled_publish_at?: Date;
  
  // Media details
  duration?: number; // Seconds (for video)
  file_size?: number; // Bytes
  
  // Engagement metrics
  views: number;
  unique_views: number;
  likes: number;
  comments_count: number;
  
  // SEO
  tags: string[];
  category?: string;
  
  created_at: Date;
  updated_at: Date;
}

type ContentType = 
  | 'video'
  | 'article'
  | 'trading_signal'
  | 'resource'
  | 'live_session'
  | 'course';

interface ContentView {
  id: string;
  content_id: string;
  user_id: string;
  community_id: string;
  
  // Viewing details
  watch_duration: number; // Seconds watched
  completion_percentage: number;
  device_type: 'desktop' | 'mobile' | 'tablet';
  
  created_at: Date;
}

interface Payment {
  id: string;
  user_id: string;
  community_id: string;
  tier_id: string;
  
  // Payment details
  amount: number; // In cents
  currency: string; // 'usd', 'eur', etc.
  status: PaymentStatus;
  
  // Integration
  payment_provider: 'stripe';
  provider_payment_id: string; // Stripe Payment Intent ID
  provider_subscription_id?: string; // Stripe Subscription ID
  
  // Metadata
  description: string;
  receipt_url?: string;
  
  created_at: Date;
  updated_at: Date;
}

type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

interface CreatorPayout {
  id: string;
  creator_id: string;
  community_id: string;
  
  // Payout details
  amount: number; // In cents
  currency: string;
  status: PayoutStatus;
  
  // Period
  period_start: Date;
  period_end: Date;
  
  // Calculations
  total_revenue: number; // Gross revenue
  platform_fee: number; // Pryleaf's cut
  processing_fee: number; // Stripe fees
  net_amount: number; // What creator gets
  
  // Integration
  stripe_payout_id?: string;
  bank_account_last4?: string;
  
  processed_at?: Date;
  created_at: Date;
}

type PayoutStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface CommunityInvite {
  id: string;
  community_id: string;
  invited_by: string; // user_id
  invited_email: string;
  tier_id: string;
  
  // Invite details
  invite_code: string; // Unique code
  discount_percentage?: number; // Optional discount
  max_uses: number;
  uses_count: number;
  
  expires_at?: Date;
  created_at: Date;
}

interface ModerationLog {
  id: string;
  community_id: string;
  moderator_id: string;
  target_user_id?: string;
  target_message_id?: string;
  
  action_type: ModerationType;
  reason?: string;
  duration_minutes?: number; // For temporary bans/mutes
  
  created_at: Date;
}

type ModerationType = 
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'delete_message'
  | 'warn_user'
  | 'kick_user';
```

---

## API Design

### REST API Endpoints

```typescript
// Community Management
GET    /api/communities                    // List all communities (public)
GET    /api/communities/[id]               // Get community details
POST   /api/communities                    // Create new community (creator)
PATCH  /api/communities/[id]               // Update community (creator)
DELETE /api/communities/[id]               // Delete community (creator)

// Tiers
GET    /api/communities/[id]/tiers         // Get community tiers
POST   /api/communities/[id]/tiers         // Create tier (creator)
PATCH  /api/communities/[id]/tiers/[tierId] // Update tier (creator)
DELETE /api/communities/[id]/tiers/[tierId] // Delete tier (creator)

// Memberships
GET    /api/communities/[id]/members       // List members (authorized)
POST   /api/communities/[id]/join          // Join community (subscribe)
DELETE /api/communities/[id]/leave         // Leave community
PATCH  /api/communities/[id]/upgrade       // Upgrade tier
GET    /api/user/memberships               // Get user's memberships

// Channels
GET    /api/communities/[id]/channels      // Get accessible channels
POST   /api/communities/[id]/channels      // Create channel (creator)
PATCH  /api/communities/[id]/channels/[channelId] // Update channel
DELETE /api/communities/[id]/channels/[channelId] // Delete channel

// Content
GET    /api/communities/[id]/content       // Get accessible content
GET    /api/communities/[id]/content/[contentId] // Get specific content
POST   /api/communities/[id]/content       // Upload content (creator)
PATCH  /api/communities/[id]/content/[contentId] // Update content
DELETE /api/communities/[id]/content/[contentId] // Delete content
POST   /api/communities/[id]/content/[contentId]/view // Track view

// Payments
POST   /api/stripe/checkout                // Create checkout session
POST   /api/stripe/portal                  // Create customer portal session
POST   /api/stripe/webhook                 // Stripe webhook handler

// Analytics (Creator only)
GET    /api/communities/[id]/analytics     // Get community analytics
GET    /api/communities/[id]/revenue       // Get revenue data

// Moderation
POST   /api/communities/[id]/moderate      // Moderation actions
GET    /api/communities/[id]/mod-log       // Get moderation log
```

### Example API Implementation

```typescript
// /api/communities/[id]/join
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { tierId, paymentMethodId } = await request.json();
  const communityId = params.id;
  
  // 1. Get tier details
  const { data: tier } = await supabase
    .from('community_tiers')
    .select('*')
    .eq('id', tierId)
    .single();
  
  if (!tier) {
    return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
  }
  
  // 2. Check if user already has membership
  const { data: existingMembership } = await supabase
    .from('community_memberships')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single();
  
  if (existingMembership && existingMembership.status === 'active') {
    return NextResponse.json(
      { error: 'Already a member' },
      { status: 400 }
    );
  }
  
  // 3. If free tier, create membership directly
  if (tier.price_monthly === 0) {
    const { data: membership } = await supabase
      .from('community_memberships')
      .insert({
        community_id: communityId,
        user_id: user.id,
        tier_id: tierId,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: null, // Free tier doesn't expire
      })
      .select()
      .single();
    
    // Grant channel access
    await grantChannelAccess(user.id, communityId, tier.tier_level);
    
    return NextResponse.json({ membership });
  }
  
  // 4. For paid tiers, create Stripe checkout session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: tier.stripe_price_id,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/community/${communityId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/community/${communityId}?cancelled=true`,
    metadata: {
      community_id: communityId,
      tier_id: tierId,
      user_id: user.id,
    },
  });
  
  return NextResponse.json({ 
    checkoutUrl: session.url,
    sessionId: session.id
  });
}
```

---

## Access Control Logic

### Hierarchy of Access

```
Platform Level:
├── Free Tools (Everyone)
│   ├── Markets
│   ├── Portfolio
│   ├── Analytics
│   └── Watchlist
│
└── Communities (Tier-based)
    ├── Community Discovery (Everyone)
    ├── Community Profile (Everyone)
    └── Community Resources (Tier-gated)
        ├── Free Tier (tier_level = 0)
        │   ├── Public channels
        │   ├── Free content
        │   └── Community announcements
        │
        ├── Premium Tier (tier_level = 1)
        │   ├── All Free tier
        │   ├── Premium channels
        │   ├── Premium content
        │   └── Trading signals
        │
        └── Elite Tier (tier_level = 2)
            ├── All Premium tier
            ├── Elite channels
            ├── Elite content
            ├── 1-on-1 sessions
            └── Priority support
```

### Access Check Function

```typescript
// Utility function to check user access
async function checkAccess(
  userId: string,
  communityId: string,
  requiredTierLevel: number
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  
  // Check if user is community owner
  const { data: community } = await supabase
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .single();
  
  if (community?.owner_id === userId) {
    return true; // Owners have full access
  }
  
  // Check user's membership
  const { data: membership } = await supabase
    .from('community_memberships')
    .select(`
      status,
      tier:community_tiers(tier_level)
    `)
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (!membership) {
    return false; // No membership
  }
  
  // Check tier level
  const userTierLevel = membership.tier.tier_level;
  return userTierLevel >= requiredTierLevel;
}

// Usage in API routes
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { communityId, channelId } = await getParams();
  
  const { data: channel } = await supabase
    .from('community_channels')
    .select('minimum_tier_level')
    .eq('id', channelId)
    .single();
  
  const hasAccess = await checkAccess(
    user.id,
    communityId,
    channel.minimum_tier_level
  );
  
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Insufficient tier level' },
      { status: 403 }
    );
  }
  
  // Continue with request...
}
```

### Stream Chat Permission Sync

```typescript
// Sync Supabase membership with Stream Chat permissions
async function syncChannelPermissions(
  userId: string,
  communityId: string,
  tierLevel: number
) {
  const streamClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );
  
  // Get all channels for this community
  const { data: channels } = await supabase
    .from('community_channels')
    .select('*')
    .eq('community_id', communityId);
  
  for (const channel of channels) {
    const streamChannel = streamClient.channel(
      'messaging',
      channel.stream_channel_id
    );
    
    if (tierLevel >= channel.minimum_tier_level) {
      // Grant access
      await streamChannel.addMembers([userId]);
    } else {
      // Revoke access
      await streamChannel.removeMembers([userId]);
    }
  }
}
```

---

## User Flows

### Flow 1: User Discovers and Joins Community

```
1. User browses /community page
   ↓
2. Sees community cards with:
   - Creator info
   - Member count
   - Specialty
   - Preview content
   ↓
3. Clicks on interesting community
   ↓
4. Views community profile page:
   - About section
   - Available tiers with pricing
   - Sample content (tier-gated previews)
   - Member testimonials
   ↓
5. Decides to join, clicks "Subscribe"
   ↓
6. Tier selection modal appears:
   - Compare tier features
   - See pricing (monthly/yearly)
   - Select desired tier
   ↓
7a. If Free tier:
    - Instant membership
    - Redirect to community chat
    - Welcome message appears
    ↓
7b. If Paid tier:
    - Redirect to Stripe Checkout
    - Enter payment details
    - Complete purchase
    - Stripe webhook processes payment
    - Membership created in database
    - Stream Chat permissions granted
    - Email confirmation sent
    - Redirect to community with success message
    ↓
8. User now sees:
   - Accessible channels in sidebar
   - Tier badge next to their name
   - Content library filtered by tier
   - Welcome from creator
```

### Flow 2: Creator Sets Up Community

```
1. Creator clicks "Become a Creator"
   ↓
2. Fills out community creation form:
   - Community name
   - Handle (@username)
   - Description
   - Specialty/Category
   - Upload avatar & banner
   ↓
3. Community created with default free tier
   ↓
4. Wizard guides through setup:
   
   Step 1: Configure Tiers
   - Add pricing tiers (1-3 recommended)
   - Set monthly/yearly pricing
   - Define features per tier
   - Save tiers
   ↓
   
   Step 2: Create Channels
   - Create default channels:
     * #announcements (all members)
     * #general (all members)
     * #premium-chat (premium+)
     * #elite-lounge (elite only)
   - Set tier requirements
   - Configure permissions
   ↓
   
   Step 3: Upload Initial Content
   - Upload welcome video
   - Create introduction post
   - Set tier access levels
   ↓
   
   Step 4: Payment Setup
   - Connect Stripe account
   - Set payout preferences
   - Verify bank account
   ↓
   
   Step 5: Launch
   - Review everything
   - Publish community
   - Community goes live
   ↓
5. Creator dashboard now shows:
   - Analytics (subscribers, revenue, engagement)
   - Member management
   - Content library
   - Channel list
   - Moderation tools
```

### Flow 3: User Upgrades Tier

```
1. User with Free tier sees locked content
   ↓
2. Clicks on locked Premium video
   ↓
3. Modal appears:
   "This content requires Premium membership"
   - Shows Premium tier benefits
   - Shows pricing
   - [Upgrade to Premium] button
   ↓
4. Clicks Upgrade
   ↓
5. Redirect to Stripe Checkout
   - Pre-filled with user info
   - Shows price difference (prorated)
   ↓
6. Completes payment
   ↓
7. Webhook processes:
   - Update membership tier
   - Calculate prorated charge
   - Grant new channel access
   - Send confirmation email
   ↓
8. User sees:
   - Updated tier badge
   - New channels appear in sidebar
   - Previously locked content now accessible
   - Celebration message
```

---

## State Management

### Context Providers

```typescript
// src/contexts/CommunityContext.tsx
interface CommunityContextType {
  // Current community
  currentCommunity: Community | null;
  setCurrentCommunity: (community: Community | null) => void;
  
  // User's memberships
  userMemberships: CommunityMembership[];
  refreshMemberships: () => Promise<void>;
  
  // Current membership (for active community)
  currentMembership: CommunityMembership | null;
  
  // Access checks
  hasAccess: (requiredTierLevel: number) => boolean;
  canModerate: () => boolean;
  isOwner: () => boolean;
  
  // Loading states
  loading: boolean;
}

// Usage
const { hasAccess, currentMembership } = useCommunity();

if (!hasAccess(1)) {
  return <UpgradePrompt />;
}
```

### Data Fetching Strategy

```typescript
// Use React Query for server state management

// Fetch communities
const { data: communities } = useQuery({
  queryKey: ['communities'],
  queryFn: fetchCommunities,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Fetch user memberships
const { data: memberships } = useQuery({
  queryKey: ['memberships', userId],
  queryFn: () => fetchUserMemberships(userId),
  enabled: !!userId,
});

// Fetch community details
const { data: community } = useQuery({
  queryKey: ['community', communityId],
  queryFn: () => fetchCommunity(communityId),
});

// Mutation for joining community
const joinMutation = useMutation({
  mutationFn: ({ communityId, tierId }) => 
    joinCommunity(communityId, tierId),
  onSuccess: () => {
    queryClient.invalidateQueries(['memberships']);
    queryClient.invalidateQueries(['community', communityId]);
  },
});
```

---

## Edge Cases & Considerations

### Payment Edge Cases

1. **Failed Payment on Renewal**
   ```
   - Stripe sends payment_failed webhook
   - Set membership status to 'paused'
   - Send email notification
   - Grace period: 3 days
   - After grace period: revoke access, set to 'expired'
   ```

2. **Proration on Upgrade**
   ```
   - User on Premium ($49/mo) upgrades to Elite ($99/mo) mid-cycle
   - Calculate days remaining in current period
   - Credit unused portion: ($49/30) × 15 days = $24.50
   - Charge difference: $99 - $24.50 = $74.50
   - Start new billing cycle
   ```

3. **Downgrade Behavior**
   ```
   - User can downgrade but keeps current tier until period end
   - Set cancel_at_period_end = true
   - On period end, downgrade to selected tier
   - Adjust channel access accordingly
   ```

4. **Refund Handling**
   ```
   - Webhook: charge.refunded
   - Immediately revoke membership
   - Remove from all channels
   - Update payment status to 'refunded'
   - Log in moderation if abuse suspected
   ```

### Content Access Edge Cases

1. **Mid-Stream Tier Expiration**
   ```
   User watching Elite video when subscription expires:
   - Allow finishing current video (good UX)
   - On next video: show upgrade prompt
   - Save watch progress for when they resubscribe
   ```

2. **Tier Downgrade with Downloaded Content**
   ```
   - Content URLs should be signed with expiration
   - On tier change, invalidate old signed URLs
   - Generate new URLs for new tier level
   ```

3. **Creator Deletes/Archives Content**
   ```
   - Soft delete (keep in DB but hide)
   - Allow 30-day recovery period
   - After 30 days, can hard delete
   - Members who paid for content get notification
   ```

### Channel Access Edge Cases

1. **Real-Time Tier Change While in Chat**
   ```
   - User in #elite-lounge downgrades to Premium
   - Webhook triggers permission sync
   - Stream Chat automatically removes user
   - Show message: "Your tier has changed, redirecting..."
   - Redirect to highest accessible channel
   ```

2. **Creator Changes Channel Tier Requirement**
   ```
   - Creator moves #signals from Premium to Elite
   - Batch update: remove all Premium members
   - Send notification: "Channel access has changed"
   - Offer upgrade prompt
   ```

3. **Community Owner Loses Access**
   ```
   - Edge case: what if owner's Stripe account suspended?
   - Owner ALWAYS has access regardless
   - But new subscriptions disabled until resolved
   - Show warning banner on community page
   ```

### Member Capacity Edge Cases

1. **Tier Reaches Max Members**
   ```
   - Check member count before checkout
   - If at capacity: show "Tier Full" message
   - Offer waitlist option
   - Email when slot opens
   ```

2. **Multiple Simultaneous Signups**
   ```
   - Use database transactions
   - Atomic increment of member count
   - Last person to exceed cap gets refund
   - Race condition handled at DB level
   ```

---

## Migration Strategy

### Phase 1: Database Setup (Week 1)

```sql
-- Create tables in Supabase
-- Set up RLS policies
-- Create indexes
-- Set up triggers for counts/stats
```

### Phase 2: Basic Community CRUD (Week 2)

```
- Community creation form
- Community profile page
- Creator dashboard skeleton
- Tier management UI
```

### Phase 3: Membership System (Week 3)

```
- Free tier joining
- Access control implementation
- User membership dashboard
```

### Phase 4: Payment Integration (Week 4)

```
- Stripe setup
- Checkout flow
- Webhook handling
- Subscription management
```

### Phase 5: Channel Integration (Week 5)

```
- Stream Chat channel creation
- Permission sync
- Dynamic sidebar
- Access enforcement
```

### Phase 6: Content Management (Week 6)

```
- Content upload (Supabase Storage)
- Video player
- Content library
- View tracking
```

### Phase 7: Polish & Launch (Week 7-8)

```
- Analytics dashboard
- Email notifications
- Moderation tools
- Performance optimization
- Beta testing
- Public launch
```

---

## Success Metrics

### For Platform (Pryleaf)

- Total communities created
- Total active subscribers
- Monthly Recurring Revenue (MRR)
- Average revenue per community
- Subscriber retention rate
- Platform usage (free tools vs communities)

### For Creators

- Subscriber growth rate
- Monthly revenue
- Content engagement (views, completion rate)
- Member retention
- Active member percentage
- Revenue per subscriber

### For Subscribers

- Content consumption hours
- Community engagement (messages sent)
- Average communities joined
- Lifetime value (LTV)
- Churn rate by tier

---

## Next Steps - Priority Order

1. ✅ Create database migrations
2. ✅ Build community CRUD operations
3. ✅ Implement tier management
4. ✅ Build creator dashboard
5. ⏸️ Add Stripe integration
6. ⏸️ Sync Stream Chat permissions
7. ⏸️ Content upload & management
8. ⏸️ Analytics & reporting

**Ready to start building?**

