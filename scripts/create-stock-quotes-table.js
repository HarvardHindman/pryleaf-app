// Simple script to create stock_quotes table via Supabase SQL
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS public.stock_quotes (
  symbol VARCHAR(20) PRIMARY KEY,
  price DECIMAL(20, 4) NOT NULL,
  open DECIMAL(20, 4),
  high DECIMAL(20, 4),
  low DECIMAL(20, 4),
  volume BIGINT,
  latest_trading_day DATE,
  previous_close DECIMAL(20, 4),
  change DECIMAL(20, 4),
  change_percent VARCHAR(20),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_quotes_last_updated ON public.stock_quotes(last_updated);

ALTER TABLE public.stock_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users to read stock quotes" ON public.stock_quotes;
CREATE POLICY "Allow all users to read stock quotes"
  ON public.stock_quotes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert stock quotes" ON public.stock_quotes;
CREATE POLICY "Allow authenticated users to insert stock quotes"
  ON public.stock_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update stock quotes" ON public.stock_quotes;
CREATE POLICY "Allow authenticated users to update stock quotes"
  ON public.stock_quotes
  FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.stock_quotes IS 'Cached stock quote data from Alpha Vantage with 10-minute TTL';
`;

console.log('🚀 Creating stock_quotes table in Supabase...\n');
console.log('📋 SQL to execute:\n');
console.log(sql);
console.log('\n' + '='.repeat(80));
console.log('\n⚠️  Please copy the SQL above and paste it into:');
console.log('   https://supabase.com/dashboard/project/mjxtzwekczanotbgxjuz/sql/new');
console.log('\n   Then click "Run" to create the table.\n');
console.log('✅ After running, refresh your portfolio page to see it work!\n');

