import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PortfolioService } from '@/lib/portfolioService';

/**
 * API Route: Get Portfolio with Current Prices
 * 
 * Efficiently fetches user's portfolio holdings with current market prices
 * Uses JOINed data from stock_quotes cache table (updated hourly)
 * 
 * Returns:
 * - Portfolio details
 * - Holdings with current prices, gains/losses, and market values
 * - Portfolio totals and performance metrics
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create default portfolio
    let portfolio = await PortfolioService.getUserDefaultPortfolioWithClient(supabase, user.id);
    
    if (!portfolio) {
      console.log(`Creating default portfolio for user ${user.id}`);
      portfolio = await PortfolioService.createPortfolioWithClient(supabase, user.id, 'My Portfolio', true);
    }

    // Fetch holdings with prices using efficient JOIN
    const { data: holdingsData, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select(`
        id,
        portfolio_id,
        symbol,
        company_name,
        shares,
        average_cost,
        created_at,
        updated_at,
        stock_quotes!left (
          price,
          change,
          change_percent,
          open,
          high,
          low,
          volume,
          previous_close,
          latest_trading_day,
          last_updated
        )
      `)
      .eq('portfolio_id', portfolio.id)
      .order('symbol', { ascending: true });

    if (holdingsError) {
      console.error('Error fetching holdings with prices:', holdingsError);
      return NextResponse.json({ error: 'Failed to fetch portfolio holdings' }, { status: 500 });
    }

    // Transform and calculate metrics
    const holdingsWithMetrics = (holdingsData || []).map(holding => {
      const currentPrice = holding.stock_quotes?.price ? Number(holding.stock_quotes.price) : 0;
      const shares = Number(holding.shares);
      const averageCost = Number(holding.average_cost);
      
      const costBasis = shares * averageCost;
      const marketValue = shares * currentPrice;
      const totalGainLoss = marketValue - costBasis;
      const totalGainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : 0;
      const dayChange = holding.stock_quotes?.change ? Number(holding.stock_quotes.change) : 0;
      const dayGainLoss = shares * dayChange;

      // Check if quote is stale (older than 2 hours)
      const quoteAge = holding.stock_quotes?.last_updated 
        ? (Date.now() - new Date(holding.stock_quotes.last_updated).getTime()) / (1000 * 60)
        : null;
      const isStale = quoteAge ? quoteAge > 120 : true;

      return {
        id: holding.id,
        portfolioId: holding.portfolio_id,
        symbol: holding.symbol,
        companyName: holding.company_name,
        shares,
        averageCost,
        costBasis,
        currentPrice,
        marketValue,
        totalGainLoss,
        totalGainLossPercent,
        dayChange,
        dayGainLoss,
        changePercent: holding.stock_quotes?.change_percent || '0%',
        open: holding.stock_quotes?.open ? Number(holding.stock_quotes.open) : null,
        high: holding.stock_quotes?.high ? Number(holding.stock_quotes.high) : null,
        low: holding.stock_quotes?.low ? Number(holding.stock_quotes.low) : null,
        volume: holding.stock_quotes?.volume ? Number(holding.stock_quotes.volume) : null,
        previousClose: holding.stock_quotes?.previous_close ? Number(holding.stock_quotes.previous_close) : null,
        latestTradingDay: holding.stock_quotes?.latest_trading_day || null,
        lastUpdated: holding.stock_quotes?.last_updated || null,
        isStale,
        createdAt: holding.created_at,
        updatedAt: holding.updated_at
      };
    });

    // Calculate portfolio totals
    const portfolioMetrics = holdingsWithMetrics.reduce(
      (acc, holding) => ({
        totalCostBasis: acc.totalCostBasis + holding.costBasis,
        totalMarketValue: acc.totalMarketValue + holding.marketValue,
        totalGainLoss: acc.totalGainLoss + holding.totalGainLoss,
        totalDayGainLoss: acc.totalDayGainLoss + holding.dayGainLoss
      }),
      { totalCostBasis: 0, totalMarketValue: 0, totalGainLoss: 0, totalDayGainLoss: 0 }
    );

    const totalGainLossPercent = portfolioMetrics.totalCostBasis > 0
      ? (portfolioMetrics.totalGainLoss / portfolioMetrics.totalCostBasis) * 100
      : 0;

    const totalDayGainLossPercent = (portfolioMetrics.totalMarketValue - portfolioMetrics.totalDayGainLoss) > 0
      ? (portfolioMetrics.totalDayGainLoss / (portfolioMetrics.totalMarketValue - portfolioMetrics.totalDayGainLoss)) * 100
      : 0;

    // Check if any holdings have stale quotes
    const hasStaleQuotes = holdingsWithMetrics.some(h => h.isStale);

    return NextResponse.json({
      portfolio: {
        id: portfolio.id,
        userId: portfolio.user_id,
        name: portfolio.name,
        isDefault: portfolio.is_default,
        createdAt: portfolio.created_at,
        updatedAt: portfolio.updated_at
      },
      holdings: holdingsWithMetrics,
      summary: {
        totalHoldings: holdingsWithMetrics.length,
        totalCostBasis: Math.round(portfolioMetrics.totalCostBasis * 100) / 100,
        totalMarketValue: Math.round(portfolioMetrics.totalMarketValue * 100) / 100,
        totalGainLoss: Math.round(portfolioMetrics.totalGainLoss * 100) / 100,
        totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
        totalDayGainLoss: Math.round(portfolioMetrics.totalDayGainLoss * 100) / 100,
        totalDayGainLossPercent: Math.round(totalDayGainLossPercent * 100) / 100
      },
      meta: {
        hasStaleQuotes,
        refreshedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Portfolio with prices fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch portfolio with prices',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

