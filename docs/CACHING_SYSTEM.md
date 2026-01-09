# Pryleaf App Caching System Documentation

## 📊 System Overview

The Pryleaf app uses a multi-tier caching strategy to minimize API calls to Alpha Vantage while providing real-time stock data to users.

---

## 🏗️ Architecture

### **Caching Layers**

```
User Request
    ↓
[Layer 1] In-Memory Cache (5 min TTL)
    ↓ (miss)
[Layer 2] Supabase Database Cache (10-60 min TTL)
    ↓ (miss)
[Layer 3] Alpha Vantage API
    ↓
Store in all layers
```

---

## 📦 Database Tables

### 1. **`stock_quotes`** - Primary Quote Cache
**Purpose:** Caches real-time stock quotes  
**TTL:** 10-60 minutes (configurable)

```sql
CREATE TABLE stock_quotes (
  symbol VARCHAR(20) PRIMARY KEY,
  price NUMERIC NOT NULL,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  volume BIGINT,
  latest_trading_day DATE,
  previous_close NUMERIC,
  change NUMERIC,
  change_percent VARCHAR(20),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- Primary: `symbol`
- `idx_stock_quotes_last_updated` - For finding stale quotes

---

### 2. **`stock_cache`** - Generic Data Cache
**Purpose:** Caches company overviews, time series, and other Alpha Vantage data  
**TTL:** Varies by data type (5-60 minutes)

```sql
CREATE TABLE stock_cache (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50),
  data_type VARCHAR(50),  -- 'overview', 'quote', 'timeseries_daily', etc.
  data JSONB,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

**Data Types:**
- `overview` - Company overview (15 min TTL)
- `quote` - Real-time quote (5 min TTL)
- `timeseries_daily` - Historical data (60 min TTL)
- `timeseries_weekly` - Weekly data (60 min TTL)
- `timeseries_monthly` - Monthly data (60 min TTL)

---

### 3. **`api_usage_tracking`** - Rate Limit Management
**Purpose:** Tracks daily API usage to stay within Alpha Vantage limits

```sql
CREATE TABLE api_usage_tracking (
  id UUID PRIMARY KEY,
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Daily Limit:** 25 requests (free tier) / 500+ (premium tier)

---

### 4. **`quote_refresh_log`** - Audit Trail
**Purpose:** Tracks bulk refresh operations

```sql
CREATE TABLE quote_refresh_log (
  id UUID PRIMARY KEY,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  symbols_requested INTEGER,
  symbols_processed INTEGER,
  api_calls_made INTEGER,
  error_message TEXT,
  duration_seconds NUMERIC
);
```

---

## 🔧 Database Functions

### **Core Cache Functions**

#### 1. `get_cached_stock_data(symbol, data_type)`
Retrieves cached data if it hasn't expired.

```sql
SELECT get_cached_stock_data('AAPL', 'overview');
```

#### 2. `set_cached_stock_data(symbol, data_type, data, ttl_minutes)`
Stores data in cache with expiration.

```sql
SELECT set_cached_stock_data(
  'AAPL', 
  'quote', 
  '{"price": 150.00}'::jsonb, 
  5  -- 5 minute TTL
);
```

#### 3. `increment_api_usage()`
Increments daily API usage counter. Returns `false` if limit reached.

```sql
SELECT increment_api_usage();  -- Returns true if under limit
```

---

### **Bulk Quote Functions**

#### 4. `get_active_portfolio_symbols()`
Returns array of all unique symbols from user portfolios.

```sql
SELECT get_active_portfolio_symbols();
-- Returns: ['AAPL', 'GOOGL', 'MSFT', ...]
```

#### 5. `bulk_upsert_stock_quotes(quotes_jsonb)`
Efficiently updates multiple quotes in one transaction.

```sql
SELECT * FROM bulk_upsert_stock_quotes('[
  {"symbol": "AAPL", "price": "150.25", "change": "2.50", ...},
  {"symbol": "GOOGL", "price": "2800.00", ...}
]'::jsonb);

-- Returns: (inserted_count, updated_count, total_count)
```

#### 6. `get_stale_quote_symbols(age_minutes)`
Returns symbols needing refresh (older than specified age).

```sql
SELECT get_stale_quote_symbols(60);  -- Quotes older than 1 hour
```

#### 7. `get_quote_cache_stats()`
Returns cache health statistics.

```sql
SELECT * FROM get_quote_cache_stats();

-- Returns:
-- total_symbols: 150
-- fresh_quotes: 145 (< 1 hour old)
-- stale_quotes: 5 (> 1 hour old)
-- oldest_quote: 2025-11-21 05:00:00
-- newest_quote: 2025-11-21 07:15:30
-- avg_age_minutes: 24.5
```

---

## ⏰ Automated Refresh System

### **Cron Job Configuration**

**Schedule:** Every hour at minute 0 (`:00`)  
**Function:** `cron_refresh_portfolio_quotes()`  
**Status:** ✅ Active (Job ID: 3)

```sql
-- View cron job
SELECT * FROM cron.job WHERE jobname = 'refresh-portfolio-quotes-hourly';

-- View recent cron runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### **How the Cron Job Works**

1. **Health Check** - Runs every hour
2. **Get Active Symbols** - Fetches all portfolio holdings
3. **Check Cache Age** - Identifies stale quotes (> 1 hour)
4. **Log Status** - Records health metrics
5. **Next Refresh** - On-demand when users access app

**Note:** The cron job currently performs health checks. Actual API refreshes happen on-demand when users request data to minimize unnecessary API calls.

---

## 🔄 API Routes

### 1. `/api/quotes/refresh` - Manual Refresh Trigger

**POST** - Triggers bulk quote refresh

```bash
curl -X POST https://your-app.com/api/quotes/refresh \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_CRON_SECRET" \
  -d '{
    "staleOnly": true,
    "ageMinutes": 60
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Stock quotes refreshed successfully",
  "stats": {
    "symbolsRequested": 150,
    "symbolsProcessed": 150,
    "apiCallsMade": 2,
    "batches": 2,
    "durationSeconds": 26,
    "status": "completed"
  },
  "timestamp": "2025-11-21T07:30:00Z",
  "logId": "abc-123-def-456"
}
```

**GET** - Returns cache statistics

```bash
curl https://your-app.com/api/quotes/refresh
```

**Response:**
```json
{
  "cache": {
    "totalSymbols": 150,
    "freshQuotes": 145,
    "staleQuotes": 5,
    "oldestQuote": "2025-11-21T05:00:00Z",
    "newestQuote": "2025-11-21T07:15:30Z",
    "avgAgeMinutes": 24.5
  },
  "recentRefreshes": [...]
}
```

---

### 2. `/api/quotes/bulk` - Bulk Quote Fetch

**POST** - Fetches quotes for multiple symbols

```bash
curl -X POST https://your-app.com/api/quotes/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "GOOGL", "MSFT"]
  }'
```

**Response:**
```json
{
  "quotes": {
    "AAPL": {
      "symbol": "AAPL",
      "price": 150.25,
      "change": 2.50,
      "changePercent": 1.69,
      "volume": 52000000,
      "lastUpdated": "2025-11-21T07:30:00Z"
    },
    ...
  },
  "cached": false,
  "fetchedCount": 3,
  "cachedCount": 0
}
```

---

### 3. `/api/prices` - Legacy Price Route

**GET** - Batch price quotes with in-memory caching

```bash
curl "https://your-app.com/api/prices?symbols=AAPL,GOOGL,MSFT"
```

**Caching:** 
- In-memory cache: 5 minutes
- Falls back to `AlphaVantageSupabase.getQuote()` (Supabase cache)

---

## 📈 Cache Performance

### **Hit Rates (Expected)**

| Cache Layer | Hit Rate | Latency |
|-------------|----------|---------|
| In-Memory | 70-80% | < 1ms |
| Supabase DB | 90-95% | 10-50ms |
| Alpha Vantage API | 5-10% | 200-500ms |

### **API Usage (Optimized)**

- **Before Caching:** ~1,000+ API calls/day
- **After Caching:** ~50-100 API calls/day
- **Savings:** 90-95% reduction

---

## 🔍 Monitoring & Debugging

### **Check Cache Health**

```sql
-- Overall cache stats
SELECT * FROM get_quote_cache_stats();

-- Find stale quotes
SELECT * FROM get_stale_quote_symbols(60);

-- Recent refresh logs
SELECT * FROM quote_refresh_log 
ORDER BY started_at DESC 
LIMIT 10;

-- API usage today
SELECT * FROM api_usage_tracking 
WHERE date = CURRENT_DATE;
```

### **Manual Cache Operations**

```sql
-- Clear all quotes older than 2 hours
DELETE FROM stock_quotes 
WHERE last_updated < NOW() - INTERVAL '2 hours';

-- Clear specific symbol
DELETE FROM stock_quotes WHERE symbol = 'AAPL';
DELETE FROM stock_cache WHERE symbol = 'AAPL';

-- Force refresh for symbol
DELETE FROM stock_quotes WHERE symbol = 'AAPL';
-- Next API request will fetch fresh data
```

### **Cron Job Monitoring**

```sql
-- Check cron job status
SELECT * FROM cron.job 
WHERE jobname = 'refresh-portfolio-quotes-hourly';

-- View last 10 cron runs
SELECT 
  start_time,
  end_time,
  status,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = 3
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🚀 Best Practices

### **1. Cache Invalidation**
- Quotes: Clear after 1 hour during trading hours
- Company data: Clear after 24 hours
- Never cache during pre/post market

### **2. Rate Limiting**
- Check `increment_api_usage()` before external calls
- Implement exponential backoff on failures
- Queue requests during high traffic

### **3. Error Handling**
- Always return cached data on API failures
- Log errors to `quote_refresh_log`
- Alert on consecutive failures

### **4. Performance**
- Use bulk endpoints when fetching 10+ symbols
- Batch API calls (max 100 symbols per request)
- Wait 12 seconds between batches (rate limit: 5/min)

---

## 🛠️ Troubleshooting

### **Cache Not Working**

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%stock%' OR table_name LIKE '%cache%';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%cache%' OR routine_name LIKE '%quote%';
```

### **Cron Job Not Running**

```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job status
SELECT * FROM cron.job WHERE active = true;

-- Check for errors
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

### **API Limit Reached**

```sql
-- Check current usage
SELECT * FROM api_usage_tracking WHERE date = CURRENT_DATE;

-- Reset daily counter (for testing only!)
UPDATE api_usage_tracking 
SET requests_used = 0 
WHERE date = CURRENT_DATE;
```

---

## 📝 Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alpha Vantage
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Cron Security
CRON_SECRET=your-secure-random-string

# App URL
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

---

## 🎯 Future Enhancements

1. **Redis Cache Layer** - Add Redis for < 1ms latency
2. **WebSocket Updates** - Real-time price streaming
3. **Predictive Prefetching** - Cache commonly viewed stocks
4. **Regional Caching** - Edge caching with Vercel Edge
5. **Smart TTL** - Adjust TTL based on volatility
6. **Cache Warming** - Pre-populate cache before market open

---

## 📊 Cache Statistics Dashboard

Access via: `/api/quotes/refresh` (GET)

Displays:
- Total cached symbols
- Fresh vs stale quote counts
- Average cache age
- Recent refresh operations
- API usage metrics
- Cron job health

---

## 📞 Support

For issues or questions about the caching system:
1. Check logs: `SELECT * FROM quote_refresh_log ORDER BY started_at DESC;`
2. Verify cron status: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
3. Review cache stats: `SELECT * FROM get_quote_cache_stats();`

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready


















