// Script to apply stock_quotes cache table migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying stock_quotes cache table migration...\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250130000001_create_stock_quotes_cache.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration SQL:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n⚠️  Please copy the SQL above and run it in your Supabase Dashboard:');
  console.log('   1. Go to https://supabase.com/dashboard/project/mjxtzwekczanotbgxjuz/sql/new');
  console.log('   2. Paste the SQL above');
  console.log('   3. Click "Run" to execute');
  console.log('\n   Or manually create the table with proper permissions.\n');
}

applyMigration();

