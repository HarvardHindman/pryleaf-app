# 🔧 Alpha Vantage API Limit Solution

## Problem Found ❌

Your Alpha Vantage API limit was being maxed out because of a **hourly news refresh cron job** running in Supabase:

```
Hourly cron job → 24 requests/day
User interactions → 1 request/day remaining
────────────────────────────────
Total: 25/25 requests (MAXED OUT!)
```

## Solution Applied ✅

### 1. **Created Migration to Disable Cron Job**
   - File: `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`
   - This will remove the hourly schedule
   - Optionally enables a twice-daily schedule (2 requests/day instead of 24)

### 2. **Added Rate Limiting Protection**
   - `src/app/api/news/refresh/route.ts` - Checks limit before refresh
   - `src/lib/newsService.ts` - Checks limit before API calls
   - System now protects against hitting the limit

### 3. **Created Helper Script**
   - File: `scripts/disable-news-cron.js`
   - Easy way to apply the fix

## Quick Fix (Choose One Method)

### Method 1: Run the Script (Easiest)
```bash
node scripts/disable-news-cron.js
```

### Method 2: Apply Migration via Supabase Dashboard
1. Go to https://app.supabase.com
2. Open your project
3. Go to "SQL Editor"
4. Copy contents of `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`
5. Paste and run

### Method 3: Use Supabase CLI
```bash
npx supabase db push
```

## Verify It Worked

Run this in Supabase SQL Editor:
```sql
-- Should return 0 rows (no news cron jobs)
SELECT * FROM cron.job WHERE jobname LIKE '%news%';

-- Check your current API usage
SELECT * FROM public.get_today_api_usage();
```

## New Allocation (After Fix)

```
News refresh (optional) → 2 requests/day (9 AM & 5 PM)
User ticker lookups    → 15 requests/day
Manual operations      → 5 requests/day
Buffer/Safety          → 3 requests/day
──────────────────────────────────────────
Total: 25 requests/day ✅
```

## Manual News Refresh (When Needed)

You can still manually trigger news refresh:

**Via API:**
```bash
curl -X POST https://your-domain.com/api/news/refresh \
  -H "Content-Type: application/json"
```

**Via Browser Console (when logged in as admin):**
```javascript
fetch('/api/news/refresh', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## Optional: Enable Twice-Daily Auto-Refresh

If you want automatic news updates but less frequently:

1. Edit `supabase/migrations/20250205000001_disable_hourly_news_cron.sql`
2. Find the commented section (lines with `/*` and `*/`)
3. Uncomment it
4. Replace `YOUR_DOMAIN.com` with your actual domain
5. Replace `YOUR_CRON_SECRET` with your secret from `.env.local`
6. Run the migration again

This will refresh news at **9 AM and 5 PM** (only 2 API calls/day).

## Monitoring API Usage

Add this component to your admin dashboard:

```typescript
// Example: Check API usage
const { data } = await supabase.rpc('get_today_api_usage');
console.log('API Usage:', data);
```

## What Changed?

**Before:**
- ❌ Hourly cron job running 24/7
- ❌ 24 requests used automatically
- ❌ Only 1 request left for users
- ❌ No rate limit protection

**After:**
- ✅ Cron job disabled (or 2x daily if you enable it)
- ✅ Rate limiting checks before API calls
- ✅ 23+ requests available for users
- ✅ Manual refresh still available

## Need More Requests?

Consider:
1. **Upgrade Alpha Vantage Plan**
   - Premium: 30-75 requests/day
   - Ultra: 150-1200 requests/day

2. **Aggressive Caching**
   - Cache quotes for 1-2 hours
   - Only refresh on user request

3. **Alternative Data Sources**
   - Yahoo Finance (free, unlimited)
   - IEX Cloud (affordable plans)
   - Polygon.io (good for stocks)

## Documentation

📖 Full details: `docs/API_RATE_LIMIT_FIX.md`

## Questions?

- Check current usage: `SELECT * FROM public.get_today_api_usage();`
- View cron jobs: `SELECT * FROM cron.job;`
- Reset usage counter: `SELECT public.reset_api_usage();` (testing only)

---

**Status: ✅ Solution Ready to Apply**

Run `node scripts/disable-news-cron.js` to fix the issue now!

