'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';

// Bright, distinct colors for the pie chart
const CHART_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
];

interface HoldingData {
  symbol: string;
  name: string;
  value: number;
  shares: number;
  price: number;
}

interface PortfolioPieChartProps {
  holdings: HoldingData[];
}

export default function PortfolioPieChart({ holdings }: PortfolioPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Debug logging
  console.log('PortfolioPieChart received holdings:', holdings);

  // Filter out holdings with zero or negative values
  const validHoldings = holdings.filter(h => h.value > 0);
  
  console.log('Valid holdings for pie chart:', validHoldings);

  if (validHoldings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            Add holdings with market prices to see allocation chart
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total value
  const totalValue = validHoldings.reduce((sum, h) => sum + h.value, 0);

  // Calculate percentages
  const chartData = validHoldings.map((holding, index) => {
    const percentage = (holding.value / totalValue) * 100;
    return {
      ...holding,
      percentage,
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // SVG donut chart parameters
  const size = 300;
  const strokeWidth = 50;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate cumulative percentages for stroke-dasharray
  let cumulativePercent = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Pie Chart using SVG circles */}
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
              />
              
              {/* Colored segments */}
              {chartData.map((item, index) => {
                const segmentPercent = item.percentage;
                const offset = circumference - (cumulativePercent / 100) * circumference;
                const dashArray = `${(segmentPercent / 100) * circumference} ${circumference}`;
                
                const circle = (
                  <circle
                    key={item.symbol}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={-offset}
                    opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
                    style={{
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
                
                cumulativePercent += segmentPercent;
                return circle;
              })}
            </svg>
            
            {/* Center text overlay */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Total Value
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(totalValue)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 w-full md:w-auto md:min-w-[300px]">
            {chartData.map((item, index) => (
              <div
                key={item.symbol}
                className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                  hoveredIndex === index ? 'bg-gray-100 dark:bg-gray-800 shadow-sm' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.symbol}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.shares} shares @ {formatCurrency(item.price)}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
