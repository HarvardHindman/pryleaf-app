# Research Pages Caching System

## Overview
The research pages (accessible via `/research` or `/symbol/[ticker]`) now have a comprehensive caching system with proper placeholder fallbacks when data is not yet cached.

## How It Works

### 1. Cache-First Architecture
All research data goes through a multi-layered cache:

```
User Request
    ↓
Client Context (2min TTL)
    ↓ (cache miss)
Server API Route
    ↓
Supabase Cache (stock_cache table)
    ↓ (cache miss)
Placeholder Data (MCP disabled for users)
```

### 2. Data Types Cached

#### Ticker Overview & Quote
- **Route**: `/api/ticker/[ticker]`
- **Cache Key**: `overview` (15min), `quote` (5min)
- **Placeholder**: Yes - returns basic ticker structure with `_placeholder: true` flag

#### Financial Statements
- **Route**: `/api/ticker/[ticker]/financials?type={income|balance|cashflow|earnings}`
- **Cache Keys**: `financials_income`, `financials_balance`, `financials_cashflow`, `financials_earnings`
- **TTL**: 60 minutes
- **Placeholder**: Yes - returns empty arrays for `annualReports` and `quarterlyReports`

#### Time Series / Chart Data
- **Route**: `/api/ticker/[ticker]/time-series?interval={daily|weekly|monthly|intraday}&outputsize={compact|full}`
- **Cache Keys**: `timeseries_daily_compact`, `timeseries_daily_full`, `timeseries_weekly_compact`, etc.
- **TTL**: 60 minutes
- **Placeholder**: Yes - returns fallback generated data

## User Experience

### When Data Is Cached ✅
- Fast page load
- Real Alpha Vantage data displayed
- No banners or warnings

### When Data Is Not Cached ⚠️
- Page still loads (no errors!)
- Warning banner at top: "Data Not Cached"
- Placeholder data shown:
  - **Ticker Overview**: Basic info with "N/A" for most fields
  - **Financials**: Empty tables with message "No financial data available"
  - **Charts**: Mock/fallback chart data

### What Components Show

#### CompanyOverview
- Shows "N/A" for missing fields
- Description: "Data not currently available. This ticker has not been cached yet."

#### CompanyStatistics
- Shows "N/A" for all metrics when placeholder data

#### Financial Statements (Income/Balance/Cash Flow)
- Shows built-in placeholder: "No {statement type} data available" with icon
- No errors or crashes

#### Charts
- Falls back to generated mock data for visualization
- Clearly labeled as mock/fallback

## For Developers

### Checking if Data is Placeholder

```typescript
// In components
const isPlaceholder = data && (data as any)._placeholder === true;

// API responses include
{
  data: {...},
  _cached: false,
  _placeholder: true,
  _message: 'Data not cached. Runtime API fetching is currently disabled.',
  _timestamp: '2025-01-06T...'
}
```

### Warming the Cache

To populate the cache with real data (only for development/maintenance):

1. **Option A**: Enable MCP temporarily (add env flag)
2. **Option B**: Use admin script to bulk-cache common tickers
3. **Option C**: Manually insert via Supabase SQL:

```sql
-- Insert cached data
SELECT set_cached_stock_data(
  'NVDA',
  'overview',
  '{"Symbol": "NVDA", "Name": "NVIDIA Corporation", ...}'::jsonb,
  15 -- TTL in minutes
);
```

### Checking Cache Contents

```sql
-- View all cached tickers
SELECT symbol, data_type, updated_at, expires_at
FROM stock_cache
ORDER BY updated_at DESC;

-- View specific ticker
SELECT symbol, data_type, updated_at, expires_at,
       CASE 
         WHEN expires_at > NOW() THEN 'Fresh'
         ELSE 'Expired'
       END as status
FROM stock_cache
WHERE symbol = 'NVDA';
```

## Benefits

### 1. No More 404/503 Errors
- Research pages always load, even with empty cache
- Better UX than showing error pages

### 2. Clear Communication
- Warning banner explains why data is placeholder
- Users understand the system state

### 3. Graceful Degradation
- Each component has its own placeholder UI
- Partial data (e.g., only quote cached, not overview) still renders

### 4. MCP Protection
- No accidental API calls during user browsing
- Preserves Alpha Vantage rate limits (25/day free tier)

## Configuration

### TTL Settings
Located in `src/cache/constants.ts`:

```typescript
export const CACHE_TTL = {
  STOCK_QUOTE: 5 * 60 * 1000,           // 5 minutes
  STOCK_OVERVIEW: 15 * 60 * 1000,       // 15 minutes
  TIME_SERIES_DAILY: 60 * 60 * 1000,    // 1 hour
  // ...
};
```

### Cache Table Schema
Table: `public.stock_cache`

```sql
CREATE TABLE public.stock_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(symbol, data_type)
);
```

## Monitoring

### Check if Cache is Working

```sql
-- Count cached items per data type
SELECT data_type, COUNT(*) as count,
       COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as fresh_count
FROM stock_cache
GROUP BY data_type;
```

### Identify Missing Tickers

```sql
-- Tickers that hit placeholder (from logs)
-- Look for: "[Ticker API] No cached data found for {ticker}"
-- Then cache them manually or via script
```

## Troubleshooting

### Issue: "No data available" on all research pages
**Cause**: Cache is empty
**Solution**: Warm cache for common tickers (NVDA, AAPL, GOOGL, etc.)

### Issue: Data seems stale
**Cause**: Cache TTL expired but not refreshed (MCP disabled)
**Solution**: 
- Check cache expiry: `SELECT symbol, data_type, expires_at FROM stock_cache WHERE expires_at < NOW();`
- Manually refresh if needed

### Issue: Placeholder banner won't go away
**Cause**: Ticker data has `_placeholder: true` flag
**Solution**: Ensure real data is cached for that ticker

## Future Enhancements

1. **Admin Dashboard**: UI to warm/refresh cache
2. **Background Jobs**: Scheduled cache warming for popular tickers
3. **User Requests**: Allow users to request cache refresh (with queue)
4. **Cache Analytics**: Track cache hit/miss rates per ticker

---

**Last Updated**: January 6, 2025  
**Status**: ✅ Production Ready

