# 📰 News System Setup Guide

## 🔍 Problem Identified

Your news cache is **empty**! Here's why users see "No news articles found":

1. ✅ Alpha Vantage News API **works** (tested with MCP - got 50 live articles)
2. ✅ Supabase tables **exist** (`news_articles`, `news_refresh_log`)
3. ✅ Database functions **work** (`get_news_articles`, etc.)
4. ❌ News cache is **empty** - never been populated
5. ❌ `CRON_SECRET` is **missing** from `.env.local`

## 🛠️ Fix Steps

### Step 1: Add CRON_SECRET to .env.local

Add this line to your `.env.local` file:

```bash
CRON_SECRET=pryleaf_cron_secret_2025_secure_key_change_in_production
```

**Your complete `.env.local` should have:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mjxtzwekczanotbgxjuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
CRON_SECRET=pryleaf_cron_secret_2025_secure_key_change_in_production
```

⚠️ **Important:** Change `CRON_SECRET` value to something secure in production!

### Step 2: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
npm run dev
```

### Step 3: Populate News Cache

**Option A: Using the Test Script (Easiest)**

```bash
npx tsx scripts/test-news-refresh.ts
```

**Option B: Using cURL**

```bash
curl -X POST http://localhost:3000/api/news/refresh \
  -H "x-api-key: pryleaf_cron_secret_2025_secure_key_change_in_production" \
  -H "Content-Type: application/json" \
  -d '{"topics": ["technology", "earnings", "financial_markets"], "limit": 200}'
```

**Option C: Using Postman/Thunder Client**

- Method: `POST`
- URL: `http://localhost:3000/api/news/refresh`
- Headers:
  - `x-api-key`: `pryleaf_cron_secret_2025_secure_key_change_in_production`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "topics": ["technology", "earnings", "financial_markets"],
  "limit": 200
}
```

### Step 4: Verify It Worked

```bash
# Check cache status
curl http://localhost:3000/api/news

# Or check Supabase directly
SELECT COUNT(*) FROM news_articles;
```

You should see articles returned!

---

## 🔄 How News System Works

### Data Flow:

```
1. Cron Job (hourly) → /api/news/refresh → Alpha Vantage API
2. Alpha Vantage → Returns news articles
3. Articles saved → Supabase news_articles table
4. Users visit news page → /api/news → Returns cached articles
```

### Important Files:

- **News API Route:** `src/app/api/news/route.ts` - Fetches FROM cache
- **Refresh Endpoint:** `src/app/api/news/refresh/route.ts` - Populates cache
- **News Service:** `src/lib/newsService.ts` - Business logic
- **News Component:** `src/components/research/NewsTab.tsx` - UI

### Database Tables:

- `news_articles` - Cached news articles with sentiment
- `news_refresh_log` - Refresh history and status

---

## 🤖 Setting Up Automated Refresh

### Option 1: Apply News Cron Migration

The migration already exists but hasn't been applied:
- File: `supabase/migrations/20250132000002_create_news_cron_job.sql`
- What it does: Sets up hourly news refresh via pg_cron

**To apply:**
```bash
# Option A: Via MCP (if available)
# Use the apply_migration tool

# Option B: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/mjxtzwekczanotbgxjuz/sql/new
2. Copy contents from migration file
3. Run SQL
4. Update the cron job with your actual domain and CRON_SECRET
```

### Option 2: External Cron (e.g., Vercel Cron, GitHub Actions)

**Vercel Cron (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/news/refresh",
      "schedule": "0 * * * *"
    }
  ]
}
```

**GitHub Actions (.github/workflows/refresh-news.yml):**
```yaml
name: Refresh News Cache
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger News Refresh
        run: |
          curl -X POST https://your-domain.com/api/news/refresh \
            -H "x-api-key: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

---

## 📊 Monitoring & Troubleshooting

### Check Cache Stats:

```bash
# Via API
curl http://localhost:3000/api/news/refresh

# Via Supabase
SELECT * FROM get_news_cache_stats();
SELECT * FROM get_news_health_dashboard();
```

### Check Refresh History:

```sql
SELECT * FROM news_refresh_log ORDER BY started_at DESC LIMIT 10;
```

### Common Issues:

**"No news articles found"**
- Cache is empty - run refresh endpoint
- Check `SELECT COUNT(*) FROM news_articles;`

**"Missing Supabase credentials"**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart dev server

**"Unauthorized" on /api/news/refresh**
- Add `CRON_SECRET` to `.env.local`
- Use correct value in x-api-key header

**"API rate limit exceeded"**
- Alpha Vantage free tier: 25 calls/day
- Check: `SELECT * FROM api_usage_tracking WHERE date = CURRENT_DATE;`
- Wait until tomorrow or upgrade API plan

---

## 🎯 Quick Start Checklist

- [ ] Add `CRON_SECRET` to `.env.local`
- [ ] Restart dev server
- [ ] Run `npx tsx scripts/test-news-refresh.ts`
- [ ] Verify articles: `curl http://localhost:3000/api/news`
- [ ] Visit news page in your app
- [ ] Set up cron job for automated refresh (optional)

---

## 🚀 Production Deployment

1. **Add environment variables to hosting platform:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALPHA_VANTAGE_API_KEY`
   - `CRON_SECRET` (generate a secure random string)

2. **Set up automated cron job:**
   - Vercel Cron (easiest)
   - Supabase pg_cron (apply migration)
   - External cron service

3. **Initial cache population:**
   ```bash
   curl -X POST https://your-domain.com/api/news/refresh \
     -H "x-api-key: YOUR_PRODUCTION_CRON_SECRET"
   ```

4. **Monitor:**
   - Check `/api/news/refresh` (GET) for health dashboard
   - Set up alerting for failed refresh jobs
   - Monitor API usage: 25/day limit on free tier

---

## 📈 Optimization Tips

- **Rate Limiting:** Free tier = 25 calls/day. Each refresh = 1-2 calls depending on filters.
- **Caching Duration:** News articles cached for 7 days by default (configurable via `hoursAgo` parameter).
- **Stale Data:** Consider refreshing hourly during market hours, less frequently after hours.
- **Performance:** News fetches from Supabase cache (fast), not Alpha Vantage API.

---

**Need Help?**
- Check logs: Server console when calling `/api/news/refresh`
- Check Supabase logs: Supabase Dashboard → Logs → API
- Test MCP: `mcp_alphavantage_NEWS_SENTIMENT` with a ticker

