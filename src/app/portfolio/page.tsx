'use client';

// AppLayout is now handled at the root level
import PortfolioManager from '@/components/PortfolioManager';
import PortfolioPieChart from '@/components/PortfolioPieChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Briefcase, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import TradingViewChart from '@/components/charts/TradingViewChart';
import { ChartDataService } from '@/lib/chartDataService';
import { ChartData } from '@/components/charts/TradingViewChart';
import { useState, useEffect, useMemo } from 'react';

export default function Portfolio() {
  const { user } = useAuth();
  const { 
    portfolio, 
    portfolioStocks, 
    loading, 
    error, 
    portfolioMetrics 
  } = usePortfolio();

  const [portfolioChartData, setPortfolioChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    console.log('Portfolio stocks for pie chart:', portfolioStocks);
    const data = portfolioStocks
      .filter(stock => stock.price > 0 && stock.shares && stock.shares > 0)
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        value: stock.price * (stock.shares || 0),
        shares: stock.shares || 0,
        price: stock.price
      }));
    console.log('Prepared pie chart data:', data);
    return data;
  }, [portfolioStocks]);

  // Load portfolio chart data when holdings change
  useEffect(() => {
    if (portfolioStocks.length > 0) {
      const loadPortfolioChart = async () => {
        setChartLoading(true);
        try {
          const holdings = portfolioStocks.map(stock => ({
            symbol: stock.symbol,
            shares: stock.shares || 0,
            averageCost: stock.costBasis || 0
          }));
          
          const data = await ChartDataService.getPortfolioChartData(holdings);
          setPortfolioChartData(data);
        } catch (error) {
          console.error('Error loading portfolio chart data:', error);
          // Fallback to mock data
          const mockData = await ChartDataService.getChartData({
            symbol: 'PORTFOLIO',
            interval: 'daily',
            period: 30,
            useMockData: true
          });
          setPortfolioChartData(mockData.map(point => ({
            time: point.time,
            value: point.close || 10000
          })));
        } finally {
          setChartLoading(false);
        }
      };

      loadPortfolioChart();
    } else {
      setPortfolioChartData([]);
      setChartLoading(false);
    }
  }, [portfolioStocks]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-muted">Please log in to view your portfolio.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-default">Portfolio</h1>
            <p className="text-text-muted">Manage your investment positions</p>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <PieChart className="h-5 w-5" />
            <span className="text-sm">
              {portfolio?.name || 'My Portfolio'}
            </span>
          </div>
        </div>

        {/* Portfolio Summary */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : portfolioMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm">Total Value</p>
                    <p className="text-2xl font-bold text-text-default">
                      {formatCurrency(portfolioMetrics.totalValue)}
                    </p>
                    <p className="text-xs text-text-muted">
                      Cost: {formatCurrency(portfolioMetrics.totalCost)}
                    </p>
                  </div>
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm">Total P&L</p>
                    <p className={`text-2xl font-bold ${portfolioMetrics.totalGainLoss >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
                      {formatCurrency(portfolioMetrics.totalGainLoss)}
                    </p>
                  </div>
                  {portfolioMetrics.totalGainLoss >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-success-text" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-danger-text" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm">Total Return</p>
                    <p className={`text-2xl font-bold ${portfolioMetrics.totalGainLossPercent >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
                      {formatPercentage(portfolioMetrics.totalGainLossPercent)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-info" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center text-text-muted">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No portfolio data</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center text-text-muted">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No P&L data</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center text-text-muted">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No return data</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">
                <p>Error: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Allocation Pie Chart */}
        <PortfolioPieChart holdings={pieChartData} />

        {/* Portfolio Performance Chart */}
        {portfolioStocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TradingViewChart
                data={portfolioChartData}
                symbol="PORTFOLIO"
                type="line"
                height={400}
                className="w-full"
                theme="dark"
                autoSize={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Portfolio Manager */}
        <PortfolioManager />

        {/* Current Holdings Table */}
        {portfolioStocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Holdings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-3 px-4 text-text-muted font-medium">Symbol</th>
                      <th className="text-left py-3 px-4 text-text-muted font-medium">Name</th>
                      <th className="text-right py-3 px-4 text-text-muted font-medium">Price</th>
                      <th className="text-right py-3 px-4 text-text-muted font-medium">Shares</th>
                      <th className="text-right py-3 px-4 text-text-muted font-medium">Market Value</th>
                      <th className="text-right py-3 px-4 text-text-muted font-medium">Cost Basis</th>
                      <th className="text-right py-3 px-4 text-text-muted font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioStocks.map((stock) => {
                      const marketValue = (stock.shares || 0) * stock.price;
                      const costBasis = (stock.shares || 0) * (stock.costBasis || 0);
                      const pnl = marketValue - costBasis;
                      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
                      const isPositive = pnl >= 0;

                      return (
                        <tr key={stock.symbol} className="border-b border-border-subtle hover:bg-background-subtle">
                          <td className="py-3 px-4">
                            <div className="font-medium text-text-default">{stock.symbol}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-text-default">{stock.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-text-default">{formatCurrency(stock.price)}</div>
                            <div className={`text-xs ${stock.change >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-text-default">
                            {stock.shares}
                          </td>
                          <td className="py-3 px-4 text-right text-text-default font-medium">
                            {formatCurrency(marketValue)}
                          </td>
                          <td className="py-3 px-4 text-right text-text-muted">
                            {formatCurrency(costBasis)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={`font-medium ${isPositive ? 'text-success-text' : 'text-danger-text'}`}>
                              {formatCurrency(pnl)}
                            </div>
                            <div className={`text-xs ${isPositive ? 'text-success-text' : 'text-danger-text'}`}>
                              {formatPercentage(pnlPercentage)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
