# Massive API Integration Guide

**Last Updated:** January 29, 2026  
**Status:** ✅ Active

---

## Overview

Pryleaf now uses **Massive (formerly Polygon.io)** as the primary data provider for all stock market data. This provides unlimited API calls, real-time data, and comprehensive market information with a simplified architecture.

## Key Benefits

1. **Unlimited API Calls** - No more 25 requests/day limit
2. **Real-Time Data** - True real-time quotes and market data
3. **Simplified Architecture** - In-memory caching only, no database complexity
4. **Better Data Quality** - More comprehensive and accurate information
5. **Built-in Sentiment** - News articles include AI-powered sentiment analysis
6. **Cost Effective** - One plan covers all needs

---

## Architecture

```
Frontend → API Routes → Massive Client → In-Memory Cache (5-10 min) → Massive API
```

**Key Differences from Alpha Vantage:**
- ❌ No database caching tables
- ❌ No cron jobs for refresh
- ❌ No rate limiting logic
- ❌ No complex bulk refresh systems
- ✅ Simple in-memory LRU cache
- ✅ Direct API calls with unlimited quota
- ✅ Faster response times

---

## Environment Setup

### Required Environment Variable

Add to `.env.local`:

```bash
MASSIVE_API_KEY=your_massive_api_key_here
```

### Getting Your API Key

1. Sign up at [https://massive.com/](https://massive.com/)
2. Choose a plan (Starter or above for unlimited calls)
3. Navigate to Dashboard → API Keys
4. Copy your API key
5. Add to environment variables

---

## API Endpoints

### Stock Quotes

**Endpoint:** `/api/prices`

**Parameters:**
- `symbols` (GET) or `tickers` (POST) - Comma-separated ticker symbols

**Example:**
```bash
GET /api/prices?symbols=AAPL,GOOGL,MSFT
```

**Response:**
```json
{
  "AAPL": {
    "symbol": "AAPL",
    "price": 178.50,
    "change": 2.35,
    "changePercent": 1.33,
    "volume": 52000000,
    "open": 176.15,
    "high": 179.00,
    "low": 175.80,
    "previousClose": 176.15,
    "bid": 178.48,
    "ask": 178.52
  }
}
```

### Ticker Details

**Endpoint:** `/api/ticker/{ticker}`

**Example:**
```bash
GET /api/ticker/AAPL
```

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 178.50,
  "change": 2.35,
  "changePercent": 1.33,
  "marketCap": 2800000000000,
  "description": "Apple designs...",
  "sector": "Technology",
  "exchange": "NASDAQ",
  "logo_url": "https://...",
  "website": "https://www.apple.com"
}
```

### Historical Data (Time Series)

**Endpoint:** `/api/ticker/{ticker}/time-series`

**Parameters:**
- `interval` - daily, weekly, monthly, 5min, 15min, etc.
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)
- `limit` - Max results (default: 5000)

**Example:**
```bash
GET /api/ticker/AAPL/time-series?interval=daily&from=2025-01-01&to=2026-01-01
```

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2025-01-02T00:00:00Z",
      "open": "175.20",
      "high": "178.50",
      "low": "174.80",
      "close": "177.90",
      "volume": "54000000",
      "vw": 176.85,
      "transactions": 125000
    }
  ],
  "_source": "massive",
  "_count": 252
}
```

### News

**Endpoint:** `/api/news`

**Parameters:**
- `ticker` - Filter by ticker symbol
- `limit` - Number of articles (max: 1000)
- `order` - 'asc' or 'desc'

**Example:**
```bash
GET /api/news?ticker=AAPL&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Apple Announces New Product",
      "description": "...",
      "url": "https://...",
      "image_url": "https://...",
      "published_utc": "2026-01-29T10:00:00Z",
      "tickers": ["AAPL"],
      "publisher": {
        "name": "Bloomberg",
        "logo_url": "https://..."
      },
      "sentiment": {
        "ticker": "AAPL",
        "sentiment": "positive",
        "sentiment_reasoning": "Article discusses..."
      }
    }
  ],
  "metadata": {
    "count": 20,
    "source": "massive"
  }
}
```

---

## Massive Client Usage

The Massive client is available as a singleton:

```typescript
import { getMassiveClient } from '@/lib/massiveClient';

const client = getMassiveClient();

// Get real-time quote
const quote = await client.getQuote('AAPL');

// Get comprehensive snapshot (recommended)
const snapshot = await client.getSnapshot('AAPL');

// Get company details
const details = await client.getTickerDetails('AAPL');

// Get historical aggregates
const history = await client.getAggregates(
  'AAPL',
  1,           // multiplier
  'day',       // timespan
  '2025-01-01', // from
  '2026-01-01'  // to
);

// Get news
const news = await client.getNews({ ticker: 'AAPL', limit: 10 });
```

---

## Caching Strategy

### In-Memory Cache Only

**TTL (Time to Live):**
- Quotes/Snapshots: **5 minutes**
- Ticker Details: **60 minutes** (changes infrequently)
- Aggregates (Historical): **30 minutes**
- News: **10 minutes**

**Cache Keys:**
```
quote:{TICKER}
snapshot:{TICKER}
details:{TICKER}
aggs:{TICKER}:{MULTIPLIER}{TIMESPAN}:{FROM}:{TO}
news:{TICKER}:{LIMIT}
```

**Cache Statistics:**
```typescript
const client = getMassiveClient();
const stats = client.getCacheStats();
console.log(`Cache size: ${stats.size} entries`);
```

**Clear Cache:**
```typescript
client.clearCache();
```

---

## Data Mappings

### Massive vs Alpha Vantage

| Data Type | Alpha Vantage | Massive | Notes |
|-----------|--------------|---------|-------|
| Real-time Quote | `GLOBAL_QUOTE` | `/v2/last/nbbo/{ticker}` | Includes bid/ask |
| Snapshot | N/A | `/v2/snapshot/.../tickers/{ticker}` | All-in-one endpoint |
| Company Info | `OVERVIEW` | `/v3/reference/tickers/{ticker}` | Richer data |
| Historical | `TIME_SERIES_DAILY` | `/v2/aggs/ticker/...` | Flexible ranges |
| News | `NEWS_SENTIMENT` | `/v2/reference/news` | Better sentiment |

### Response Field Mappings

**Quote Data:**
- Alpha Vantage `"05. price"` → Massive `lastTrade.p` or `day.c`
- Alpha Vantage `"09. change"` → Massive `todaysChange`
- Alpha Vantage `"10. change percent"` → Massive `todaysChangePerc`

**Company Data:**
- Alpha Vantage `Name` → Massive `results.name`
- Alpha Vantage `MarketCapitalization` → Massive `results.market_cap`
- Alpha Vantage `Description` → Massive `results.description`

---

## Error Handling

The Massive client includes comprehensive error handling:

```typescript
try {
  const snapshot = await client.getSnapshot('AAPL');
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limit (shouldn't happen with unlimited plan)
  } else if (error.message.includes('404')) {
    // Ticker not found
  } else {
    // Other errors
  }
}
```

---

## Best Practices

### 1. Use Snapshots for Comprehensive Data

Instead of multiple API calls:
```typescript
// ❌ Multiple calls
const quote = await client.getQuote('AAPL');
const details = await client.getTickerDetails('AAPL');

// ✅ Single snapshot call
const snapshot = await client.getSnapshot('AAPL');
// Includes: current price, today's OHLC, previous day, minute bar, last quote, last trade
```

### 2. Leverage Caching

The client caches automatically. For frequently accessed data, the cache will significantly reduce latency:
- First call: ~200-500ms (API request)
- Cached calls: ~5-20ms (memory lookup)

### 3. Batch Operations

For multiple tickers:
```typescript
// Use batch snapshot endpoint
const snapshots = await client.getBatchSnapshots(['AAPL', 'GOOGL', 'MSFT']);
```

### 4. Handle Market Hours

Massive data is real-time during market hours and delayed outside of trading hours. Check the `updated` timestamp in snapshots.

---

## Migration Notes

### What Changed

1. **Database Tables Removed:**
   - `stock_quotes`
   - `stock_cache`
   - `api_usage_tracking`
   - `quote_refresh_log`
   - `news_articles`
   - `news_refresh_log`

2. **Cron Jobs Removed:**
   - `refresh-portfolio-quotes-hourly`
   - `refresh-news-hourly`

3. **Files Deleted:**
   - `src/lib/alphaVantageSupabase.ts`
   - `src/lib/bulkQuoteService.ts`
   - All Alpha Vantage API routes

4. **API Response Format Changed:**
   - Now matches Massive's structure
   - Frontend components updated accordingly

### Migration Applied

Migration: `20260129000002_remove_alphavantage_cache.sql`

---

## Troubleshooting

### Issue: "MASSIVE_API_KEY not provided"

**Solution:** Ensure `MASSIVE_API_KEY` is set in your environment variables.

### Issue: Slow response times

**Check:**
1. Cache statistics: `client.getCacheStats()`
2. Network latency to Massive API
3. Consider increasing cache TTL for less volatile data

### Issue: 429 Rate Limit Error

This shouldn't happen with unlimited plans, but if it does:
1. Verify your plan includes unlimited calls
2. Check for rate limits per second (not per day)
3. Contact Massive support

---

## Performance Metrics

### Expected Response Times

- **Cached Data:** 5-20ms
- **Fresh API Call:** 100-300ms
- **Batch Operations:** 150-400ms

### Cache Hit Rates (Expected)

- First 5 minutes: ~95% hit rate
- After 5 minutes: Cache expires, 0% hit rate until next request
- Average: ~80-90% hit rate with regular traffic

---

## Support

- **Massive Documentation:** [https://massive.com/docs](https://massive.com/docs)
- **Local Docs Mirror:** `docs/massive/`
- **API Status:** [https://status.massive.com](https://status.massive.com)

---

## Summary

✅ **Unlimited API calls** - No more rate limiting  
✅ **Simplified architecture** - In-memory caching only  
✅ **Real-time data** - Better than Alpha Vantage  
✅ **Built-in sentiment** - AI-powered news analysis  
✅ **Better performance** - Faster, more reliable  
✅ **Cost effective** - One plan covers everything  

Your app is now powered by professional-grade market data infrastructure! 🚀
