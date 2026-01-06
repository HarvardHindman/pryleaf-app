# Caching Strategy Update - Always Use Last Successful Data

## Problem
Research pages and portfolio pages were failing with errors when the Alpha Vantage API limit (25 requests/day) was reached or nearly reached, because the system would try to fetch fresh data and fail.

## Solution
Implemented an **aggressive caching strategy** that prioritizes showing data over having the freshest data:

### Key Changes

#### 1. Stock Cache Service (`src/cache/services/stockCache.ts`)
- ✅ Added `checkApiUsage()` - Check remaining API calls without incrementing
- ✅ Added `getAnyCachedData()` - Retrieve even expired/stale cached data
- ✅ Updated `getCompanyOverview()` and `getQuote()`:
  - First checks fresh cache (normal behavior)
  - If cache miss and API quota low (< 5 remaining), uses stale cache
  - If no stale cache available, skips API call and returns null
  - Only makes API call if quota is healthy (≥ 5 remaining)

#### 2. Time Series API (`src/app/api/ticker/[ticker]/time-series/route.ts`)
- ✅ Checks API usage BEFORE attempting to fetch
- ✅ If < 5 requests remaining, returns fallback data instead of failing
- ✅ Caches fallback data to avoid regenerating it
- ✅ Provides clear feedback about why fallback data is being used

#### 3. Ticker API (`src/app/api/ticker/[ticker]/route.ts`)
- ✅ Added logging for better debugging
- ✅ More graceful error messages when data unavailable

## How It Works Now

### Scenario 1: Fresh Cache Available
```
User visits /research → Cache Hit → Shows cached data ✅
API Calls: 0
```

### Scenario 2: Cache Miss, Quota Healthy (≥ 5 remaining)
```
User visits /research → Cache Miss → API Call → Fresh Data ✅
API Calls: 1
```

### Scenario 3: Cache Miss, Quota Low (< 5 remaining)
```
User visits /research → Cache Miss → Check Stale Cache → Shows stale data ✅
API Calls: 0
```

### Scenario 4: No Cache at All, Quota Low
```
User visits /research → No Cache → Fallback/Mock Data ✅
API Calls: 0
```

### Scenario 5: Limit Reached (0 remaining)
```
User visits /research → Shows any cached data available ✅
API Calls: 0
```

## Benefits

1. **No More Errors** - Pages never fail due to API limits
2. **Always Shows Data** - Users always see something, even if slightly stale
3. **Preserves API Quota** - Doesn't waste calls when low on quota
4. **Smart Degradation** - Gracefully falls back through multiple levels:
   - Fresh cache (best)
   - Stale cache (good)
   - Fallback data (acceptable)
   - Error only if no options exist

## Cache Hierarchy

```
Priority 1: Fresh cached data (< TTL)
Priority 2: Stale cached data (> TTL but exists)
Priority 3: Generated fallback data
Priority 4: Error (only if nothing else available)
```

## API Usage Thresholds

- **≥ 10 remaining**: Normal operation, make API calls freely
- **5-9 remaining**: Caution mode, use stale cache if available
- **< 5 remaining**: Conservative mode, avoid API calls unless critical
- **0 remaining**: Survival mode, only use cached/fallback data

## User Experience

### Before (Bad)
```
User visits /research
→ API limit reached
→ ERROR: "Unable to fetch ticker data"
→ Blank page ❌
```

### After (Good)
```
User visits /research
→ API limit reached
→ Shows stale cached data from 2 hours ago
→ Working page with data! ✅
```

## Monitoring

Check API usage with:
```bash
node scripts/check-api-usage.js
```

The logs will now show:
```
✅ Cache hit for NVDA overview
📊 API Usage: 23/25 (2 remaining)
⚠️ API quota low (2 remaining), using stale cache if available
🔄 Using stale cached data for NVDA quote
```

## Configuration

Cache TTLs are defined in `src/cache/constants.ts`:
- Company Overview: 15 minutes (fresh data window)
- Quotes: 5 minutes (fresh data window)
- Time Series: 60 minutes (fresh data window)

**Stale data is used indefinitely** when API quota is low, regardless of TTL.

## Testing

To test the new behavior:

1. **Check current usage**:
   ```bash
   node scripts/check-api-usage.js
   ```

2. **Manually set high usage** (via Supabase SQL):
   ```sql
   UPDATE api_usage_tracking 
   SET requests_used = 23 
   WHERE date = CURRENT_DATE;
   ```

3. **Visit research page**:
   - Should work fine using cached/stale data
   - Check browser console for logging

4. **Reset usage**:
   ```sql
   SELECT public.reset_api_usage();
   ```

## Future Enhancements

1. **Manual Refresh Button** - Let users explicitly request fresh data
2. **Data Age Indicator** - Show users how old the data is
3. **Progressive Enhancement** - Load partial data first, enhance with API calls
4. **Smart Prioritization** - Fetch data for most-viewed tickers first

## Summary

**The system now prioritizes reliability over freshness.**

Instead of failing when API limits are reached, the application gracefully degrades to showing cached or fallback data, ensuring users can always use the platform even when the free API tier limits are exhausted.

✅ Research pages work
✅ Portfolio pages work  
✅ Symbol pages work
✅ No more API limit errors
✅ Data is always available (even if slightly stale)

