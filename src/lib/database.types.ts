// TypeScript types for Supabase database schema
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  symbol: string;
  company_name: string | null;
  shares: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
}

// For UI display with market data
export interface HoldingWithPrice extends Holding {
  current_price?: number;
  market_value?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
  change?: number;
  change_percent?: number;
}

export interface PortfolioWithHoldings extends Portfolio {
  holdings: HoldingWithPrice[];
  total_value?: number;
  total_cost?: number;
  total_gain_loss?: number;
  total_gain_loss_percent?: number;
}

// For compatibility with existing UI components
export interface PortfolioStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares?: number;
  costBasis?: number;
  addedAt: string;
}
