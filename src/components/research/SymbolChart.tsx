'use client';

import { useMemo } from 'react';
import AdvancedTradingChart, { ChartDataPoint } from '@/components/charts/AdvancedTradingChart';

export type ChartType = 'candlestick' | 'line' | 'area';
export type ChartPeriod = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';

interface SymbolChartProps {
  ticker: string;
  chartData: any[];
  chartType: ChartType;
  chartPeriod: ChartPeriod;
  chartLoading: boolean;
  onChartTypeChange: (type: ChartType) => void;
  onChartPeriodChange: (period: ChartPeriod) => void;
  companyName?: string;
}

export function SymbolChart({
  ticker,
  chartData,
  chartType,
  chartLoading,
  onChartTypeChange,
  companyName,
}: SymbolChartProps) {
  // Transform data to match AdvancedTradingChart format - memoized to prevent unnecessary recalculations
  const transformedData: ChartDataPoint[] = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    return chartData.map((d) => ({
      time: typeof d.time === 'string' ? d.time.split(' ')[0].split('T')[0] : d.time,
      open: d.open || 0,
      high: d.high || 0,
      low: d.low || 0,
      close: d.close || d.value || 0,
      volume: d.volume,
    })).sort((a, b) => a.time.localeCompare(b.time));
  }, [chartData]);

  // Always render the chart - it handles its own loading/empty states internally
  return (
    <div className="h-full">
      <AdvancedTradingChart
        data={transformedData}
        symbol={ticker}
        type={chartType}
        height={520}
        showVolume={true}
        showIndicators={true}
        onTypeChange={onChartTypeChange}
        companyName={companyName}
        isLoading={chartLoading}
      />
    </div>
  );
}
