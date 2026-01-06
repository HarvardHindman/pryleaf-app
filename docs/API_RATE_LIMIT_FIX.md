# API Rate Limit Fix - News Cron Job

## Problem
The hourly news refresh cron job was consuming **24 of your 25 daily Alpha Vantage API requests**, leaving only 1 request for actual user interactions.

## Solution Applied

### 1. Disabled Hourly Cron Job ✅
Created migration: `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`

This migration will:
- Disable the `refresh-news-hourly` cron job
- Free up 24 API calls per day
- Optionally enable a twice-daily schedule (9 AM & 5 PM) = 2 API calls/day

### 2. Added Rate Limiting Protection ✅
Updated files:
- `src/app/api/news/refresh/route.ts` - Checks rate limit before refreshing
- `src/lib/newsService.ts` - Checks rate limit before making API calls

Now the system will:
- Check current API usage before making requests
- Skip refresh if less than 2 requests remaining
- Log API usage stats for monitoring

## How to Apply the Fix

### Step 1: Run the Migration

**Option A: Using Supabase CLI (Recommended)**
```bash
npx supabase db push
```

**Option B: Using the Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`
4. Run the query

**Option C: Using the apply-migrations script**
```bash
node scripts/apply-migrations.js
```

### Step 2: Verify the Cron Job is Disabled

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%news%';
```

You should see either:
- No results (job completely removed) ✅
- Or job with `active = false` ✅

### Step 3: Check Current API Usage

Run this query to see your current API usage:
```sql
SELECT * FROM public.get_today_api_usage();
```

Or check via the API:
```bash
curl https://your-domain.com/api/news/refresh
```

### Step 4: (Optional) Enable Twice-Daily Refresh

If you want automatic news refresh but less frequently:

1. Edit `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`
2. Uncomment the "twice-daily" schedule section (lines with `/*` and `*/`)
3. Replace `YOUR_DOMAIN.com` with your actual domain
4. Replace `YOUR_CRON_SECRET` with your cron secret from `.env.local`
5. Run the migration again

## Manual News Refresh

You can manually trigger news refresh when needed:

**Via API:**
```bash
curl -X POST https://your-domain.com/api/news/refresh \
  -H "x-api-key: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"topics": ["technology", "earnings"], "limit": 200}'
```

**Via Code:**
```typescript
import { newsCache } from '@/cache';

const result = await newsCache.refreshNewsCache({
  topics: ['technology', 'earnings'],
  limit: 200
});
```

## Monitoring API Usage

### View Usage Dashboard
```sql
-- Get today's usage
SELECT * FROM public.get_today_api_usage();

-- View usage history
SELECT * FROM public.api_usage_tracking ORDER BY date DESC LIMIT 30;
```

### Reset Usage Counter (Testing Only)
```sql
SELECT public.reset_api_usage();
```

## Recommended Schedule

With 25 requests/day limit, here's a recommended allocation:

| Activity | Requests/Day | Notes |
|----------|-------------|--------|
| News refresh | 2 | 9 AM & 5 PM updates |
| User ticker lookups | 15 | Cached for 1 hour |
| Manual operations | 5 | Research, testing |
| Buffer | 3 | Safety margin |
| **Total** | **25** | |

## Best Practices

1. **Cache Aggressively** - Use 1-hour cache for stock quotes
2. **Batch Requests** - Use bulk quote API when possible
3. **Monitor Usage** - Check `api_usage_tracking` table regularly
4. **Manual Refresh** - Only refresh news when actually needed
5. **User Education** - Inform users that data updates periodically

## Troubleshooting

### Still hitting rate limit?

Check for other API calls:
```bash
# Search for direct Alpha Vantage API calls
grep -r "alphavantage.co" src/
grep -r "ALPHA_VANTAGE" src/
```

### Want to increase limit?

Upgrade your Alpha Vantage plan:
- Free: 25 requests/day
- Premium: 30-75 requests/day  
- Ultra: 150-1200 requests/day

### Need more frequent updates?

Consider:
1. Upgrade Alpha Vantage plan
2. Use WebSockets for real-time data (separate service)
3. Implement user-triggered refresh only
4. Cache more aggressively (2-4 hours)

## Summary

✅ Disabled hourly cron (saved 24 API calls/day)
✅ Added rate limiting checks
✅ Protected against hitting the limit
✅ Manual refresh still available
✅ Optional twice-daily schedule

**Result:** You now have ~23 API requests available per day for actual user interactions!

