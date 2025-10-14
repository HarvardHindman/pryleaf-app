-- Video System Tables
-- Additional tables to support video upload, processing, and management

-- ============================================================================
-- VIDEO PROCESSING STATUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_processing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.community_content(id) ON DELETE CASCADE,
    
    -- Upload tracking
    upload_progress INTEGER DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
    
    -- Processing tracking
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    upload_started_at TIMESTAMP WITH TIME ZONE,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_content_processing UNIQUE(content_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_video_processing_content_id ON public.video_processing(content_id);
CREATE INDEX idx_video_processing_status ON public.video_processing(processing_status);

-- Auto-update trigger
CREATE TRIGGER update_video_processing_updated_at 
    BEFORE UPDATE ON public.video_processing
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIDEO METADATA TABLE (Extended video information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.community_content(id) ON DELETE CASCADE,
    
    -- Video technical details
    codec TEXT,
    resolution TEXT, -- e.g., "1920x1080"
    framerate DECIMAL,
    bitrate BIGINT, -- bits per second
    aspect_ratio TEXT, -- e.g., "16:9"
    
    -- Storage details
    storage_path TEXT NOT NULL, -- Supabase Storage path
    storage_bucket TEXT DEFAULT 'community-videos',
    original_filename TEXT,
    
    -- Playback optimization
    has_captions BOOLEAN DEFAULT FALSE,
    caption_url TEXT,
    quality_versions JSONB DEFAULT '[]'::jsonb, -- Array of available quality levels
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_content_metadata UNIQUE(content_id)
);

-- Indexes
CREATE INDEX idx_video_metadata_content_id ON public.video_metadata(content_id);
CREATE INDEX idx_video_metadata_storage_path ON public.video_metadata(storage_path);

-- Auto-update trigger
CREATE TRIGGER update_video_metadata_updated_at 
    BEFORE UPDATE ON public.video_metadata
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CUSTOM THUMBNAILS TABLE (Optional - for future auto-generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_thumbnails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.community_content(id) ON DELETE CASCADE,
    
    -- Thumbnail details
    thumbnail_url TEXT NOT NULL,
    thumbnail_type TEXT DEFAULT 'custom' CHECK (thumbnail_type IN ('custom', 'auto_generated', 'default')),
    
    -- For auto-generated thumbnails (future)
    video_timestamp DECIMAL, -- Seconds into video where frame was captured
    
    -- Selection
    is_selected BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_video_thumbnails_content_id ON public.video_thumbnails(content_id);
CREATE INDEX idx_video_thumbnails_is_selected ON public.video_thumbnails(is_selected);

-- Ensure only one thumbnail is selected per video
CREATE UNIQUE INDEX idx_video_thumbnails_one_selected 
    ON public.video_thumbnails(content_id) 
    WHERE is_selected = TRUE;

-- ============================================================================
-- VIDEO VIEWS TRACKING (Enhanced from content_views)
-- ============================================================================
-- Note: We already have content_views table, but let's add a specific view for videos

CREATE OR REPLACE VIEW video_analytics AS
SELECT 
    cc.id,
    cc.community_id,
    cc.creator_id,
    cc.title,
    cc.published_at,
    cc.views,
    cc.unique_views,
    cc.likes,
    cc.comments_count,
    cc.duration,
    vm.resolution,
    vm.storage_path,
    COALESCE(
        (SELECT AVG(watch_duration::float / NULLIF(cc.duration, 0) * 100)
         FROM content_views cv 
         WHERE cv.content_id = cc.id),
        0
    ) as avg_completion_percentage,
    COALESCE(
        (SELECT COUNT(DISTINCT user_id) 
         FROM content_views cv 
         WHERE cv.content_id = cc.id 
         AND cv.created_at >= NOW() - INTERVAL '7 days'),
        0
    ) as views_last_7_days
FROM community_content cc
LEFT JOIN video_metadata vm ON vm.content_id = cc.id
WHERE cc.content_type = 'video'
  AND cc.is_published = TRUE;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get video upload status
CREATE OR REPLACE FUNCTION get_video_upload_status(video_content_id UUID)
RETURNS TABLE (
    upload_status TEXT,
    processing_status TEXT,
    upload_progress INTEGER,
    processing_progress INTEGER,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.upload_status,
        vp.processing_status,
        vp.upload_progress,
        vp.processing_progress,
        vp.error_message
    FROM video_processing vp
    WHERE vp.content_id = video_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark video as processing complete
CREATE OR REPLACE FUNCTION complete_video_processing(video_content_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE video_processing 
    SET 
        processing_status = 'completed',
        processing_progress = 100,
        processing_completed_at = NOW()
    WHERE content_id = video_content_id;
    
    -- Mark content as published if it was scheduled
    UPDATE community_content
    SET 
        is_published = TRUE,
        published_at = COALESCE(published_at, NOW())
    WHERE id = video_content_id
      AND is_published = FALSE
      AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.video_processing IS 'Tracks video upload and processing status';
COMMENT ON TABLE public.video_metadata IS 'Extended metadata for video files';
COMMENT ON TABLE public.video_thumbnails IS 'Custom and auto-generated thumbnail options';
COMMENT ON VIEW video_analytics IS 'Aggregated video analytics and metrics';

-- ============================================================================
-- CONTENT LIKES TABLE (For likes on videos and other content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.community_content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'video', 'article', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_content_user_like UNIQUE(content_id, user_id)
);

-- Indexes
CREATE INDEX idx_content_likes_content_id ON public.content_likes(content_id);
CREATE INDEX idx_content_likes_user_id ON public.content_likes(user_id);
CREATE INDEX idx_content_likes_content_type ON public.content_likes(content_type);

-- ============================================================================
-- STORAGE BUCKET SETUP (Run this in Supabase Dashboard or via API)
-- ============================================================================

-- NOTE: You need to create the storage bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket named "community-videos"
-- 3. Set public: false (private)
-- 4. Max file size: 2147483648 (2GB)
-- 5. Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo, video/x-matroska

-- Storage policies will be added separately via Supabase Dashboard or API

