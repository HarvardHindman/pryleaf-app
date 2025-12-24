# 🚀 Pryleaf Caching System - Quick Reference

## ⚡ Quick Status Check

```sql
-- One-line health check
SELECT public.get_cache_health_dashboard();
```

## 🔄 Manual Refresh Commands

### Via Edge Function (Recommended)
```bash
curl -X POST https://mjxtzwekczanotbgxjuz.supabase.co/functions/v1/refresh-quotes \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Via Next.js API
```bash
curl -X POST http://localhost:3000/api/quotes/refresh \
  -H "x-api-key: YOUR_CRON_SECRET" \
  -d '{"staleOnly": true, "ageMinutes": 60}'
```

### Via SQL (Health Check Only)
```sql
SELECT public.cron_refresh_portfolio_quotes();
```

## 📊 Key Metrics

```sql
-- Cache statistics
SELECT * FROM public.get_quote_cache_stats();

-- API usage today
SELECT 
  requests_used, 
  requests_limit,
  (requests_limit - requests_used) as remaining
FROM api_usage_tracking 
WHERE date = CURRENT_DATE;

-- Recent refreshes
SELECT 
  started_at,
  status,
  symbols_processed,
  api_calls_made,
  duration_seconds
FROM quote_refresh_log 
ORDER BY started_at DESC 
LIMIT 5;

-- Active portfolio stocks
SELECT public.get_active_portfolio_symbols();
```

## 🎯 Common Operations

### View Cached Quotes
```sql
SELECT 
  symbol,
  price,
  change,
  change_percent,
  last_updated,
  EXTRACT(EPOCH FROM (NOW() - last_updated))/60 as age_minutes
FROM stock_quotes
ORDER BY last_updated DESC;
```

### Find Stale Quotes
```sql
SELECT public.get_stale_quote_symbols(60); -- Older than 60 minutes
```

### Clear Old Cache
```sql
SELECT public.clear_stale_cache(7); -- Older than 7 days
```

### Check Cron Schedule
```sql
SELECT 
  jobname,
  schedule,
  active,
  command
FROM cron.job;
```

### View Cron History
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = 2
ORDER BY start_time DESC 
LIMIT 10;
```

## 🔧 Troubleshooting

### Reset API Usage (Emergency Only)
```sql
UPDATE api_usage_tracking 
SET requests_used = 0 
WHERE date = CURRENT_DATE;
```

### View Failed Refreshes
```sql
SELECT 
  started_at,
  error_message,
  symbols_requested,
  symbols_processed
FROM quote_refresh_log 
WHERE status = 'failed'
ORDER BY started_at DESC;
```

### Test Cache Functions
```sql
-- Test bulk upsert
SELECT public.bulk_upsert_stock_quotes('[
  {
    "symbol": "TEST",
    "price": "100.50",
    "open": "100.00",
    "high": "101.00",
    "low": "99.50",
    "volume": "1000000",
    "latest_trading_day": "2025-11-21",
    "previous_close": "99.75",
    "change": "0.75",
    "change_percent": "0.75%"
  }
]'::jsonb);

-- Verify
SELECT * FROM stock_quotes WHERE symbol = 'TEST';

-- Clean up
DELETE FROM stock_quotes WHERE symbol = 'TEST';
```

## 📈 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Cache Hit Rate | > 90% | ✅ |
| API Calls/Day | < 20 | ✅ |
| Avg Response Time | < 100ms | ✅ |
| Fresh Quote % | > 80% | ✅ |

## 🚨 Alerts Setup (Optional)

Monitor these metrics:
- `requests_used > 20` (approaching limit)
- `stale_quotes / total_symbols > 0.5` (cache degraded)
- `failed refreshes > 3 in 24h` (refresh issues)

## 🔗 Quick Links

- **Health Dashboard:** `SELECT public.get_cache_health_dashboard();`
- **Edge Function:** https://mjxtzwekczanotbgxjuz.supabase.co/functions/v1/refresh-quotes
- **API Refresh:** /api/quotes/refresh
- **Full Docs:** See CACHING_SYSTEM.md

## 📞 Need Help?

1. Check `quote_refresh_log` for errors
2. Verify API usage isn't exceeded
3. Test Edge Function manually
4. Review CACHING_SYSTEM.md for details

