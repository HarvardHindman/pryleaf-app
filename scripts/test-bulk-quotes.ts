#!/usr/bin/env tsx
/**
 * Test Script for Bulk Quote Caching
 * 
 * Tests the bulk quote refresh system locally before deploying
 * 
 * Usage:
 *   npm install -g tsx (if not already installed)
 *   tsx scripts/test-bulk-quotes.ts
 * 
 * Or add to package.json scripts:
 *   "test:quotes": "tsx scripts/test-bulk-quotes.ts"
 */

import 'dotenv/config';

// Ensure we have required env vars
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ALPHA_VANTAGE_API_KEY'
];

const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Please add them to your .env.local file');
  process.exit(1);
}

// Import after env vars are loaded
const { BulkQuoteService } = await import('../src/lib/bulkQuoteService.js');

console.log('🚀 Bulk Quote Caching Test\n');
console.log('═══════════════════════════════════════════════════════════\n');

const service = new BulkQuoteService(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.ALPHA_VANTAGE_API_KEY
);

async function runTests() {
  try {
    // Test 1: Get active symbols
    console.log('📊 Test 1: Getting active portfolio symbols...');
    const symbols = await service.getActiveSymbols();
    console.log(`✅ Found ${symbols.length} unique symbols:`, symbols.slice(0, 10).join(', '), symbols.length > 10 ? '...' : '');
    console.log();

    if (symbols.length === 0) {
      console.log('⚠️  No active portfolio holdings found.');
      console.log('   Add some stocks to a portfolio first, then run this test again.\n');
      return;
    }

    // Test 2: Get cache stats
    console.log('📈 Test 2: Getting cache statistics...');
    const stats = await service.getCacheStats();
    if (stats) {
      console.log('✅ Cache Statistics:');
      console.log(`   Total symbols: ${stats.total_symbols}`);
      console.log(`   Fresh quotes: ${stats.fresh_quotes}`);
      console.log(`   Stale quotes: ${stats.stale_quotes}`);
      console.log(`   Average age: ${stats.avg_age_minutes?.toFixed(2)} minutes`);
      console.log(`   Oldest quote: ${stats.oldest_quote || 'N/A'}`);
      console.log(`   Newest quote: ${stats.newest_quote || 'N/A'}`);
    } else {
      console.log('⚠️  No cache data yet');
    }
    console.log();

    // Test 3: Get stale symbols
    console.log('⏰ Test 3: Checking for stale quotes (>60 minutes old)...');
    const staleSymbols = await service.getStaleSymbols(60);
    console.log(`✅ Found ${staleSymbols.length} stale symbols`);
    if (staleSymbols.length > 0) {
      console.log('   Symbols:', staleSymbols.slice(0, 10).join(', '), staleSymbols.length > 10 ? '...' : '');
    }
    console.log();

    // Test 4: Fetch a small batch from Alpha Vantage (use first 5 symbols)
    if (symbols.length > 0) {
      const testSymbols = symbols.slice(0, Math.min(5, symbols.length));
      console.log(`🌐 Test 4: Fetching quotes from Alpha Vantage API...`);
      console.log(`   Testing with ${testSymbols.length} symbols:`, testSymbols.join(', '));
      
      try {
        const quotes = await service.fetchBulkQuotes(testSymbols);
        console.log(`✅ Successfully fetched ${quotes.length} quotes`);
        
        if (quotes.length > 0) {
          const sample = quotes[0];
          console.log('\n   Sample quote:');
          console.log(`   Symbol: ${sample.symbol}`);
          console.log(`   Price: $${sample.close}`);
          console.log(`   Change: ${sample.change} (${sample.change_percent}%)`);
          console.log(`   Volume: ${Number(sample.volume).toLocaleString()}`);
          console.log(`   Timestamp: ${sample.timestamp}`);
        }
        console.log();

        // Test 5: Upsert quotes into database
        console.log('💾 Test 5: Upserting quotes into database...');
        const result = await service.upsertQuotes(quotes);
        console.log(`✅ Database updated:`);
        console.log(`   Inserted: ${result.inserted}`);
        console.log(`   Updated: ${result.updated}`);
        console.log(`   Total: ${result.total}`);
        console.log();

      } catch (error) {
        if (error instanceof Error && error.message.includes('premium endpoint')) {
          console.log('⚠️  Alpha Vantage API Error:');
          console.log('   The REALTIME_BULK_QUOTES endpoint is a PREMIUM feature.');
          console.log('   Your current API key does not have access to this endpoint.');
          console.log('\n   Options:');
          console.log('   1. Upgrade to Alpha Vantage Premium plan');
          console.log('   2. Use individual quote fetching (slower but works with free tier)');
          console.log('\n   See: https://www.alphavantage.co/premium/\n');
          return;
        }
        throw error;
      }
    }

    // Test 6: Full refresh (if confirmed)
    console.log('🔄 Test 6: Full quote refresh');
    console.log(`   This will refresh all ${symbols.length} symbols.`);
    console.log(`   Estimated time: ${Math.ceil(symbols.length / 100) * 12} seconds`);
    console.log(`   API calls: ${Math.ceil(symbols.length / 100)}`);
    console.log('\n   Skipping full refresh in test mode.');
    console.log('   To run a full refresh, call: service.refreshAllQuotes()\n');

    // Final cache stats
    console.log('📊 Final cache statistics:');
    const finalStats = await service.getCacheStats();
    if (finalStats) {
      console.log(`✅ Total symbols: ${finalStats.total_symbols}`);
      console.log(`   Fresh quotes: ${finalStats.fresh_quotes}`);
      console.log(`   Stale quotes: ${finalStats.stale_quotes}`);
    }
    console.log();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ All tests completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Review BULK_QUOTE_SETUP.md for deployment instructions');
    console.log('2. Set up automated hourly refresh via cron');
    console.log('3. Update your frontend to use /api/portfolio/with-prices');
    console.log();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

