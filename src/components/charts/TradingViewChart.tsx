'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';

export interface ChartData {
  time: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
}

export interface TradingViewChartProps {
  data: ChartData[];
  symbol: string;
  type?: 'candlestick' | 'line' | 'area';
  height?: number;
  width?: number;
  className?: string;
  showVolume?: boolean;
  theme?: 'light' | 'dark';
  autoSize?: boolean;
}

export default function TradingViewChart({
  data,
  symbol,
  type = 'candlestick',
  height = 400,
  width,
  className = '',
  showVolume = false,
  theme = 'dark',
  autoSize = true
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Theme colors
  const colors = {
    light: {
      background: '#ffffff',
      text: '#191919',
      grid: '#e1e1e1',
      crosshair: '#758696',
      up: '#26a69a',
      down: '#ef5350',
      border: '#cccccc'
    },
    dark: {
      background: '#1e1e1e',
      text: '#d1d4dc',
      grid: '#2a2e39',
      crosshair: '#758696',
      up: '#26a69a',
      down: '#ef5350',
      border: '#485563'
    }
  };

  const currentColors = colors[theme];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: currentColors.background },
          textColor: currentColors.text,
        },
        grid: {
          vertLines: { color: currentColors.grid },
          horzLines: { color: currentColors.grid },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: currentColors.border,
        },
        timeScale: {
          borderColor: currentColors.border,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12, // Add padding on right side (about 1/3 of visible area)
          barSpacing: 6,
        },
        width: width || (autoSize ? chartContainerRef.current.clientWidth : 800),
        height: height,
      });

      // Create series based on type using v5 API
      let series: any;
      
      if (type === 'candlestick') {
        series = chart.addSeries(CandlestickSeries, {
          upColor: currentColors.up,
          downColor: currentColors.down,
          borderDownColor: currentColors.down,
          borderUpColor: currentColors.up,
          wickDownColor: currentColors.down,
          wickUpColor: currentColors.up,
        });
      } else if (type === 'area') {
        series = chart.addSeries(AreaSeries, {
          topColor: currentColors.up + '80',
          bottomColor: currentColors.up + '00',
          lineColor: currentColors.up,
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(LineSeries, {
          color: currentColors.up,
          lineWidth: 2,
        });
      }

      // Store references
      chartRef.current = chart;
      seriesRef.current = series;

      // Transform and set data
      if (data && data.length > 0) {
        try {
          const formattedData = data.map(d => {
            // Convert time to YYYY-MM-DD format for lightweight-charts
            let timeValue: string;
            if (typeof d.time === 'string') {
              // If it's already a string, use it (assuming YYYY-MM-DD format)
              timeValue = d.time;
            } else {
              // If it's a Unix timestamp, convert to YYYY-MM-DD
              const date = new Date(d.time * 1000);
              timeValue = date.toISOString().split('T')[0];
            }

            if (type === 'candlestick') {
              return {
                time: timeValue,
                open: d.open || 0,
                high: d.high || 0,
                low: d.low || 0,
                close: d.close || 0,
              };
            } else {
              return {
                time: timeValue,
                value: d.close || d.value || 0,
              };
            }
          }).sort((a, b) => a.time.localeCompare(b.time)); // Sort by date string

          console.log('📊 Setting chart data:', {
            symbol,
            type,
            dataPoints: formattedData.length,
            firstPoint: formattedData[0],
            lastPoint: formattedData[formattedData.length - 1]
          });
          series.setData(formattedData);
          chart.timeScale().fitContent();
          setIsLoading(false);
        } catch (dataError) {
          console.error('Error setting chart data:', dataError);
          setIsLoading(false);
        }
      } else {
        console.warn('⚠️ No data available for chart', { dataLength: data?.length, symbol });
        setIsLoading(false);
      }

      // Handle resize
      const handleResize = () => {
        if (autoSize && chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error('Error creating chart:', error);
      setIsLoading(false);
    }
  }, [type, height, width, autoSize, theme, currentColors]);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && chartRef.current && data && data.length > 0) {
      try {
        const formattedData = data.map(d => {
          // Convert time to YYYY-MM-DD format for lightweight-charts
          let timeValue: string;
          if (typeof d.time === 'string') {
            // If it's already a string, use it (assuming YYYY-MM-DD format)
            timeValue = d.time;
          } else {
            // If it's a Unix timestamp, convert to YYYY-MM-DD
            const date = new Date(d.time * 1000);
            timeValue = date.toISOString().split('T')[0];
          }

          if (type === 'candlestick') {
            return {
              time: timeValue,
              open: d.open || 0,
              high: d.high || 0,
              low: d.low || 0,
              close: d.close || 0,
            };
          } else {
            return {
              time: timeValue,
              value: d.close || d.value || 0,
            };
          }
        }).sort((a, b) => a.time.localeCompare(b.time)); // Sort by date string

        console.log('🔄 Updating chart data:', {
          symbol,
          dataPoints: formattedData.length
        });
        seriesRef.current.setData(formattedData);
        chartRef.current.timeScale().fitContent();
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating chart data:', error);
        setIsLoading(false);
      }
    }
  }, [data, type, symbol]);


  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-text-muted">Loading chart...</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text-primary">{symbol}</h3>
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <span className="px-2 py-1 bg-background-secondary rounded">
            {type === 'candlestick' ? 'Candlestick' : 'Line'}
          </span>
        </div>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full border border-border rounded overflow-hidden"
        style={{ height: `${height}px` }}
      />
      
      {data.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center text-text-muted">
            <p>No chart data available</p>
            <p className="text-sm">Data will appear when available</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to convert Alpha Vantage time series data to TradingView format
export function convertAlphaVantageToTradingView(
  data: Array<{
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>
): ChartData[] {
  return data.map(item => {
    // Convert to YYYY-MM-DD format
    const date = new Date(item.timestamp);
    const timeStr = date.toISOString().split('T')[0];
    
    return {
      time: timeStr,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
    };
  });
}

// Utility function to create mock data for testing
export function createMockChartData(symbol: string, days: number = 30): ChartData[] {
  const data: ChartData[] = [];
  const basePrice = symbol === 'AAPL' ? 150 : symbol === 'MSFT' ? 300 : 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Format date as YYYY-MM-DD for lightweight-charts
    const timeStr = date.toISOString().split('T')[0];
    
    const volatility = 0.02; // 2% daily volatility
    const trend = 0.001; // Slight upward trend
    
    const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const close = open * (1 + (Math.random() - 0.5) * volatility + trend);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    data.push({
      time: timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
  }
  
  return data;
}
