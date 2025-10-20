'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FinancialChart from '@/components/charts/FinancialChart';

interface IncomeStatementRow {
  label: string;
  values: number[];
  isHeader?: boolean;
  isSubItem?: boolean;
  formatAsPercent?: boolean;
  chartable?: boolean;
}

interface IncomeStatementTableProps {
  periods: string[];
  data: IncomeStatementRow[];
  period: 'annual' | 'quarterly';
}

export default function IncomeStatementTable({ periods, data, period }: IncomeStatementTableProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const toggleChart = (label: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const formatValue = (value: number, asPercent: boolean = false) => {
    if (!value && value !== 0) return '—';
    
    if (asPercent) {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    // Format large numbers
    const absValue = Math.abs(value);
    let formatted = '';
    
    if (absValue >= 1e12) {
      formatted = `${(value / 1e12).toFixed(2)}T`;
    } else if (absValue >= 1e9) {
      formatted = `${(value / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
      formatted = `${(value / 1e6).toFixed(2)}M`;
    } else {
      formatted = value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    
    return value < 0 ? `(${formatted.replace('-', '')})` : formatted;
  };

  const getChartData = (row: IncomeStatementRow) => {
    return periods.map((period, index) => ({
      date: period,
      value: row.values[index] || 0
    }));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="text-left py-3 px-4 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {period === 'annual' ? 'Fiscal Year' : 'Quarter'}
              </th>
              {periods.map((p) => (
                <th key={p} className="text-right py-3 px-4 font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  {p}
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <React.Fragment key={idx}>
                <tr 
                  className={`border-b transition-colors ${row.isHeader ? 'font-semibold' : ''}`}
                  style={{ 
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: row.isHeader ? 'var(--surface-tertiary)' : 'transparent'
                  }}
                >
                  <td 
                    className={`py-3 px-4 text-sm ${row.isSubItem ? 'pl-8' : ''}`}
                    style={{ color: row.isHeader ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {row.label}
                  </td>
                  {row.values.map((value, vIdx) => (
                    <td 
                      key={vIdx} 
                      className="text-right py-3 px-4 text-sm font-medium whitespace-nowrap"
                      style={{ color: value < 0 ? 'var(--danger-text)' : 'var(--text-primary)' }}
                    >
                      {formatValue(value, row.formatAsPercent)}
                    </td>
                  ))}
                  <td className="py-3 px-2">
                    {row.chartable && !row.isHeader && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleChart(row.label)}
                        className="h-8 w-8 p-0"
                      >
                        <LineChart className="h-4 w-4" style={{ color: expandedMetrics.has(row.label) ? 'var(--interactive-primary)' : 'var(--text-muted)' }} />
                      </Button>
                    )}
                  </td>
                </tr>
                
                {/* Expanded Chart Row */}
                {expandedMetrics.has(row.label) && row.chartable && (
                  <tr>
                    <td colSpan={periods.length + 2} className="p-4" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                      <div className="w-full h-64">
                        <FinancialChart
                          data={getChartData(row)}
                          title={row.label}
                          type="bar"
                          color="var(--interactive-primary)"
                          valueFormatter={(value) => formatValue(value, row.formatAsPercent)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

