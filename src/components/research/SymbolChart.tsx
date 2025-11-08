'use client';

import { LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TradingViewChart from '@/components/charts/TradingViewChart';

export type ChartType = 'candlestick' | 'line' | 'area';
export type ChartPeriod = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';

interface SymbolChartProps {
  ticker: string;
  chartData: any[];
  chartType: ChartType;
  chartPeriod: ChartPeriod;
  chartLoading: boolean;
  onChartTypeChange: (type: ChartType) => void;
  onChartPeriodChange: (period: ChartPeriod) => void;
}

export function SymbolChart({
  ticker,
  chartData,
  chartType,
  chartPeriod,
  chartLoading,
  onChartTypeChange,
  onChartPeriodChange,
}: SymbolChartProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Price Chart
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              {(['candlestick', 'line', 'area'] as const).map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChartTypeChange(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
            {/* Period Selector */}
            <div className="flex items-center gap-1">
              {(['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'] as const).map((p) => (
                <Button
                  key={p}
                  variant={chartPeriod === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onChartPeriodChange(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        {chartLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--interactive-primary)' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading chart...</p>
            </div>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <div className="flex-1 min-h-0 w-full">
            <TradingViewChart
              data={chartData}
              symbol={ticker}
              type={chartType}
              height={450}
              className="w-full"
              theme="dark"
              autoSize={true}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p style={{ color: 'var(--text-muted)' }}>No chart data available</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-subtle)' }}>
                Chart data will appear when available
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

