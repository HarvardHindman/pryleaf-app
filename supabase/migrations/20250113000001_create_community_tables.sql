-- Community Platform Database Schema
-- This migration creates all tables needed for the community/creator platform

-- ============================================================================
-- COMMUNITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    specialty TEXT NOT NULL,
    category TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    subscriber_count INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0, -- in cents
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    settings JSONB DEFAULT '{
        "auto_accept_members": true,
        "allow_member_invites": false,
        "show_member_count": true,
        "require_email_verification": false,
        "moderation_enabled": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_communities_owner_id ON public.communities(owner_id);
CREATE INDEX idx_communities_handle ON public.communities(handle);
CREATE INDEX idx_communities_category ON public.communities(category);
CREATE INDEX idx_communities_status ON public.communities(status);

-- ============================================================================
-- COMMUNITY TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL DEFAULT 0, -- in cents
    price_yearly INTEGER, -- in cents (optional)
    tier_level INTEGER NOT NULL DEFAULT 0, -- 0 = free, 1+ = paid tiers
    features JSONB DEFAULT '[]'::jsonb,
    perks TEXT[] DEFAULT ARRAY[]::TEXT[],
    max_members INTEGER, -- optional capacity limit
    stripe_price_id TEXT, -- Stripe Price ID for subscriptions
    stripe_price_id_yearly TEXT, -- Stripe Price ID for yearly
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_community_tier_level UNIQUE(community_id, tier_level),
    CONSTRAINT positive_price CHECK (price_monthly >= 0),
    CONSTRAINT positive_tier_level CHECK (tier_level >= 0)
);

-- Index for fast lookups
CREATE INDEX idx_community_tiers_community_id ON public.community_tiers(community_id);
CREATE INDEX idx_community_tiers_tier_level ON public.community_tiers(tier_level);

-- ============================================================================
-- COMMUNITY MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.community_tiers(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused', 'pending')),
    
    -- Subscription details
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment integration
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    
    -- Engagement tracking
    last_active_at TIMESTAMP WITH TIME ZONE,
    total_messages_sent INTEGER DEFAULT 0,
    total_content_viewed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_community_membership UNIQUE(user_id, community_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX idx_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX idx_memberships_status ON public.community_memberships(status);
CREATE INDEX idx_memberships_tier_id ON public.community_memberships(tier_id);
CREATE INDEX idx_memberships_stripe_subscription_id ON public.community_memberships(stripe_subscription_id);

-- ============================================================================
-- COMMUNITY CHANNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    stream_channel_id TEXT NOT NULL UNIQUE, -- Stream Chat channel ID
    name TEXT NOT NULL,
    description TEXT,
    minimum_tier_level INTEGER NOT NULL DEFAULT 0, -- required tier to access
    channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('text', 'announcement', 'voice', 'live')),
    is_announcement_only BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Moderation settings
    slow_mode_duration INTEGER, -- seconds between messages
    message_retention_days INTEGER, -- auto-delete old messages
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT positive_tier_level CHECK (minimum_tier_level >= 0)
);

-- Indexes
CREATE INDEX idx_channels_community_id ON public.community_channels(community_id);
CREATE INDEX idx_channels_minimum_tier_level ON public.community_channels(minimum_tier_level);
CREATE INDEX idx_channels_stream_channel_id ON public.community_channels(stream_channel_id);

-- ============================================================================
-- COMMUNITY CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content details
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'trading_signal', 'resource', 'live_session', 'course')),
    content_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Access control
    minimum_tier_level INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_publish_at TIMESTAMP WITH TIME ZONE,
    
    -- Media details
    duration INTEGER, -- seconds (for video)
    file_size BIGINT, -- bytes
    
    -- Engagement metrics
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- SEO
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT positive_tier_level CHECK (minimum_tier_level >= 0)
);

-- Indexes
CREATE INDEX idx_content_community_id ON public.community_content(community_id);
CREATE INDEX idx_content_creator_id ON public.community_content(creator_id);
CREATE INDEX idx_content_minimum_tier_level ON public.community_content(minimum_tier_level);
CREATE INDEX idx_content_is_published ON public.community_content(is_published);
CREATE INDEX idx_content_published_at ON public.community_content(published_at);

-- ============================================================================
-- CONTENT VIEWS TABLE (for analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.community_content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    
    -- Viewing details
    watch_duration INTEGER DEFAULT 0, -- seconds watched
    completion_percentage INTEGER DEFAULT 0,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_content_view UNIQUE(content_id, user_id)
);

-- Indexes
CREATE INDEX idx_content_views_content_id ON public.content_views(content_id);
CREATE INDEX idx_content_views_user_id ON public.content_views(user_id);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.community_tiers(id) ON DELETE RESTRICT,
    
    -- Payment details
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    
    -- Integration
    payment_provider TEXT DEFAULT 'stripe',
    provider_payment_id TEXT NOT NULL,
    provider_subscription_id TEXT,
    
    -- Metadata
    description TEXT,
    receipt_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_community_id ON public.payments(community_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_provider_payment_id ON public.payments(provider_payment_id);

-- ============================================================================
-- CREATOR PAYOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.creator_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    
    -- Payout details
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Calculations
    total_revenue INTEGER NOT NULL, -- gross revenue in cents
    platform_fee INTEGER NOT NULL, -- Pryleaf's cut in cents
    processing_fee INTEGER NOT NULL, -- Stripe fees in cents
    net_amount INTEGER NOT NULL, -- what creator gets in cents
    
    -- Integration
    stripe_payout_id TEXT,
    bank_account_last4 TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT positive_amounts CHECK (amount > 0 AND total_revenue > 0 AND net_amount > 0)
);

-- Indexes
CREATE INDEX idx_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX idx_payouts_community_id ON public.creator_payouts(community_id);
CREATE INDEX idx_payouts_status ON public.creator_payouts(status);

-- ============================================================================
-- MODERATION LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_message_id TEXT,
    
    action_type TEXT NOT NULL CHECK (action_type IN ('ban_user', 'unban_user', 'mute_user', 'unmute_user', 'delete_message', 'warn_user', 'kick_user')),
    reason TEXT,
    duration_minutes INTEGER, -- for temporary actions
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_moderation_community_id ON public.moderation_log(community_id);
CREATE INDEX idx_moderation_moderator_id ON public.moderation_log(moderator_id);
CREATE INDEX idx_moderation_target_user_id ON public.moderation_log(target_user_id);

-- ============================================================================
-- FUNCTIONS FOR AUTO-UPDATING updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_tiers_updated_at BEFORE UPDATE ON public.community_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_memberships_updated_at BEFORE UPDATE ON public.community_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_channels_updated_at BEFORE UPDATE ON public.community_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_content_updated_at BEFORE UPDATE ON public.community_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR AUTO-UPDATING COUNTS
-- ============================================================================

-- Update community subscriber count when membership changes
CREATE OR REPLACE FUNCTION update_community_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
       (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') THEN
        UPDATE public.communities
        SET subscriber_count = subscriber_count + 1
        WHERE id = NEW.community_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'active') OR
          (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE public.communities
        SET subscriber_count = subscriber_count - 1
        WHERE id = COALESCE(NEW.community_id, OLD.community_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_subscriber_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
FOR EACH ROW EXECUTE FUNCTION update_community_subscriber_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.communities IS 'Stores community/creator profiles';
COMMENT ON TABLE public.community_tiers IS 'Defines pricing tiers for each community';
COMMENT ON TABLE public.community_memberships IS 'Tracks user subscriptions to communities';
COMMENT ON TABLE public.community_channels IS 'Chat channels within communities';
COMMENT ON TABLE public.community_content IS 'Videos, articles, and other content';
COMMENT ON TABLE public.content_views IS 'Tracks content viewing analytics';
COMMENT ON TABLE public.payments IS 'Payment transaction records';
COMMENT ON TABLE public.creator_payouts IS 'Creator payout records';
COMMENT ON TABLE public.moderation_log IS 'Audit log for moderation actions';



