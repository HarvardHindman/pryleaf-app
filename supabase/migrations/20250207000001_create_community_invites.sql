-- Community Invite System
-- This migration creates the invite code system for communities

-- ============================================================================
-- COMMUNITY INVITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invite code (URL-safe, unique identifier)
    code TEXT NOT NULL UNIQUE,
    
    -- Configuration
    tier_id UUID REFERENCES public.community_tiers(id) ON DELETE SET NULL, -- Which tier to grant (null = default free tier)
    max_uses INTEGER, -- null = unlimited
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE, -- null = never expires
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    name TEXT, -- Optional friendly name like "Discord Launch Event"
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX idx_community_invites_code ON public.community_invites(code);
CREATE INDEX idx_community_invites_community_id ON public.community_invites(community_id);
CREATE INDEX idx_community_invites_created_by ON public.community_invites(created_by);
CREATE INDEX idx_community_invites_is_active ON public.community_invites(is_active);

-- ============================================================================
-- INVITE USAGE LOG TABLE (tracks who used which invite)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invite_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invite_id UUID NOT NULL REFERENCES public.community_invites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.community_memberships(id) ON DELETE SET NULL,
    
    used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_invite_user UNIQUE(invite_id, user_id)
);

-- Indexes
CREATE INDEX idx_invite_usage_invite_id ON public.invite_usage_log(invite_id);
CREATE INDEX idx_invite_usage_user_id ON public.invite_usage_log(user_id);

-- ============================================================================
-- HELPER FUNCTION: Generate secure invite code
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create invite with auto-generated code
-- ============================================================================
CREATE OR REPLACE FUNCTION create_community_invite(
    p_community_id UUID,
    p_created_by UUID,
    p_tier_id UUID DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_expires_in_days INTEGER DEFAULT NULL,
    p_name TEXT DEFAULT NULL
)
RETURNS public.community_invites AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_result public.community_invites;
BEGIN
    -- Generate unique code
    LOOP
        v_code := generate_invite_code(8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.community_invites WHERE code = v_code);
    END LOOP;
    
    -- Calculate expiration if specified
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := timezone('utc'::text, now()) + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Insert the invite
    INSERT INTO public.community_invites (
        community_id,
        created_by,
        code,
        tier_id,
        max_uses,
        expires_at,
        name,
        is_active
    ) VALUES (
        p_community_id,
        p_created_by,
        v_code,
        p_tier_id,
        p_max_uses,
        v_expires_at,
        p_name,
        TRUE
    ) RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Validate and use invite
-- Returns the invite if valid, null if invalid
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_invite(p_code TEXT)
RETURNS TABLE (
    invite_id UUID,
    community_id UUID,
    tier_id UUID,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_invite public.community_invites;
BEGIN
    -- Find the invite
    SELECT * INTO v_invite FROM public.community_invites WHERE code = p_code;
    
    -- Check if invite exists
    IF v_invite IS NULL THEN
        RETURN QUERY SELECT 
            NULL::UUID, 
            NULL::UUID, 
            NULL::UUID, 
            FALSE, 
            'Invite code not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if active
    IF NOT v_invite.is_active THEN
        RETURN QUERY SELECT 
            v_invite.id, 
            v_invite.community_id, 
            v_invite.tier_id, 
            FALSE, 
            'This invite has been deactivated'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < timezone('utc'::text, now()) THEN
        RETURN QUERY SELECT 
            v_invite.id, 
            v_invite.community_id, 
            v_invite.tier_id, 
            FALSE, 
            'This invite has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check max uses
    IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
        RETURN QUERY SELECT 
            v_invite.id, 
            v_invite.community_id, 
            v_invite.tier_id, 
            FALSE, 
            'This invite has reached its maximum uses'::TEXT;
        RETURN;
    END IF;
    
    -- Valid invite
    RETURN QUERY SELECT 
        v_invite.id, 
        v_invite.community_id, 
        v_invite.tier_id, 
        TRUE, 
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Increment invite use count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_invite_use_count(p_invite_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.community_invites
    SET use_count = use_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_invite_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================
CREATE TRIGGER update_community_invites_updated_at 
    BEFORE UPDATE ON public.community_invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_usage_log ENABLE ROW LEVEL SECURITY;

-- Invites: Anyone can read active invites (for validation), owners can manage
CREATE POLICY "Anyone can read active invites"
    ON public.community_invites FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Community owners can manage invites"
    ON public.community_invites FOR ALL
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.communities 
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- Usage log: Users can see their own usage, owners can see all for their community
CREATE POLICY "Users can see own invite usage"
    ON public.invite_usage_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Community owners can see invite usage"
    ON public.invite_usage_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.community_invites ci
            JOIN public.communities c ON ci.community_id = c.id
            WHERE ci.id = invite_id AND c.owner_id = auth.uid()
        )
    );

CREATE POLICY "System can insert invite usage"
    ON public.invite_usage_log FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.community_invites IS 'Stores invite codes for communities';
COMMENT ON TABLE public.invite_usage_log IS 'Tracks who used which invite code';
COMMENT ON FUNCTION generate_invite_code IS 'Generates a URL-safe random invite code';
COMMENT ON FUNCTION create_community_invite IS 'Creates a new invite with auto-generated code';
COMMENT ON FUNCTION validate_invite IS 'Validates an invite code and returns its status';

