/**
 * Directly populate news cache using Supabase MCP
 * This script inserts news directly into the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjxtzwekczanotbgxjuz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeHR6d2VrY3phbm90Ymd4anV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkzMjE1NCwiZXhwIjoyMDQ0NTA4MTU0fQ.mTCX4pLvDC1H9lTSm_D4ghIQkMuQA0wT7FNDlEWx5hE';

async function populateNewsCache() {
  console.log('🔄 Populating news cache directly...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Sample news article to insert
  const testArticles = [
    {
      article_id: 'test_' + Date.now(),
      title: 'Test News Article - Alpha Vantage Integration',
      url: 'https://example.com/test',
      time_published: new Date().toISOString(),
      authors: ['Test Author'],
      summary: 'This is a test article to verify news caching works.',
      source: 'Test Source',
      source_domain: 'example.com',
      tickers: ['NVDA', 'AAPL'],
      topics: ['technology', 'earnings'],
      overall_sentiment_score: 0.5,
      overall_sentiment_label: 'Bullish',
      ticker_sentiment: []
    }
  ];

  try {
    console.log('📤 Inserting test article...');
    
    const { data, error } = await supabase
      .from('news_articles')
      .insert(testArticles)
      .select();

    if (error) {
      console.error('❌ Error inserting:', error);
      return;
    }

    console.log('✅ Success! Inserted:', data?.length || 0, 'articles');
    console.log('\n🎉 News cache populated!');
    console.log('   Visit http://localhost:3000/symbol/NVDA and click the News tab');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

populateNewsCache();

