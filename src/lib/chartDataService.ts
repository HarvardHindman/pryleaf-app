/**
 * Chart Data Service
 * Handles fetching and processing market data for TradingView charts
 */

import { AlphaVantageSupabase } from './alphaVantageSupabase';
import { ChartData, convertAlphaVantageToTradingView, createMockChartData } from '@/components/charts/TradingViewChart';

export interface ChartDataOptions {
  symbol: string;
  interval?: 'daily' | 'weekly' | 'monthly';
  period?: number; // days
  useMockData?: boolean;
}

export class ChartDataService {
  /**
   * Get chart data for a symbol
   */
  static async getChartData(options: ChartDataOptions): Promise<ChartData[]> {
    const { symbol, interval = 'daily', period = 30, useMockData = false } = options;

    try {
      if (useMockData) {
        console.log(`Using mock data for ${symbol}`);
        return createMockChartData(symbol, period);
      }

      // Try to get real data from Alpha Vantage
      const timeSeriesData = await AlphaVantageSupabase.getTimeSeries(symbol, interval);
      
      if (timeSeriesData && timeSeriesData.length > 0) {
        console.log(`Got real Alpha Vantage data for ${symbol}: ${timeSeriesData.length} data points`);
        return convertAlphaVantageToTradingView(timeSeriesData);
      }

      // Fallback to mock data if no real data available
      console.log(`No real data available for ${symbol}, using mock data`);
      return createMockChartData(symbol, period);

    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      // Return mock data as fallback
      return createMockChartData(symbol, period);
    }
  }

  /**
   * Get multiple symbols' chart data for comparison
   */
  static async getMultipleChartData(symbols: string[], options: Omit<ChartDataOptions, 'symbol'> = {}): Promise<Record<string, ChartData[]>> {
    const results: Record<string, ChartData[]> = {};
    
    // Fetch data for all symbols in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await this.getChartData({ ...options, symbol });
        results[symbol] = data;
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        results[symbol] = createMockChartData(symbol, options.period || 30);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get portfolio performance chart data
   */
  static async getPortfolioChartData(holdings: Array<{ symbol: string; shares: number; averageCost: number }>): Promise<ChartData[]> {
    try {
      // Get current prices and historical data for all holdings
      const symbols = holdings.map(h => h.symbol);
      const chartData = await this.getMultipleChartData(symbols, { period: 30 });
      
      // Calculate portfolio value over time
      const portfolioData: ChartData[] = [];
      const dates = new Set<string>();
      
      // Collect all unique dates
      Object.values(chartData).forEach(data => {
        data.forEach(point => {
          const date = new Date(point.time * 1000).toISOString().split('T')[0];
          dates.add(date);
        });
      });

      // Calculate portfolio value for each date
      Array.from(dates).sort().forEach(date => {
        let totalValue = 0;
        let hasData = false;

        holdings.forEach(holding => {
          const symbolData = chartData[holding.symbol];
          if (symbolData) {
            const dayData = symbolData.find(point => 
              new Date(point.time * 1000).toISOString().split('T')[0] === date
            );
            
            if (dayData && dayData.close) {
              totalValue += dayData.close * holding.shares;
              hasData = true;
            }
          }
        });

        if (hasData) {
          portfolioData.push({
            time: Math.floor(new Date(date).getTime() / 1000),
            value: Number(totalValue.toFixed(2))
          });
        }
      });

      return portfolioData;

    } catch (error) {
      console.error('Error calculating portfolio chart data:', error);
      // Return mock portfolio data
      return createMockChartData('PORTFOLIO', 30).map(point => ({
        time: point.time,
        value: point.close || 10000
      }));
    }
  }

  /**
   * Get market index data for comparison
   */
  static async getMarketIndexData(): Promise<Record<string, ChartData[]>> {
    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ
    
    return this.getMultipleChartData(indices, { 
      interval: 'daily', 
      period: 30,
      useMockData: true // Use mock data for indices as they're not in our Alpha Vantage setup
    });
  }

  /**
   * Get sector performance data
   */
  static async getSectorPerformanceData(): Promise<Record<string, ChartData[]>> {
    // Common sector ETFs
    const sectorETFs = [
      'XLK', // Technology
      'XLF', // Financial
      'XLV', // Healthcare
      'XLE', // Energy
      'XLI', // Industrial
      'XLY', // Consumer Discretionary
      'XLP', // Consumer Staples
      'XLU', // Utilities
      'XLB', // Materials
      'XLRE' // Real Estate
    ];

    return this.getMultipleChartData(sectorETFs, { 
      interval: 'daily', 
      period: 30,
      useMockData: true // Use mock data for sector ETFs
    });
  }

  /**
   * Get real-time quote data for chart overlay
   */
  static async getRealTimeQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    try {
      const quote = await AlphaVantageSupabase.getQuote(symbol);
      if (quote) {
        return {
          price: parseFloat(quote.price),
          change: parseFloat(quote.change),
          changePercent: parseFloat(quote.changePercent.replace('%', ''))
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching real-time quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get company overview for chart context
   */
  static async getCompanyOverview(symbol: string) {
    try {
      return await AlphaVantageSupabase.getCompanyOverview(symbol);
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error);
      return null;
    }
  }
}
