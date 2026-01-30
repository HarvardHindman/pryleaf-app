-- Add onboarding tracking fields to user_profiles table
-- This supports the community onboarding flow by tracking:
-- - onboarding_completed: Whether user has completed the initial onboarding flow
-- - onboarding_dismissed_at: When user last dismissed the community prompt (for persistent reminders)

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

-- Add index for efficient querying of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed 
ON user_profiles(onboarding_completed) 
WHERE onboarding_completed = FALSE;

-- Add comment explaining the fields
COMMENT ON COLUMN user_profiles.onboarding_completed IS 
'Indicates whether the user has completed the initial onboarding flow';

COMMENT ON COLUMN user_profiles.onboarding_dismissed_at IS 
'Timestamp of when the user last dismissed the community onboarding prompt';
