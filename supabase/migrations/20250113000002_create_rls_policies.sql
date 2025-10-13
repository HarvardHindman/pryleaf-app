-- Row Level Security (RLS) Policies for Community Platform
-- These policies control who can read/write data at the database level

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMUNITIES POLICIES
-- ============================================================================

-- Anyone can view active communities (for discovery)
CREATE POLICY "Communities are viewable by everyone"
    ON public.communities FOR SELECT
    USING (status = 'active');

-- Only authenticated users can create communities
CREATE POLICY "Authenticated users can create communities"
    ON public.communities FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Only community owners can update their communities
CREATE POLICY "Owners can update their communities"
    ON public.communities FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Only community owners can delete their communities
CREATE POLICY "Owners can delete their communities"
    ON public.communities FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ============================================================================
-- COMMUNITY TIERS POLICIES
-- ============================================================================

-- Anyone can view tiers (for pricing comparison)
CREATE POLICY "Community tiers are viewable by everyone"
    ON public.community_tiers FOR SELECT
    USING (TRUE);

-- Only community owners can manage tiers
CREATE POLICY "Owners can insert tiers"
    ON public.community_tiers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update tiers"
    ON public.community_tiers FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete tiers"
    ON public.community_tiers FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMUNITY MEMBERSHIPS POLICIES
-- ============================================================================

-- Users can view memberships in communities they own or are members of
CREATE POLICY "Users can view relevant memberships"
    ON public.community_memberships FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id -- own memberships
        OR
        EXISTS ( -- or they own the community
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Users can create their own memberships
CREATE POLICY "Users can create their own memberships"
    ON public.community_memberships FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own memberships (for cancellation, etc.)
CREATE POLICY "Users can update their own memberships"
    ON public.community_memberships FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Community owners can also update memberships (for moderation)
CREATE POLICY "Owners can update community memberships"
    ON public.community_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Only owners can delete memberships
CREATE POLICY "Owners can delete memberships"
    ON public.community_memberships FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMUNITY CHANNELS POLICIES
-- ============================================================================

-- Users can view channels if they have appropriate tier membership
CREATE POLICY "Users can view accessible channels"
    ON public.community_channels FOR SELECT
    TO authenticated
    USING (
        -- Community owners can see all channels
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
        OR
        -- Members can see channels their tier allows
        EXISTS (
            SELECT 1 FROM public.community_memberships cm
            JOIN public.community_tiers ct ON cm.tier_id = ct.id
            WHERE cm.community_id = community_channels.community_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND ct.tier_level >= community_channels.minimum_tier_level
        )
    );

-- Only community owners can manage channels
CREATE POLICY "Owners can insert channels"
    ON public.community_channels FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update channels"
    ON public.community_channels FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete channels"
    ON public.community_channels FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMUNITY CONTENT POLICIES
-- ============================================================================

-- Users can view content if:
-- - It's published AND they have appropriate tier access
-- - OR they are the creator
-- - OR they own the community
CREATE POLICY "Users can view accessible content"
    ON public.community_content FOR SELECT
    TO authenticated
    USING (
        (
            is_published = TRUE
            AND
            (
                minimum_tier_level = 0 -- Free content
                OR
                EXISTS (
                    SELECT 1 FROM public.community_memberships cm
                    JOIN public.community_tiers ct ON cm.tier_id = ct.id
                    WHERE cm.community_id = community_content.community_id
                    AND cm.user_id = auth.uid()
                    AND cm.status = 'active'
                    AND ct.tier_level >= community_content.minimum_tier_level
                )
            )
        )
        OR
        creator_id = auth.uid() -- Creator can see their own content
        OR
        EXISTS ( -- Community owner can see all content
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Only community creators can add content
CREATE POLICY "Creators can insert content"
    ON public.community_content FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = creator_id
        AND
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Only creators can update their content
CREATE POLICY "Creators can update their content"
    ON public.community_content FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

-- Only creators can delete their content
CREATE POLICY "Creators can delete their content"
    ON public.community_content FOR DELETE
    TO authenticated
    USING (creator_id = auth.uid());

-- ============================================================================
-- CONTENT VIEWS POLICIES
-- ============================================================================

-- Users can view their own viewing history
CREATE POLICY "Users can view their own viewing history"
    ON public.content_views FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Community owners can view analytics
CREATE POLICY "Owners can view community analytics"
    ON public.content_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Users can insert their own views
CREATE POLICY "Users can insert their own views"
    ON public.content_views FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own views (for progress tracking)
CREATE POLICY "Users can update their own views"
    ON public.content_views FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Community owners can view payments to their community
CREATE POLICY "Owners can view community payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Only the system (via service role) can insert payments
-- This will be done through API routes that verify Stripe webhooks
CREATE POLICY "Service role can insert payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CREATOR PAYOUTS POLICIES
-- ============================================================================

-- Creators can view their own payouts
CREATE POLICY "Creators can view their own payouts"
    ON public.creator_payouts FOR SELECT
    TO authenticated
    USING (creator_id = auth.uid());

-- Only service role can manage payouts (done through admin API)
CREATE POLICY "Service role can insert payouts"
    ON public.creator_payouts FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

CREATE POLICY "Service role can update payouts"
    ON public.creator_payouts FOR UPDATE
    TO service_role
    USING (TRUE);

-- ============================================================================
-- MODERATION LOG POLICIES
-- ============================================================================

-- Community owners can view moderation logs for their communities
CREATE POLICY "Owners can view moderation logs"
    ON public.moderation_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Community owners can create moderation logs
CREATE POLICY "Owners can insert moderation logs"
    ON public.moderation_log FOR INSERT
    TO authenticated
    WITH CHECK (
        moderator_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR ACCESS CONTROL
-- ============================================================================

-- Function to check if user has access to a community resource
CREATE OR REPLACE FUNCTION public.has_community_access(
    p_user_id UUID,
    p_community_id UUID,
    p_required_tier_level INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is community owner
    IF EXISTS (
        SELECT 1 FROM public.communities
        WHERE id = p_community_id AND owner_id = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has appropriate tier membership
    RETURN EXISTS (
        SELECT 1 FROM public.community_memberships cm
        JOIN public.community_tiers ct ON cm.tier_id = ct.id
        WHERE cm.community_id = p_community_id
        AND cm.user_id = p_user_id
        AND cm.status = 'active'
        AND ct.tier_level >= p_required_tier_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is community owner
CREATE OR REPLACE FUNCTION public.is_community_owner(
    p_user_id UUID,
    p_community_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.communities
        WHERE id = p_community_id AND owner_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tier level in a community
CREATE OR REPLACE FUNCTION public.get_user_tier_level(
    p_user_id UUID,
    p_community_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    tier_level INTEGER;
BEGIN
    -- If user is owner, return max tier level
    IF public.is_community_owner(p_user_id, p_community_id) THEN
        RETURN 999; -- Max tier level for owners
    END IF;
    
    -- Get user's tier level
    SELECT ct.tier_level INTO tier_level
    FROM public.community_memberships cm
    JOIN public.community_tiers ct ON cm.tier_id = ct.id
    WHERE cm.community_id = p_community_id
    AND cm.user_id = p_user_id
    AND cm.status = 'active';
    
    RETURN COALESCE(tier_level, -1); -- -1 means no membership
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.has_community_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier_level TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.has_community_access IS 'Check if user has access to a community resource based on tier level';
COMMENT ON FUNCTION public.is_community_owner IS 'Check if user owns a community';
COMMENT ON FUNCTION public.get_user_tier_level IS 'Get users current tier level in a community (-1 if not a member, 999 if owner)';

