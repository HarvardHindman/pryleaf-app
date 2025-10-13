# Apply Migrations to Supabase

## Step-by-Step Guide

### Step 1: Open Supabase Dashboard
Visit: https://app.supabase.com/project/mjxtzwekczanotbgxjuz

### Step 2: Go to SQL Editor
Click "SQL Editor" in the left sidebar

### Step 3: Apply Each Migration

#### Migration 1: Create Tables
1. Click "+ New Query"
2. Open file: `supabase/migrations/20250113000001_create_community_tables.sql`
3. Copy ENTIRE contents
4. Paste into SQL Editor
5. Click "RUN" button (bottom right)
6. ✅ You should see "Success. No rows returned"

#### Migration 2: Security Policies
1. Click "+ New Query" (new query tab)
2. Open file: `supabase/migrations/20250113000002_create_rls_policies.sql`
3. Copy ENTIRE contents
4. Paste into SQL Editor
5. Click "RUN"
6. ✅ You should see "Success. No rows returned"

#### Migration 3: Sample Data (Optional)
1. Click "+ New Query" (new query tab)
2. Open file: `supabase/migrations/20250113000003_seed_initial_data.sql`
3. Copy ENTIRE contents
4. Paste into SQL Editor
5. Click "RUN"
6. ✅ You should see "Success" (may show rows inserted)

### Step 4: Verify Tables Were Created

Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'communit%'
ORDER BY table_name;
```

**You should see 9 tables:**
- communities
- community_channels
- community_content
- community_memberships
- community_tiers
- content_views
- creator_payouts
- moderation_log
- payments

### Step 5: Verify RLS is Enabled

Run this query:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'communit%';
```

**All tables should show `rowsecurity = t` (true)**

### Step 6: Restart Your Dev Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 7: Test!

Visit: http://localhost:3000/community

You should now see the community browse page without errors!

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already exist. Skip to next migration.

### Error: "permission denied"
**Solution:** Make sure you're logged into Supabase dashboard with correct account.

### Error: "syntax error"
**Solution:** Make sure you copied the ENTIRE file contents, including the first and last lines.

### Still seeing "table not found"
**Solution:** 
1. Check Supabase dashboard → Table Editor
2. Verify tables exist there
3. Restart your dev server
4. Clear browser cache

---

## Quick Verification

After applying migrations, this query should return communities:
```sql
SELECT * FROM communities LIMIT 5;
```

If you see results (or "No rows"), the table exists! ✅
If you see "relation does not exist", migrations didn't apply.

