# Caching System - Quick Reference

## 🚀 Quick Start

### Check System Health
```sql
SELECT * FROM get_quote_cache_stats();
```

### Manual Refresh via API
```bash
curl -X POST https://your-app.com/api/quotes/refresh \
  -H "x-api-key: YOUR_CRON_SECRET"
```

### Check Cron Job Status
```sql
-- View active cron jobs
SELECT * FROM cron.job WHERE active = true;

-- View recent runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 5;
```

---

## 📊 Cache Tables

| Table | Purpose | TTL |
|-------|---------|-----|
| `stock_quotes` | Real-time quotes | 10-60 min |
| `stock_cache` | Company data, time series | 5-60 min |
| `api_usage_tracking` | Rate limiting | Daily |
| `quote_refresh_log` | Audit trail | Permanent |

---

## 🔧 Essential Functions

```sql
-- Get active portfolio symbols
SELECT get_active_portfolio_symbols();

-- Find stale quotes (> 1 hour)
SELECT get_stale_quote_symbols(60);

-- Bulk update quotes
SELECT * FROM bulk_upsert_stock_quotes('[...]'::jsonb);

-- Check API usage today
SELECT * FROM api_usage_tracking WHERE date = CURRENT_DATE;

-- Cache statistics
SELECT * FROM get_quote_cache_stats();
```

---

## ⏰ Cron Schedule

**Job Name:** `refresh-portfolio-quotes-hourly`  
**Schedule:** `0 * * * *` (Every hour at :00)  
**Status:** ✅ Active  

```sql
-- Reschedule cron job
SELECT cron.unschedule('refresh-portfolio-quotes-hourly');
SELECT cron.schedule(
  'refresh-portfolio-quotes-hourly',
  '0 * * * *',
  $$SELECT public.cron_refresh_portfolio_quotes();$$
);
```

---

## 🔍 Common Queries

### Clear Stale Cache
```sql
DELETE FROM stock_quotes 
WHERE last_updated < NOW() - INTERVAL '2 hours';
```

### Clear Specific Symbol
```sql
DELETE FROM stock_quotes WHERE symbol = 'AAPL';
DELETE FROM stock_cache WHERE symbol = 'AAPL';
```

### View Recent Refresh Logs
```sql
SELECT 
  started_at,
  status,
  symbols_requested,
  symbols_processed,
  duration_seconds,
  error_message
FROM quote_refresh_log
ORDER BY started_at DESC
LIMIT 10;
```

### Check Failed Refreshes
```sql
SELECT * FROM quote_refresh_log 
WHERE status = 'failed'
ORDER BY started_at DESC;
```

---

## 🚨 Troubleshooting

### Cron Not Running
```sql
-- Check extension
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job status
SELECT jobid, jobname, active, schedule 
FROM cron.job;

-- View errors
SELECT * FROM cron.job_run_details 
WHERE status = 'failed';
```

### API Limit Reached
```sql
-- Check usage
SELECT * FROM api_usage_tracking WHERE date = CURRENT_DATE;

-- Reset (testing only!)
UPDATE api_usage_tracking 
SET requests_used = 0 
WHERE date = CURRENT_DATE;
```

### Cache Not Updating
```sql
-- Check last updates
SELECT symbol, last_updated, 
  EXTRACT(EPOCH FROM (NOW() - last_updated))/60 as age_minutes
FROM stock_quotes
ORDER BY last_updated DESC;

-- Force clear and refresh
DELETE FROM stock_quotes;
-- Next API request will populate cache
```

---

## 📈 Monitoring Dashboard

**API Endpoint:** `GET /api/quotes/refresh`

Returns:
- Total symbols cached
- Fresh/stale quote counts
- Average cache age
- Recent refresh operations
- API usage stats

---

## 🔐 Environment Variables

```bash
ALPHA_VANTAGE_API_KEY=your_key_here
CRON_SECRET=your_secure_secret
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## 📞 Quick Help

- **Cache not working?** Run: `SELECT * FROM get_quote_cache_stats();`
- **Cron not running?** Check: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 1;`
- **API errors?** View: `SELECT * FROM quote_refresh_log WHERE status = 'failed' ORDER BY started_at DESC;`

---

**For full documentation, see:** [CACHING_SYSTEM.md](./CACHING_SYSTEM.md)


















