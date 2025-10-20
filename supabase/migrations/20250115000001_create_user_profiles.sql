-- ============================================================================
-- USER PROFILES TABLE
-- Extends auth.users with additional profile information
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display information
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    
    -- Social links
    website_url TEXT,
    twitter_handle TEXT,
    youtube_url TEXT,
    linkedin_url TEXT,
    
    -- Location
    location TEXT,
    timezone TEXT,
    
    -- Preferences
    is_public BOOLEAN DEFAULT TRUE,
    show_email BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    
    -- Stats (denormalized for performance)
    total_communities_owned INTEGER DEFAULT 0,
    total_communities_joined INTEGER DEFAULT 0,
    total_videos_uploaded INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~* '^[a-z0-9_]+$'),
    CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
    CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50)
);

-- Indexes for fast lookups
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_is_public ON public.user_profiles(is_public);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
ON public.user_profiles
FOR SELECT
USING (is_public = TRUE);

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TRIGGER TO UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================================================
-- FUNCTION TO CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.user_profiles.username IS 'Unique username for profile URLs';
COMMENT ON COLUMN public.user_profiles.display_name IS 'Display name shown in UI';
COMMENT ON COLUMN public.user_profiles.is_public IS 'Whether profile is publicly viewable';
COMMENT ON COLUMN public.user_profiles.show_email IS 'Whether to display email on public profile';

