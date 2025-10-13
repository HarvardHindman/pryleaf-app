# Database Migrations for Community Platform

This directory contains SQL migrations to set up the community platform database schema.

## Migrations Overview

### 1. `20250113000001_create_community_tables.sql`
Creates all the core tables for the community platform:
- `communities` - Community/creator profiles
- `community_tiers` - Pricing tiers (Free, Premium, Elite, etc.)
- `community_memberships` - User subscriptions to communities
- `community_channels` - Chat channels within communities
- `community_content` - Videos, articles, and other content
- `content_views` - Analytics for content consumption
- `payments` - Payment transaction records
- `creator_payouts` - Creator payout records
- `moderation_log` - Audit log for moderation actions

Also includes triggers for auto-updating timestamps and counts.

### 2. `20250113000002_create_rls_policies.sql`
Sets up Row Level Security (RLS) policies to secure all data:
- Enables RLS on all tables
- Creates policies for read/write access
- Defines owner vs member vs public access
- Includes helper functions for access control

### 3. `20250113000003_seed_initial_data.sql` (Optional)
Seeds the database with sample data for testing:
- 2 sample communities
- Multiple tiers per community
- Sample channels
- Sample content
- **NOTE:** This is for development/testing only - remove or comment out for production

## How to Apply Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open each migration file and run them in order:
   - First: `20250113000001_create_community_tables.sql`
   - Second: `20250113000002_create_rls_policies.sql`
   - Third (optional): `20250113000003_seed_initial_data.sql`

### Option B: Via Supabase CLI

If you have the CLI linked to your project:

```bash
# Apply all migrations
npx supabase db push

# Or apply a specific migration
npx supabase db push --db-url "postgresql://..."
```

### Option C: Via psql

If you have direct database access:

```bash
psql postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/20250113000001_create_community_tables.sql

psql postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/20250113000002_create_rls_policies.sql

# Optional seed data
psql postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/20250113000003_seed_initial_data.sql
```

## Post-Migration Steps

### 1. Update Seed Data (if using)

In `20250113000003_seed_initial_data.sql`, replace placeholder user IDs:
```sql
'00000000-0000-0000-0000-000000000001'::uuid -- Replace with real user ID
```

To get real user IDs, query:
```sql
SELECT id, email FROM auth.users;
```

### 2. Verify Tables Were Created

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'communit%';

-- Should return:
-- communities
-- community_tiers
-- community_memberships
-- community_channels
-- community_content
-- content_views
-- creator_payouts
-- moderation_log
```

### 3. Verify RLS is Enabled

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'communit%';

-- rowsecurity should be 't' (true) for all tables
```

### 4. Test Access Control

```sql
-- Test helper functions
SELECT public.is_community_owner(
  '00000000-0000-0000-0000-000000000001'::uuid,  -- user_id
  '11111111-1111-1111-1111-111111111111'::uuid   -- community_id
);

SELECT public.get_user_tier_level(
  auth.uid(),  -- current user
  '11111111-1111-1111-1111-111111111111'::uuid   -- community_id
);
```

## Database Schema Diagram

```
auth.users (Supabase Auth)
    ↓
communities ←→ community_tiers
    ↓                ↓
    ├──→ community_memberships ←─ users
    ├──→ community_channels
    ├──→ community_content
    ├──→ content_views ←── users
    ├──→ payments ←── users
    ├──→ creator_payouts
    └──→ moderation_log
```

## Key Concepts

### Tier Levels
- `0` = Free (everyone)
- `1` = Premium (first paid tier)
- `2` = Elite (second paid tier)
- `3+` = Additional tiers as needed

### Membership Status
- `active` - Current subscriber with access
- `cancelled` - Cancelled but still has access until period end
- `expired` - Subscription ended, no access
- `paused` - Payment failed, grace period
- `pending` - Awaiting payment confirmation

### Access Control
Access is determined by comparing:
- User's `tier_level` (from their membership)
- Resource's `minimum_tier_level` (channel or content)
- Rule: `user_tier_level >= minimum_tier_level`

Special cases:
- Community owners always have full access (tier_level = 999)
- Non-members have tier_level = -1 (no access)

## Troubleshooting

### Error: "relation already exists"
Tables already exist. Either:
- Drop tables first: `DROP TABLE IF EXISTS public.communities CASCADE;`
- Or skip to next migration

### Error: "permission denied"
Make sure you're running as the `postgres` user or have sufficient privileges.

### RLS Blocking Everything
If you're testing and RLS is too restrictive:
```sql
-- Temporarily disable RLS (DEVELOPMENT ONLY!)
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
```

### Seed Data Foreign Key Errors
The seed data uses placeholder UUIDs for `owner_id`. Replace them with real user IDs from `auth.users`.

## Next Steps

After applying migrations:
1. Update your `.env.local` with the correct Supabase URL and keys
2. Test API routes for creating/reading communities
3. Integrate with Stripe for payment processing
4. Set up Stream Chat channel creation
5. Build the UI components

## Need Help?

- Check the main docs in `/docs/COMMUNITY_ARCHITECTURE.md`
- Review the technical spec in `/docs/COMMUNITY_TECHNICAL_SPEC.md`
- See implementation roadmap in `/docs/IMPLEMENTATION_ROADMAP.md`

