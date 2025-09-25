import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PortfolioService } from '@/lib/portfolioService';
import yahooFinance from 'yahoo-finance2';

// Cache for price data (in production, use Redis)
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    const { symbol, shares, averageCost, companyName, useCurrentPrice } = await request.json();
    
    // Validate input
    if (!symbol || !shares) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (shares <= 0) {
      return NextResponse.json({ error: 'Shares must be positive' }, { status: 400 });
    }

    let finalAverageCost = averageCost;
    let finalCompanyName = companyName;

    // If useCurrentPrice is true or averageCost is not provided, fetch current price
    if (useCurrentPrice || !averageCost) {
      const symbolKey = symbol.toUpperCase().trim();
      const now = Date.now();
      
      // Check cache first
      let quote = priceCache.get(symbolKey);
      if (!quote || now - quote.timestamp > CACHE_TTL) {
        try {
          const freshQuote = await yahooFinance.quote(symbolKey);
          quote = { data: freshQuote, timestamp: now };
          priceCache.set(symbolKey, quote);
        } catch (priceError) {
          console.error('Price fetch error:', priceError);
          return NextResponse.json({ 
            error: `Could not fetch current price for ${symbol}. Please provide a manual price.` 
          }, { status: 400 });
        }
      }
      
      if (quote?.data?.regularMarketPrice) {
        finalAverageCost = quote.data.regularMarketPrice;
        // Use company name from quote if not provided
        if (!finalCompanyName) {
          finalCompanyName = quote.data.displayName || quote.data.longName || quote.data.shortName;
        }
      } else {
        return NextResponse.json({ 
          error: `Could not fetch current price for ${symbol}. Please provide a manual price.` 
        }, { status: 400 });
      }
    }

    if (finalAverageCost <= 0) {
      return NextResponse.json({ error: 'Average cost must be positive' }, { status: 400 });
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
      Number(finalAverageCost), 
      finalCompanyName?.trim()
    );
    
    return NextResponse.json({ holding });
  } catch (error) {
    console.error('Add holding error:', error);
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
  }
}
