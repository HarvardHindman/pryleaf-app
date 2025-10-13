-- Seed Data for Community Platform
-- This creates sample communities, tiers, and data for testing

-- NOTE: This is for development/testing only
-- In production, you would remove this migration or comment it out

-- ============================================================================
-- SEED COMMUNITIES (using placeholder UUIDs - replace with real user IDs)
-- ============================================================================

-- Insert sample communities
-- NOTE: Replace the owner_id values with actual user IDs from auth.users after you have real users

INSERT INTO public.communities (id, owner_id, name, handle, description, long_description, specialty, category, verified, status) 
VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid, -- Replace with real user ID
        'Sarah''s Options Trading Academy',
        'sarahtrader',
        'Professional options trader with 15+ years experience',
        '# Welcome to Sarah''s Options Trading Academy

I''ve been trading options professionally for over 15 years, and I''m here to share everything I''ve learned with you.

## What You''ll Learn
- Advanced options strategies
- Risk management techniques
- Market analysis and timing
- Portfolio optimization

## My Background
- Former institutional trader
- 15+ years of experience
- Consistent profitability
- Proven track record

Join our community to learn from real trading experience!',
        'Options Trading',
        'Options Trading',
        true,
        'active'
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid, -- Replace with real user ID
        'Marcus''s Technical Analysis Hub',
        'marcusanalyst',
        'Technical analysis expert and market strategist',
        '# Technical Analysis Made Simple

Master the art of reading charts and predicting market movements.

## What We Cover
- Chart patterns and indicators
- Support and resistance levels
- Trend analysis
- Entry and exit strategies

Join us to become a proficient technical analyst!',
        'Technical Analysis',
        'Technical Analysis',
        true,
        'active'
    );

-- ============================================================================
-- SEED COMMUNITY TIERS
-- ============================================================================

-- Tiers for Sarah's Options Trading Academy
INSERT INTO public.community_tiers (community_id, name, description, price_monthly, price_yearly, tier_level, features, perks, sort_order) 
VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Free',
        'Get started with basic options knowledge',
        0,
        0,
        0,
        '[
            {"name": "Free Content", "description": "Access to free videos and articles", "enabled": true},
            {"name": "Community Chat", "description": "Join the general discussion", "enabled": true},
            {"name": "Weekly Updates", "description": "Market outlook every Monday", "enabled": true}
        ]'::jsonb,
        ARRAY['Access to free content library', 'General chat channel', 'Weekly market updates'],
        0
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Premium',
        'Serious options traders who want to level up',
        4900, -- $49.00
        49900, -- $499.00/year (save ~15%)
        1,
        '[
            {"name": "All Free Features", "description": "Everything from Free tier", "enabled": true},
            {"name": "Premium Videos", "description": "Advanced strategy courses", "enabled": true},
            {"name": "Trading Signals", "description": "Weekly options trade ideas", "enabled": true},
            {"name": "Premium Chat", "description": "Exclusive member discussions", "enabled": true},
            {"name": "Live Q&A", "description": "Monthly live sessions", "enabled": true}
        ]'::jsonb,
        ARRAY['All free features', '50+ premium video courses', 'Weekly trading signals', 'Premium-only chat', 'Monthly live Q&A sessions'],
        1
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Elite',
        'For dedicated traders seeking mastery',
        9900, -- $99.00
        99900, -- $999.00/year (save ~16%)
        2,
        '[
            {"name": "All Premium Features", "description": "Everything from Premium tier", "enabled": true},
            {"name": "Elite Content", "description": "Advanced masterclasses", "enabled": true},
            {"name": "1-on-1 Sessions", "description": "Monthly private coaching", "enabled": true},
            {"name": "Real-Time Signals", "description": "Live trade alerts", "enabled": true},
            {"name": "Portfolio Review", "description": "Personalized portfolio analysis", "enabled": true}
        ]'::jsonb,
        ARRAY['All premium features', 'Elite-only content', 'Monthly 1-on-1 coaching', 'Real-time trading alerts', 'Quarterly portfolio reviews', 'Priority support'],
        2
    );

-- Tiers for Marcus's Technical Analysis Hub
INSERT INTO public.community_tiers (community_id, name, description, price_monthly, price_yearly, tier_level, features, perks, sort_order) 
VALUES
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'Free',
        'Start learning technical analysis basics',
        0,
        0,
        0,
        '[
            {"name": "Basic TA Content", "description": "Fundamental technical analysis videos", "enabled": true},
            {"name": "Community Access", "description": "Join the discussion", "enabled": true}
        ]'::jsonb,
        ARRAY['Free technical analysis content', 'Community chat access'],
        0
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'Premium',
        'Advanced technical analysis education',
        3900, -- $39.00
        39900, -- $399.00/year
        1,
        '[
            {"name": "All Free Features", "description": "Everything from Free tier", "enabled": true},
            {"name": "Advanced Patterns", "description": "Learn complex chart patterns", "enabled": true},
            {"name": "Weekly Setups", "description": "Chart analysis and trade ideas", "enabled": true},
            {"name": "Indicator Library", "description": "Custom indicators and scripts", "enabled": true}
        ]'::jsonb,
        ARRAY['All free features', 'Advanced pattern recognition', 'Weekly chart setups', 'Custom indicator library', 'Premium chat'],
        1
    );

-- ============================================================================
-- SEED CHANNELS
-- ============================================================================

-- Channels for Sarah's Options Trading Academy
INSERT INTO public.community_channels (community_id, stream_channel_id, name, description, minimum_tier_level, channel_type, sort_order) 
VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'community_11111111-1111-1111-1111-111111111111_announcements',
        'announcements',
        'Important updates and announcements from Sarah',
        0,
        'announcement',
        0
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'community_11111111-1111-1111-1111-111111111111_general',
        'general',
        'General discussion for all members',
        0,
        'text',
        1
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'community_11111111-1111-1111-1111-111111111111_premium-chat',
        'premium-chat',
        'Exclusive chat for Premium and Elite members',
        1,
        'text',
        2
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'community_11111111-1111-1111-1111-111111111111_elite-lounge',
        'elite-lounge',
        'Elite members only - advanced discussions',
        2,
        'text',
        3
    );

-- Channels for Marcus's Technical Analysis Hub
INSERT INTO public.community_channels (community_id, stream_channel_id, name, description, minimum_tier_level, channel_type, sort_order) 
VALUES
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'community_22222222-2222-2222-2222-222222222222_announcements',
        'announcements',
        'Updates from Marcus',
        0,
        'announcement',
        0
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'community_22222222-2222-2222-2222-222222222222_general',
        'general',
        'General technical analysis discussion',
        0,
        'text',
        1
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'community_22222222-2222-2222-2222-222222222222_chart-analysis',
        'chart-analysis',
        'Premium members share and discuss chart setups',
        1,
        'text',
        2
    );

-- ============================================================================
-- SEED SAMPLE CONTENT
-- ============================================================================

-- Sample content for Sarah's community
INSERT INTO public.community_content (community_id, creator_id, title, description, content_type, content_url, thumbnail_url, minimum_tier_level, is_published, published_at, duration) 
VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Introduction to Options Trading',
        'Learn the fundamentals of options trading in this beginner-friendly video',
        'video',
        'https://example.com/videos/intro-to-options',
        'https://example.com/thumbnails/intro.jpg',
        0, -- Free
        true,
        NOW(),
        1842 -- 30:42 in seconds
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Advanced Options Strategies',
        'Deep dive into complex options strategies like iron condors, butterflies, and more',
        'video',
        'https://example.com/videos/advanced-strategies',
        'https://example.com/thumbnails/advanced.jpg',
        1, -- Premium
        true,
        NOW(),
        2875 -- 47:55 in seconds
    ),
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Elite Trading Masterclass',
        'Exclusive masterclass on institutional-level options trading strategies',
        'video',
        'https://example.com/videos/elite-masterclass',
        'https://example.com/thumbnails/elite.jpg',
        2, -- Elite
        true,
        NOW(),
        4320 -- 72:00 in seconds
    );

-- Sample content for Marcus's community
INSERT INTO public.community_content (community_id, creator_id, title, description, content_type, content_url, thumbnail_url, minimum_tier_level, is_published, published_at, duration) 
VALUES
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        'Chart Patterns 101',
        'Learn to identify and trade the most common chart patterns',
        'video',
        'https://example.com/videos/chart-patterns-101',
        'https://example.com/thumbnails/patterns.jpg',
        0, -- Free
        true,
        NOW(),
        1560 -- 26:00 in seconds
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        'Advanced Technical Indicators',
        'Master RSI, MACD, Bollinger Bands, and more',
        'video',
        'https://example.com/videos/advanced-indicators',
        'https://example.com/thumbnails/indicators.jpg',
        1, -- Premium
        true,
        NOW(),
        2640 -- 44:00 in seconds
    );

-- ============================================================================
-- UPDATE SUBSCRIBER COUNTS (simulate some members)
-- ============================================================================

UPDATE public.communities SET subscriber_count = 45600 WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
UPDATE public.communities SET subscriber_count = 32100 WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.communities IS 'Sample seed data - replace owner_id with real user IDs';

