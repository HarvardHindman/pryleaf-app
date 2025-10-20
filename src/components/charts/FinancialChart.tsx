'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinancialChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  title: string;
  type?: 'line' | 'bar';
  valueFormatter?: (value: number) => string;
  color?: string;
  height?: number;
}

export default function FinancialChart({
  data,
  title,
  type = 'line',
  valueFormatter = (value) => `$${(value / 1000000000).toFixed(2)}B`,
  color = '#26a69a',
  height = 300,
}: FinancialChartProps) {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            style={{ fontSize: '12px' }}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
            formatter={(value: any) => [valueFormatter(value), title]}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend
            wrapperStyle={{ color: 'var(--text-muted)', fontSize: '12px' }}
          />
          <DataComponent
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            strokeWidth={type === 'line' ? 2 : 0}
            dot={type === 'line' ? { fill: color, r: 4 } : undefined}
            name={title}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

