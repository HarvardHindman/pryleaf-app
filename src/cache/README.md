# Cache System

Unified caching layer for the Pryleaf application. All caching logic is centralized here for maintainability and consistency.

## 📁 Structure

```
src/cache/
├── index.ts                    # Main export file
├── types.ts                    # Shared TypeScript types
├── constants.ts                # TTLs, limits, configuration
├── README.md                   # This file
│
└── services/                   # Cache service implementations
    ├── stockCache.ts           # Stock quotes & company data (Alpha Vantage + Supabase)
    ├── bulkQuoteCache.ts       # Bulk portfolio quote refresh
    ├── newsCache.ts            # News articles with sentiment
    └── priceCache.ts           # In-memory price caching
```

## 🚀 Usage

### Import from Main Entry Point

```typescript
import { 
  StockCacheService,
  newsCache,
  priceCache,
  CACHE_TTL,
  CompanyOverview,
  Quote 
} from '@/cache';
```

### Stock Data Caching

```typescript
// Get company overview (15 min cache)
const overview = await StockCacheService.getCompanyOverview('AAPL');

// Get realtime quote (5 min cache)
const quote = await StockCacheService.getQuote('AAPL');

// Get time series data (60 min cache)
const timeSeries = await StockCacheService.getTimeSeries('AAPL', 'daily', 'compact');
```

### News Caching

```typescript
// Fetch news with filters
const articles = await newsCache.getNews({
  ticker: 'AAPL',
  limit: 50,
  hoursAgo: 24
});

// Get trending tickers
const trending = await newsCache.getTrendingTickers(10);

// Refresh news cache
const result = await newsCache.refreshNewsCache({
  tickers: ['AAPL', 'GOOGL'],
  limit: 200
});
```

### Price Caching (In-Memory)

```typescript
// Get cached price
const price = priceCache.get('AAPL');

// Set cached price
priceCache.set('AAPL', priceData);

// Check if symbol is cached
if (priceCache.has('AAPL')) {
  // Use cached data
}

// Clear cache
priceCache.clear('AAPL'); // Clear specific symbol
priceCache.clear(); // Clear all
```

## 🔧 Configuration

All cache TTLs and limits are defined in `constants.ts`:

```typescript
import { CACHE_TTL, API_LIMITS } from '@/cache';

console.log(CACHE_TTL.STOCK_QUOTE); // 5 * 60 * 1000 (5 minutes)
console.log(API_LIMITS.BULK_QUOTE_BATCH_SIZE); // 100
```

## 📊 Cache Layers

### Layer 1: Client-Side (React Context)
- **Location**: `src/contexts/TickerCacheContext.tsx`, `CommunityCacheContext.tsx`
- **Purpose**: React state management
- **TTL**: 2-5 minutes
- **Storage**: Browser memory (useState)

### Layer 2: In-Memory Server Cache
- **Location**: `src/cache/services/priceCache.ts`
- **Purpose**: Fast server-side lookups
- **TTL**: 5 minutes
- **Storage**: Node.js process memory

### Layer 3: Supabase Database Cache
- **Location**: Supabase tables (`stock_cache`, `stock_quotes`, `news_articles`)
- **Purpose**: Persistent, shared cache across all users
- **TTL**: 5-60 minutes (varies by data type)
- **Storage**: PostgreSQL

### Layer 4: External APIs
- **Location**: Alpha Vantage, other external services
- **Purpose**: Source of truth
- **Rate Limits**: 25 requests/day (free), 500+ (premium)

## 🔄 Cache Flow

```
User Request
    ↓
[Client Context] → Cache hit? → Return data
    ↓ (miss)
[In-Memory Cache] → Cache hit? → Return data → Update client
    ↓ (miss)
[Supabase Cache] → Cache hit? → Return data → Update all layers
    ↓ (miss)
[External API] → Fetch data → Update all layers → Return data
```

## 🧪 Testing

```typescript
// Test stock cache
const quote = await StockCacheService.getQuote('AAPL');
console.log('Quote:', quote);

// Test news cache
const news = await newsCache.getNews({ limit: 5 });
console.log('News:', news);

// Test price cache stats
const stats = priceCache.getStats();
console.log('Cache stats:', stats);
```

## 📝 Migration Notes

- **Old**: `import { AlphaVantageSupabase } from '@/lib/alphaVantageSupabase'`
- **New**: `import { StockCacheService } from '@/cache'`

- **Old**: `import { newsService } from '@/lib/newsService'`
- **New**: `import { newsCache } from '@/cache'`

- **Old**: `import { BulkQuoteService } from '@/lib/bulkQuoteService'`
- **New**: `import { BulkQuoteCacheService } from '@/cache'`

## 🎯 Best Practices

1. **Always import from `@/cache`** - Don't import directly from service files
2. **Use constants** - Import TTLs and limits from `constants.ts`
3. **Handle cache misses gracefully** - Always check for `null` returns
4. **Respect rate limits** - Check API usage before making external calls
5. **Clean stale data** - Use provided cleanup methods regularly

## 📚 Related Documentation

- `/docs/CACHING_SYSTEM.md` - Complete caching system documentation
- `/docs/CACHING_QUICK_REFERENCE.md` - Quick reference guide
- `/docs/NEWS_SETUP_GUIDE.md` - News caching setup

---

**Last Updated**: December 24, 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready

