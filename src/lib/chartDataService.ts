/**
 * Chart Data Service
 * Handles fetching and processing market data for TradingView charts
 * Now using Massive API for real-time data
 */

import { getMassiveClient } from './massiveClient';
import { ChartData, createMockChartData } from '@/components/charts/TradingViewChart';

export interface ChartDataOptions {
  symbol: string;
  interval?: 'daily' | 'weekly' | 'monthly';
  period?: number; // days
  useMockData?: boolean;
}

export class ChartDataService {
  /**
   * Get chart data for a symbol using Massive API
   */
  static async getChartData(options: ChartDataOptions): Promise<ChartData[]> {
    const { symbol, interval = 'daily', period = 30, useMockData = false } = options;

    try {
      if (useMockData) {
        console.log(`Using mock data for ${symbol}`);
        return createMockChartData(symbol, period);
      }

      const massiveClient = getMassiveClient();
      
      // Calculate date range
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - period);
      
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];

      // Map interval to Massive timespan
      const timespan = interval === 'weekly' ? 'week' : interval === 'monthly' ? 'month' : 'day';

      // Get aggregates from Massive
      const aggregates = await massiveClient.getAggregates(
        symbol,
        1,
        timespan,
        fromStr,
        toStr
      );
      
      if (aggregates && aggregates.length > 0) {
        console.log(`Got Massive data for ${symbol}: ${aggregates.length} data points`);
        
        // Convert to ChartData format
        return aggregates.map(agg => ({
          time: Math.floor(agg.t / 1000), // Convert milliseconds to seconds
          open: agg.o,
          high: agg.h,
          low: agg.l,
          close: agg.c,
          volume: agg.v,
        }));
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
      const massiveClient = getMassiveClient();
      const snapshot = await massiveClient.getSnapshot(symbol);
      
      if (snapshot && snapshot.day) {
        return {
          price: snapshot.day.c,
          change: snapshot.todaysChange,
          changePercent: snapshot.todaysChangePerc
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
      const massiveClient = getMassiveClient();
      return await massiveClient.getTickerDetails(symbol);
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error);
      return null;
    }
  }
}
