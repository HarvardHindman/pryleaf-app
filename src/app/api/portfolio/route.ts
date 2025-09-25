import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PortfolioService } from '@/lib/portfolioService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get existing portfolio first using server client
    let portfolio = await PortfolioService.getUserDefaultPortfolioWithClient(supabase, user.id);
    
    // If no portfolio exists, create one for existing users
    if (!portfolio) {
      console.log(`Creating default portfolio for existing user ${user.id}`);
      portfolio = await PortfolioService.createPortfolioWithClient(supabase, user.id, 'My Portfolio', true);
    }
    
    // Get holdings for the portfolio
    const holdings = await PortfolioService.getPortfolioHoldingsWithClient(supabase, portfolio.id);
    
    const portfolioData = {
      ...portfolio,
      holdings: holdings || []
    };
    
    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, shares, averageCost, companyName } = await request.json();
    
    // Validate input
    if (!symbol || !shares || !averageCost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (shares <= 0 || averageCost <= 0) {
      return NextResponse.json({ error: 'Shares and cost must be positive' }, { status: 400 });
    }
    
    // Get or create default portfolio
    let portfolio = await PortfolioService.getUserDefaultPortfolioWithClient(supabase, user.id);
    if (!portfolio) {
      console.log(`Creating default portfolio for existing user ${user.id}`);
      portfolio = await PortfolioService.createPortfolioWithClient(supabase, user.id, 'My Portfolio', true);
    }
    
    const holding = await PortfolioService.upsertHoldingWithClient(
      supabase,
      portfolio.id, 
      symbol.toUpperCase().trim(), 
      Number(shares), 
      Number(averageCost), 
      companyName?.trim()
    );
    
    return NextResponse.json({ holding });
  } catch (error) {
    console.error('Add holding error:', error);
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
  }
}
