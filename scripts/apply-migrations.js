// Script to apply migrations to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile, description) {
  console.log(`\n📄 Applying: ${description}...`);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct approach using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute SQL');
      }
      
      console.log(`✅ Success: ${description}`);
    } else {
      console.log(`✅ Success: ${description}`);
    }
  } catch (error) {
    console.error(`❌ Error applying ${description}:`, error.message);
    console.log('\n⚠️  Please apply this migration manually via Supabase Dashboard SQL Editor');
    console.log(`    File: supabase/migrations/${migrationFile}`);
  }
}

async function main() {
  console.log('🚀 Applying Supabase Migrations...\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);
  
  await applyMigration(
    '20250113000001_create_community_tables.sql',
    'Migration 1 - Create Tables'
  );
  
  await applyMigration(
    '20250113000002_create_rls_policies.sql',
    'Migration 2 - Security Policies'
  );
  
  await applyMigration(
    '20250113000003_seed_initial_data.sql',
    'Migration 3 - Seed Data (Optional)'
  );
  
  console.log('\n✨ Migrations complete!\n');
  console.log('Next steps:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Visit: http://localhost:3000/community');
  console.log('3. Start testing! 🎉\n');
}

main();



