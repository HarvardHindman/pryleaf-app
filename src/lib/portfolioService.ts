import { supabase } from './supabaseClient';
import type { 
  Portfolio, 
  Holding, 
  HoldingWithPrice, 
  PortfolioWithHoldings,
  PortfolioStock
} from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class PortfolioService {
  // Get user's default portfolio (what we'll use now)
  static async getUserDefaultPortfolio(userId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Server-side version that accepts a Supabase client
  static async getUserDefaultPortfolioWithClient(
    supabaseClient: SupabaseClient, 
    userId: string
  ): Promise<Portfolio | null> {
    const { data, error } = await supabaseClient
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get all user portfolios (ready for future)
  static async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create new portfolio (ready for future)
  static async createPortfolio(userId: string, name: string, makeDefault = false): Promise<Portfolio> {
    // If making this default, unset other defaults first
    if (makeDefault) {
      await supabase
        .from('portfolios')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name,
        is_default: makeDefault
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Server-side version that accepts a Supabase client
  static async createPortfolioWithClient(
    supabaseClient: SupabaseClient, 
    userId: string, 
    name: string, 
    makeDefault = false
  ): Promise<Portfolio> {
    // If making this default, unset other defaults first
    if (makeDefault) {
      await supabaseClient
        .from('portfolios')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabaseClient
      .from('portfolios')
      .insert({
        user_id: userId,
        name,
        is_default: makeDefault
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get portfolio holdings
  static async getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('symbol');

    if (error) throw error;
    return data || [];
  }

  // Server-side version that accepts a Supabase client
  static async getPortfolioHoldingsWithClient(
    supabaseClient: SupabaseClient, 
    portfolioId: string
  ): Promise<Holding[]> {
    const { data, error } = await supabaseClient
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('symbol');

    if (error) throw error;
    return data || [];
  }

  // Add or update a holding
  static async upsertHolding(
    portfolioId: string, 
    symbol: string, 
    shares: number, 
    averageCost: number,
    companyName?: string
  ): Promise<Holding> {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .upsert({
        portfolio_id: portfolioId,
        symbol: symbol.toUpperCase(),
        shares,
        average_cost: averageCost,
        company_name: companyName,
      }, {
        onConflict: 'portfolio_id,symbol'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Server-side version that accepts a Supabase client
  static async upsertHoldingWithClient(
    supabaseClient: SupabaseClient,
    portfolioId: string, 
    symbol: string, 
    shares: number, 
    averageCost: number,
    companyName?: string
  ): Promise<Holding> {
    const { data, error } = await supabaseClient
      .from('portfolio_holdings')
      .upsert({
        portfolio_id: portfolioId,
        symbol: symbol.toUpperCase(),
        shares,
        average_cost: averageCost,
        company_name: companyName,
      }, {
        onConflict: 'portfolio_id,symbol'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update existing holding
  static async updateHolding(holdingId: string, shares: number, averageCost: number): Promise<Holding> {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .update({
        shares,
        average_cost: averageCost,
      })
      .eq('id', holdingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Server-side version that accepts a Supabase client
  static async updateHoldingWithClient(
    supabaseClient: SupabaseClient,
    holdingId: string, 
    shares: number, 
    averageCost: number
  ): Promise<Holding> {
    const { data, error } = await supabaseClient
      .from('portfolio_holdings')
      .update({
        shares,
        average_cost: averageCost,
      })
      .eq('id', holdingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Remove a holding
  static async removeHolding(holdingId: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId);

    if (error) throw error;
  }

  // Server-side version that accepts a Supabase client
  static async removeHoldingWithClient(
    supabaseClient: SupabaseClient,
    holdingId: string
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId);

    if (error) throw error;
  }

  // Get default portfolio with holdings (what we'll use now)
  static async getUserDefaultPortfolioWithHoldings(userId: string): Promise<PortfolioWithHoldings | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_holdings (*)
      `)
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    
    return {
      ...data,
      holdings: data.portfolio_holdings || []
    };
  }

  // Get specific portfolio with holdings (ready for future)
  static async getPortfolioWithHoldings(portfolioId: string): Promise<PortfolioWithHoldings | null> {
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_holdings (*)
      `)
      .eq('id', portfolioId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    
    return {
      ...data,
      holdings: data.portfolio_holdings || []
    };
  }

  // Convert database holdings to UI format (for existing components)
  static convertToPortfolioStocks(holdings: Holding[], marketPrices: Record<string, { price: number; change: number; changePercent: number }> = {}): PortfolioStock[] {
    return holdings.map(holding => {
      const marketData = marketPrices[holding.symbol] || { price: 0, change: 0, changePercent: 0 };
      
      return {
        symbol: holding.symbol,
        name: holding.company_name || holding.symbol,
        price: marketData.price,
        change: marketData.change,
        changePercent: marketData.changePercent,
        shares: holding.shares,
        costBasis: holding.average_cost,
        addedAt: holding.created_at
      };
    });
  }

  // Calculate portfolio metrics
  static calculatePortfolioMetrics(holdings: HoldingWithPrice[]): {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  } {
    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach(holding => {
      const marketValue = (holding.current_price || 0) * holding.shares;
      const costBasis = holding.average_cost * holding.shares;
      
      totalValue += marketValue;
      totalCost += costBasis;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent
    };
  }
}
