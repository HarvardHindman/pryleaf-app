# Community Platform Architecture

## Overview
A hybrid financial platform combining free research tools with paid community access. Creators can build communities around their trading expertise, set custom pricing tiers, and monetize through subscriptions.

## Core Concepts

### 1. Free vs Paid Features

**Free Features (Always Accessible):**
- Stock research & analysis
- Market data & charts
- Portfolio tracking tools
- Basic analytics
- Public community browsing
- Free creator content

**Paid Features (Community-Specific):**
- Private community chat channels
- Premium video content
- Exclusive trading signals
- Live sessions with creators
- Advanced analytics per community
- Direct creator access

### 2. Community Structure

Each community operates independently with:
- **Owner**: Creator who manages the community
- **Custom Tiers**: Owner defines pricing (e.g., Free, $49/mo, $99/mo)
- **Channels**: Chat rooms gated by tier level
- **Content**: Videos, posts, resources gated by tier
- **Members**: Users subscribed at various tier levels

### 3. Tier System

```
Community: "Sarah's Options Trading"
├── Free Tier ($0/mo)
│   ├── Access: Public chat, free videos
│   └── Channels: #general, #announcements
├── Premium Tier ($49/mo)
│   ├── Access: All free + premium videos, signals
│   └── Channels: #general, #premium-chat, #signals
└── Elite Tier ($99/mo)
    ├── Access: All premium + 1-on-1, live sessions
    └── Channels: All + #elite-lounge, #live-trading
```

## Database Schema

### Core Tables

#### `communities`
```sql
- id (uuid, primary key)
- owner_id (uuid, foreign key → auth.users)
- name (text)
- handle (text, unique)
- description (text)
- avatar_url (text)
- banner_url (text)
- specialty (text)
- verified (boolean)
- subscriber_count (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `community_tiers`
```sql
- id (uuid, primary key)
- community_id (uuid, foreign key → communities)
- name (text) -- e.g., "Free", "Premium", "Elite"
- description (text)
- price_monthly (decimal) -- in cents/smallest currency unit
- price_yearly (decimal) -- optional annual pricing
- tier_level (integer) -- 0 = free, 1 = basic, 2 = premium, etc.
- features (jsonb) -- structured list of features
- max_members (integer) -- optional cap
- created_at (timestamp)
```

#### `community_memberships`
```sql
- id (uuid, primary key)
- community_id (uuid, foreign key → communities)
- user_id (uuid, foreign key → auth.users)
- tier_id (uuid, foreign key → community_tiers)
- status (enum: 'active', 'cancelled', 'expired', 'paused')
- subscribed_at (timestamp)
- expires_at (timestamp)
- auto_renew (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `community_channels`
```sql
- id (uuid, primary key)
- community_id (uuid, foreign key → communities)
- stream_channel_id (text) -- Stream Chat channel ID
- name (text)
- description (text)
- minimum_tier_level (integer) -- required tier to access
- channel_type (enum: 'text', 'voice', 'announcement')
- created_at (timestamp)
```

#### `community_content`
```sql
- id (uuid, primary key)
- community_id (uuid, foreign key → communities)
- creator_id (uuid, foreign key → auth.users)
- title (text)
- description (text)
- content_type (enum: 'video', 'article', 'signal', 'resource')
- content_url (text)
- thumbnail_url (text)
- minimum_tier_level (integer) -- required tier to access
- duration (integer) -- for videos
- views (integer)
- likes (integer)
- published_at (timestamp)
- created_at (timestamp)
```

#### `payments`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key → auth.users)
- community_id (uuid, foreign key → communities)
- tier_id (uuid, foreign key → community_tiers)
- amount (decimal)
- currency (text)
- status (enum: 'pending', 'completed', 'failed', 'refunded')
- payment_provider (text) -- 'stripe', 'paypal', etc.
- provider_payment_id (text)
- created_at (timestamp)
```

#### `creator_payouts`
```sql
- id (uuid, primary key)
- creator_id (uuid, foreign key → auth.users)
- community_id (uuid, foreign key → communities)
- amount (decimal)
- currency (text)
- status (enum: 'pending', 'processing', 'completed', 'failed')
- period_start (timestamp)
- period_end (timestamp)
- processed_at (timestamp)
- created_at (timestamp)
```

## Access Control System

### Row-Level Security (RLS) Policies

**Read Access to Channels:**
```sql
-- Users can only read channels if they have appropriate tier membership
CREATE POLICY channel_read_policy ON community_channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM community_memberships cm
    JOIN community_tiers ct ON cm.tier_id = ct.id
    WHERE cm.community_id = community_channels.community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
    AND ct.tier_level >= community_channels.minimum_tier_level
  )
  OR
  -- Community owners can always access
  EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_channels.community_id
    AND c.owner_id = auth.uid()
  )
);
```

**Read Access to Content:**
```sql
CREATE POLICY content_read_policy ON community_content
FOR SELECT USING (
  minimum_tier_level = 0 -- Free content
  OR
  EXISTS (
    SELECT 1 FROM community_memberships cm
    JOIN community_tiers ct ON cm.tier_id = ct.id
    WHERE cm.community_id = community_content.community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
    AND ct.tier_level >= community_content.minimum_tier_level
  )
  OR
  creator_id = auth.uid() -- Creator can see their own content
);
```

## User Flows

### For Users (Subscribers)

1. **Browse Communities**
   - View all available communities
   - See creator profiles, subscriber counts
   - Preview free content

2. **Join a Community**
   - Select a tier (Free/Paid)
   - For paid: Payment flow → Stripe Checkout
   - Instant access upon successful payment
   - Automatic channel permissions via Stream Chat

3. **Access Community**
   - See tier-specific channels in sidebar
   - Access tier-specific content
   - Interact with creator and other members

4. **Manage Subscription**
   - Upgrade/downgrade tiers
   - Cancel subscription (access until period end)
   - View payment history

### For Creators

1. **Create Community**
   - Setup community profile
   - Define specialty/niche
   - Upload branding (avatar, banner)

2. **Configure Tiers**
   - Create pricing tiers (up to 3-4 recommended)
   - Set pricing (monthly/yearly)
   - Define features per tier
   - Set member caps if desired

3. **Create Channels**
   - Setup chat channels
   - Assign tier requirements
   - Configure permissions

4. **Publish Content**
   - Upload videos, articles
   - Set tier requirements
   - Schedule releases

5. **Manage Community**
   - View analytics (revenue, subscribers, engagement)
   - Moderate content and members
   - Configure payout settings

## Integration Points

### Stream Chat Integration

**Channel Naming Convention:**
```
community_{community_id}_general
community_{community_id}_premium
community_{community_id}_elite
```

**User Permissions Logic:**
```javascript
// When user subscribes to a tier
async function grantChannelAccess(userId, communityId, tierLevel) {
  const channels = await getChannelsByTierLevel(communityId, tierLevel);
  
  for (const channel of channels) {
    await streamChat.channel(channel.stream_channel_id)
      .addMembers([userId]);
  }
}

// When subscription expires
async function revokeChannelAccess(userId, communityId) {
  const channels = await getCommunityChannels(communityId);
  
  for (const channel of channels) {
    await streamChat.channel(channel.stream_channel_id)
      .removeMembers([userId]);
  }
}
```

### Payment Integration (Stripe)

**Subscription Flow:**
```javascript
// 1. User selects tier
// 2. Create Stripe Checkout Session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  payment_method_types: ['card'],
  line_items: [{
    price: tier.stripe_price_id,
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: `${domain}/community/${communityId}?success=true`,
  cancel_url: `${domain}/community/${communityId}?cancelled=true`,
  metadata: {
    community_id: communityId,
    tier_id: tierId,
    user_id: userId,
  }
});

// 3. Handle webhook for successful payment
// 4. Create membership record
// 5. Grant channel access
```

## Revenue Model

### Platform Revenue (Pryleaf)
- **Transaction Fee**: 5-10% of each subscription
- **Payment Processing**: Pass through Stripe fees (~2.9% + 30¢)

### Creator Revenue
- **Net Revenue**: 90-95% of subscription fees
- **Payout Schedule**: Monthly or bi-weekly
- **Minimum Payout**: $50 threshold

**Example:**
```
User pays $49/mo for Premium tier
├── Stripe Fee: ~$1.72 (2.9% + $0.30)
├── Platform Fee: $4.73 (10% of $47.28)
└── Creator Gets: $42.55 (90%)
```

## Security Considerations

1. **Authentication**: Supabase Auth (already implemented)
2. **Authorization**: RLS policies on all community tables
3. **Payment Security**: PCI compliance via Stripe
4. **API Security**: Rate limiting, JWT validation
5. **Content Security**: Signed URLs for premium content

## Scalability

1. **Database**: Supabase (Postgres) with proper indexing
2. **File Storage**: Supabase Storage for videos/images
3. **Chat**: Stream Chat (handles scaling automatically)
4. **CDN**: Cloudflare/Vercel for static content
5. **Caching**: Redis for frequently accessed data (future)

## UI/UX Flow

### Navigation Structure
```
Sidebar:
├── [Free Tools]
│   ├── Dashboard
│   ├── Markets
│   ├── Portfolio
│   ├── Analytics
│   └── Watchlist
├── [Communities]
│   ├── Discover Communities
│   ├── My Communities
│   │   ├── Community 1
│   │   │   ├── #general
│   │   │   ├── #premium-chat
│   │   │   └── #elite-lounge
│   │   └── Community 2
│   │       └── channels...
│   └── Create Community (for creators)
└── [Settings]
```

### Community Page Layout
```
┌─────────────────────────────────────────────┐
│ Banner Image                                │
│ ┌─────┐ Community Name      [Join/Manage]  │
│ │Logo │ @handle • 12.5K subscribers        │
│ └─────┘ ⭐ Verified                         │
├─────────────────────────────────────────────┤
│ [About] [Content] [Members] [Pricing]       │
├─────────────────────────────────────────────┤
│                                             │
│  Content Grid/Chat Interface                │
│                                             │
└─────────────────────────────────────────────┘
```

## Phase 1 Implementation (MVP)

1. ✅ Community browsing UI (already done)
2. Database schema setup
3. Community creation flow
4. Basic tier configuration
5. Membership system (no payment yet)
6. Channel integration with Stream Chat
7. Access control enforcement

## Phase 2 (Payment Integration)

1. Stripe integration
2. Checkout flow
3. Webhook handling
4. Subscription management
5. Creator payout system

## Phase 3 (Advanced Features)

1. Analytics dashboard for creators
2. Advanced content scheduling
3. Community discovery algorithm
4. Referral/affiliate system
5. Mobile app consideration

## Next Steps

1. Create Supabase migrations for tables
2. Build creator dashboard for community management
3. Implement membership/tier system
4. Integrate Stream Chat with community channels
5. Build subscription UI flow
6. Add payment integration (Stripe)

