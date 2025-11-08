import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/**
 * One-time migration endpoint to create stock_quotes table
 * Visit: http://localhost:3000/api/migrate/stock-quotes
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Execute the migration SQL
    const migrationSQL = `
      -- Create stock_quotes table for caching realtime quote data
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

      -- Create index on last_updated for efficient cache invalidation queries
      CREATE INDEX IF NOT EXISTS idx_stock_quotes_last_updated ON public.stock_quotes(last_updated);
    `;

    // Note: RLS policies need to be set via Supabase Dashboard or using a service role key
    // The regular authenticated client can't modify RLS policies
    
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        note: 'You may need to run this SQL manually in the Supabase Dashboard SQL editor'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'stock_quotes table created successfully!',
      note: 'You may need to manually set RLS policies in Supabase Dashboard'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: 'Please run the migration SQL manually in Supabase Dashboard SQL editor'
    }, { status: 500 });
  }
}

