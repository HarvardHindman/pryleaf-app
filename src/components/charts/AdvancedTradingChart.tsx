'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { 
  RotateCcw, 
  TrendingUp,
  CandlestickChart,
  LineChart,
  AreaChart,
  Gauge,
  BarChart3,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Settings2,
  Waves,
  Target,
  Layers
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// Types
export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type ChartType = 'candlestick' | 'line' | 'area';
export type ChartPeriod = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';

interface TechnicalIndicator {
  id: string;
  name: string;
  type: 'sma' | 'ema' | 'bb';
  period: number;
  color: string;
  enabled: boolean;
}

interface ChartTheme {
  background: string;
  backgroundSecondary: string;
  text: string;
  textMuted: string;
  grid: string;
  crosshair: string;
  up: string;
  down: string;
  border: string;
  volumeUp: string;
  volumeDown: string;
  buttonBg: string;
  buttonHover: string;
  tooltipBg: string;
}

export interface AdvancedTradingChartProps {
  data: ChartDataPoint[];
  symbol: string;
  type?: ChartType;
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  currentPeriod?: ChartPeriod;
  onTypeChange?: (type: ChartType) => void;
  companyName?: string;
  isLoading?: boolean;
}

// ============================================
// TECHNICAL INDICATOR CALCULATIONS
// ============================================

// Calculate SMA (Simple Moving Average)
function calculateSMA(data: ChartDataPoint[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(data: ChartDataPoint[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i].close;
  }
  
  if (data.length >= period) {
    let ema = sum / period;
    result.push({ time: data[period - 1].time, value: ema });
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
      result.push({ time: data[i].time, value: ema });
    }
  }
  
  return result;
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(data: ChartDataPoint[], period: number = 14): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (data.length < period + 1) return result;

  let gains = 0;
  let losses = 0;

  // First RSI calculation
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: data[period].time, value: 100 - (100 / (1 + rs)) });

  // Subsequent RSI calculations using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: data[i].time, value: 100 - (100 / (1 + rs2)) });
  }

  return result;
}

// Calculate MACD (Moving Average Convergence Divergence)
function calculateMACD(data: ChartDataPoint[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  macd: { time: string; value: number }[];
  signal: { time: string; value: number }[];
  histogram: { time: string; value: number; color: string }[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine: { time: string; value: number }[] = [];
  
  // Calculate MACD line (fast EMA - slow EMA)
  const slowStartIndex = slowPeriod - fastPeriod;
  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA[i + slowStartIndex];
    if (fastValue) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastValue.value - slowEMA[i].value,
      });
    }
  }

  // Calculate Signal line (EMA of MACD)
  const signalLine: { time: string; value: number }[] = [];
  if (macdLine.length >= signalPeriod) {
    const multiplier = 2 / (signalPeriod + 1);
    let sum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      sum += macdLine[i].value;
    }
    let ema = sum / signalPeriod;
    signalLine.push({ time: macdLine[signalPeriod - 1].time, value: ema });
    
    for (let i = signalPeriod; i < macdLine.length; i++) {
      ema = (macdLine[i].value - ema) * multiplier + ema;
      signalLine.push({ time: macdLine[i].time, value: ema });
    }
  }

  // Calculate Histogram
  const histogram: { time: string; value: number; color: string }[] = [];
  const startIndex = signalPeriod - 1;
  for (let i = 0; i < signalLine.length; i++) {
    const macdValue = macdLine[i + startIndex];
    if (macdValue) {
      const histValue = macdValue.value - signalLine[i].value;
      histogram.push({
        time: signalLine[i].time,
        value: histValue,
        color: histValue >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
      });
    }
  }

  return {
    macd: macdLine.slice(startIndex),
    signal: signalLine,
    histogram,
  };
}

// Calculate Bollinger Bands
function calculateBollingerBands(data: ChartDataPoint[], period: number = 20, stdDev: number = 2): {
  upper: { time: string; value: number }[];
  middle: { time: string; value: number }[];
  lower: { time: string; value: number }[];
} {
  const middle = calculateSMA(data, period);
  const upper: { time: string; value: number }[] = [];
  const lower: { time: string; value: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = middle[i - period + 1].value;
    const squaredDiffs = slice.map(d => Math.pow(d.close - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    upper.push({ time: data[i].time, value: avg + stdDev * std });
    lower.push({ time: data[i].time, value: avg - stdDev * std });
  }

  return { upper, middle, lower };
}

// Calculate Stochastic Oscillator
function calculateStochastic(data: ChartDataPoint[], kPeriod: number = 14, dPeriod: number = 3): {
  k: { time: string; value: number }[];
  d: { time: string; value: number }[];
} {
  const kLine: { time: string; value: number }[] = [];

  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;
    
    const k = high === low ? 50 : ((close - low) / (high - low)) * 100;
    kLine.push({ time: data[i].time, value: k });
  }

  // Calculate %D (SMA of %K)
  const dLine: { time: string; value: number }[] = [];
  for (let i = dPeriod - 1; i < kLine.length; i++) {
    const sum = kLine.slice(i - dPeriod + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
    dLine.push({ time: kLine[i].time, value: sum / dPeriod });
  }

  return { k: kLine, d: dLine };
}

// Calculate ATR (Average True Range)
function calculateATR(data: ChartDataPoint[], period: number = 14): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (data.length < 2) return result;

  const trueRanges: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // First ATR is simple average
  if (trueRanges.length >= period) {
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push({ time: data[period].time, value: atr });

    // Subsequent ATR using smoothing
    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
      result.push({ time: data[i + 1].time, value: atr });
    }
  }

  return result;
}

// Calculate VWAP (Volume Weighted Average Price) - requires volume data
function calculateVWAP(data: ChartDataPoint[]): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const d of data) {
    if (!d.volume || d.volume === 0) continue;
    
    const typicalPrice = (d.high + d.low + d.close) / 3;
    cumulativeTPV += typicalPrice * d.volume;
    cumulativeVolume += d.volume;
    
    if (cumulativeVolume > 0) {
      result.push({ time: d.time, value: cumulativeTPV / cumulativeVolume });
    }
  }

  return result;
}

// Calculate WMA (Weighted Moving Average)
function calculateWMA(data: ChartDataPoint[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  const divisor = (period * (period + 1)) / 2;

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - period + 1 + j].close * (j + 1);
    }
    result.push({ time: data[i].time, value: sum / divisor });
  }

  return result;
}

// Format number for display with consistent decimal places
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toFixed(4);
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return (volume / 1e9).toFixed(1) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(1) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(1) + 'K';
  return volume.toFixed(0);
}

// Calculate date range for period
function getDateRangeForPeriod(period: ChartPeriod, data: ChartDataPoint[]): { from: string; to: string } | null {
  if (data.length === 0) return null;
  
  const lastDate = new Date(data[data.length - 1].time);
  const to = data[data.length - 1].time;
  let fromDate = new Date(lastDate);
  
  switch (period) {
    case '1D':
      fromDate.setDate(fromDate.getDate() - 1);
      break;
    case '5D':
      fromDate.setDate(fromDate.getDate() - 5);
      break;
    case '1M':
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case '3M':
      fromDate.setMonth(fromDate.getMonth() - 3);
      break;
    case '6M':
      fromDate.setMonth(fromDate.getMonth() - 6);
      break;
    case 'YTD':
      fromDate = new Date(lastDate.getFullYear(), 0, 1);
      break;
    case '1Y':
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case '5Y':
      fromDate.setFullYear(fromDate.getFullYear() - 5);
      break;
    case 'ALL':
      return null; // Will use fitContent
  }
  
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}

export default function AdvancedTradingChart({
  data,
  symbol,
  type = 'candlestick',
  height = 500,
  showVolume = true,
  showIndicators = true,
  currentPeriod = '3M',
  onTypeChange,
  companyName,
  isLoading = false,
}: AdvancedTradingChartProps) {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const isChartReady = useRef(false);
  
  const [volumeEnabled, setVolumeEnabled] = useState(showVolume);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(currentPeriod);
  
  const [crosshairData, setCrosshairData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null>(null);

  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([
    // Moving Averages
    { id: 'sma9', name: 'SMA 9', type: 'sma', period: 9, color: '#06b6d4', enabled: false },
    { id: 'sma20', name: 'SMA 20', type: 'sma', period: 20, color: '#3b82f6', enabled: false },
    { id: 'sma50', name: 'SMA 50', type: 'sma', period: 50, color: '#f59e0b', enabled: false },
    { id: 'sma200', name: 'SMA 200', type: 'sma', period: 200, color: '#ef4444', enabled: false },
    { id: 'ema9', name: 'EMA 9', type: 'ema', period: 9, color: '#8b5cf6', enabled: false },
    { id: 'ema21', name: 'EMA 21', type: 'ema', period: 21, color: '#ec4899', enabled: false },
    { id: 'ema55', name: 'EMA 55', type: 'ema', period: 55, color: '#14b8a6', enabled: false },
  ]);
  
  const [indicatorTab, setIndicatorTab] = useState<'ma' | 'oscillators' | 'bands'>('ma');

  // Theme colors
  const colors: Record<'light' | 'dark', ChartTheme> = {
    light: {
      background: '#fafbfc',
      backgroundSecondary: '#f0f2f5',
      text: '#1a1a2e',
      textMuted: '#6b7280',
      grid: '#e5e7eb',
      crosshair: '#9ca3af',
      up: '#10b981',
      down: '#ef4444',
      border: '#e5e7eb',
      volumeUp: 'rgba(16, 185, 129, 0.4)',
      volumeDown: 'rgba(239, 68, 68, 0.4)',
      buttonBg: '#ffffff',
      buttonHover: '#f3f4f6',
      tooltipBg: '#ffffff',
    },
    dark: {
      background: '#0f0f14',
      backgroundSecondary: '#1a1a24',
      text: '#e5e7eb',
      textMuted: '#9ca3af',
      grid: '#1f2937',
      crosshair: '#6b7280',
      up: '#22c55e',
      down: '#ef4444',
      border: '#374151',
      volumeUp: 'rgba(34, 197, 94, 0.4)',
      volumeDown: 'rgba(239, 68, 68, 0.4)',
      buttonBg: '#1f2937',
      buttonHover: '#374151',
      tooltipBg: '#1f2937',
    },
  };

  const currentColors = colors[theme];

  // Sort data by time
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.time.localeCompare(b.time));
  }, [data]);

  // Store sortedData in a ref for crosshair handler
  const sortedDataRef = useRef(sortedData);
  useEffect(() => {
    sortedDataRef.current = sortedData;
  }, [sortedData]);

  // Set visible range based on period (without recreating chart)
  const setVisibleRange = useCallback((period: ChartPeriod) => {
    if (!chartRef.current || sortedData.length === 0) return;
    
    const range = getDateRangeForPeriod(period, sortedData);
    
    try {
      if (range) {
        chartRef.current.timeScale().setVisibleRange({
          from: range.from as Time,
          to: range.to as Time,
        });
      } else {
        // For 'ALL', fit all content
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      // Fallback to fitContent if range fails
      chartRef.current.timeScale().fitContent();
    }
  }, [sortedData]);

  // Handle period change (internal)
  const handlePeriodChange = useCallback((period: ChartPeriod) => {
    setSelectedPeriod(period);
    setVisibleRange(period);
  }, [setVisibleRange]);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Only create chart if it doesn't exist
    if (chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: currentColors.background },
        textColor: currentColors.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: currentColors.grid, style: 1 },
        horzLines: { color: currentColors.grid, style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: currentColors.crosshair,
          width: 1,
          style: 2,
          labelBackgroundColor: currentColors.crosshair,
        },
        horzLine: {
          color: currentColors.crosshair,
          width: 1,
          style: 2,
          labelBackgroundColor: currentColors.crosshair,
        },
      },
      rightPriceScale: {
        borderColor: currentColors.border,
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      timeScale: {
        borderColor: currentColors.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 8,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      watermark: {
        visible: true,
        text: symbol,
        fontSize: 48,
        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    chartRef.current = chart;

    // Create main series
    let mainSeries: ISeriesApi<'Candlestick' | 'Line' | 'Area'>;

    if (type === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: currentColors.up,
        downColor: currentColors.down,
        borderUpColor: currentColors.up,
        borderDownColor: currentColors.down,
        wickUpColor: currentColors.up,
        wickDownColor: currentColors.down,
      });
    } else if (type === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: `${currentColors.up}80`,
        bottomColor: `${currentColors.up}05`,
        lineColor: currentColors.up,
        lineWidth: 2,
      });
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: currentColors.up,
        lineWidth: 2,
      });
    }

    mainSeriesRef.current = mainSeries;

    // Create volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: currentColors.volumeUp,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    volumeSeriesRef.current = volumeSeries;

    // Crosshair handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setCrosshairData(null);
        return;
      }

      const currentData = sortedDataRef.current;
      const dataPoint = currentData.find((d) => d.time === param.time);
      if (dataPoint) {
        const idx = currentData.indexOf(dataPoint);
        const previousPoint = idx > 0 ? currentData[idx - 1] : null;
        const previousClose = previousPoint?.close || dataPoint.open;
        const change = dataPoint.close - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        setCrosshairData({
          time: dataPoint.time,
          open: dataPoint.open,
          high: dataPoint.high,
          low: dataPoint.low,
          close: dataPoint.close,
          volume: dataPoint.volume || 0,
          change,
          changePercent,
        });
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        try {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        } catch (e) {}
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    isChartReady.current = true;

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch (e) {}
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current.clear();
      isChartReady.current = false;
    };
  }, []); // Empty deps - only run once on mount

  // Update chart colors when theme changes
  useEffect(() => {
    if (!chartRef.current) return;
    
    try {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: currentColors.background },
          textColor: currentColors.text,
        },
        grid: {
          vertLines: { color: currentColors.grid },
          horzLines: { color: currentColors.grid },
        },
        crosshair: {
          vertLine: { color: currentColors.crosshair, labelBackgroundColor: currentColors.crosshair },
          horzLine: { color: currentColors.crosshair, labelBackgroundColor: currentColors.crosshair },
        },
        rightPriceScale: { borderColor: currentColors.border },
        timeScale: { borderColor: currentColors.border },
        watermark: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
        },
      });

      // Update series colors
      if (mainSeriesRef.current) {
        if (type === 'candlestick') {
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>).applyOptions({
            upColor: currentColors.up,
            downColor: currentColors.down,
            borderUpColor: currentColors.up,
            borderDownColor: currentColors.down,
            wickUpColor: currentColors.up,
            wickDownColor: currentColors.down,
          });
        } else if (type === 'area') {
          (mainSeriesRef.current as ISeriesApi<'Area'>).applyOptions({
            topColor: `${currentColors.up}80`,
            bottomColor: `${currentColors.up}05`,
            lineColor: currentColors.up,
          });
        } else {
          (mainSeriesRef.current as ISeriesApi<'Line'>).applyOptions({
            color: currentColors.up,
          });
        }
      }
    } catch (e) {}
  }, [theme, currentColors, type]);

  // Update data when it changes
  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current || sortedData.length === 0) return;

    try {
      // Format main series data
      const formattedMainData = sortedData.map((d) => {
        if (type === 'candlestick') {
          return { time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close };
        }
        return { time: d.time as Time, value: d.close };
      });

      mainSeriesRef.current.setData(formattedMainData as any);

      // Update volume data only if there's actual volume data
      if (volumeSeriesRef.current) {
        const hasVolumeData = sortedData.some((d) => d.volume && d.volume > 0);
        
        if (hasVolumeData) {
          const volumeData = sortedData
            .filter((d) => d.volume && d.volume > 0)
            .map((d, i, arr) => ({
              time: d.time as Time,
              value: d.volume!,
              color: i > 0 && d.close < arr[i - 1].close ? currentColors.volumeDown : currentColors.volumeUp,
            }));
          volumeSeriesRef.current.setData(volumeData);
        } else {
          // No volume data - clear the series
          volumeSeriesRef.current.setData([]);
        }
      }

      // Apply current period range
      setTimeout(() => setVisibleRange(selectedPeriod), 50);
    } catch (e) {}
  }, [sortedData, type, currentColors, selectedPeriod, setVisibleRange]);

  // Toggle volume visibility
  useEffect(() => {
    if (!chartRef.current || !volumeSeriesRef.current) return;
    
    try {
      volumeSeriesRef.current.applyOptions({
        visible: volumeEnabled,
      });
      
      chartRef.current.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: volumeEnabled ? 0.3 : 0.1,
        },
      });
    } catch (e) {}
  }, [volumeEnabled]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || sortedData.length === 0) return;

    // Remove old indicators
    indicatorSeriesRef.current.forEach((series) => {
      try { chartRef.current?.removeSeries(series); } catch (e) {}
    });
    indicatorSeriesRef.current.clear();

    // Add enabled indicators
    indicators.filter((ind) => ind.enabled).forEach((indicator) => {
      const indicatorData = indicator.type === 'sma'
        ? calculateSMA(sortedData, indicator.period)
        : calculateEMA(sortedData, indicator.period);

      if (indicatorData.length > 0 && chartRef.current) {
        try {
          const indicatorSeries = chartRef.current.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
          });

          indicatorSeries.setData(indicatorData.map((d) => ({
            time: d.time as Time,
            value: d.value,
          })));

          indicatorSeriesRef.current.set(indicator.id, indicatorSeries);
        } catch (e) {}
      }
    });
  }, [indicators, sortedData]);

  // Toggle indicator
  const toggleIndicator = useCallback((id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  }, []);

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // Period presets
  const periods: ChartPeriod[] = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'ALL'];

  // Get latest price for display
  const latestData = sortedData.length > 0 ? sortedData[sortedData.length - 1] : null;

  // Count enabled indicators
  const enabledCount = indicators.filter(i => i.enabled).length;

  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{ 
        backgroundColor: currentColors.background,
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {/* Header Controls */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
        style={{ 
          background: theme === 'dark' 
            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' 
            : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
        }}
      >
        {/* Left: Symbol & Price Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold tracking-tight" style={{ color: currentColors.text }}>
                {symbol}
              </span>
              {companyName && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-md truncate max-w-[150px]"
                  style={{ 
                    color: currentColors.textMuted,
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }}
                  title={companyName}
                >
                  {companyName}
                </span>
              )}
            </div>
            {latestData && (
              <div className="flex items-center gap-4 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span className="font-bold text-lg tracking-tight" style={{ color: currentColors.text }}>
                  ${formatPrice(latestData.close)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Selector - Pill Style */}
          <div 
            className="flex items-center p-1 rounded-lg gap-0.5"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            }}
          >
            {([
              { t: 'candlestick' as ChartType, icon: <CandlestickChart className="h-3.5 w-3.5" />, label: 'Candles' },
              { t: 'line' as ChartType, icon: <LineChart className="h-3.5 w-3.5" />, label: 'Line' },
              { t: 'area' as ChartType, icon: <AreaChart className="h-3.5 w-3.5" />, label: 'Area' },
            ]).map(({ t, icon, label }) => (
              <button
                key={t}
                onClick={() => onTypeChange?.(t)}
                className="relative px-2 py-1.5 rounded-md transition-all duration-300 flex items-center gap-1"
                style={{
                  backgroundColor: type === t ? currentColors.up : 'transparent',
                  color: type === t ? '#fff' : currentColors.textMuted,
                  boxShadow: type === t ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}
                title={label}
              >
                {icon}
                <span className="text-xs font-medium hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Divider - Hidden on small screens */}
          <div className="h-5 w-px hidden sm:block" style={{ backgroundColor: currentColors.border }} />

          {/* Volume Toggle - Modern Chip */}
          <button
            onClick={() => setVolumeEnabled(!volumeEnabled)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: volumeEnabled 
                ? `${currentColors.up}15` 
                : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: volumeEnabled ? currentColors.up : currentColors.textMuted,
              border: volumeEnabled ? `1px solid ${currentColors.up}40` : '1px solid transparent',
            }}
            title={volumeEnabled ? 'Hide Volume' : 'Show Volume'}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium hidden sm:inline">Vol</span>
          </button>

          {/* Indicators - Modern Dropdown */}
          {showIndicators && (
            <div className="relative">
              <button
                onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-300"
                style={{
                  backgroundColor: enabledCount > 0 
                    ? `${currentColors.up}15` 
                    : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: enabledCount > 0 ? currentColors.up : currentColors.textMuted,
                  border: enabledCount > 0 ? `1px solid ${currentColors.up}40` : '1px solid transparent',
                }}
                title="Technical Indicators"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="text-xs font-medium hidden sm:inline">Indicators</span>
                {enabledCount > 0 && (
                  <span 
                    className="text-xs font-bold px-1 py-0.5 rounded"
                    style={{ backgroundColor: currentColors.up, color: '#fff' }}
                  >
                    {enabledCount}
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showIndicatorPanel ? 'rotate-180' : ''}`} />
              </button>
              
              {showIndicatorPanel && (
                <div 
                  className="absolute right-0 top-full mt-3 w-80 rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ 
                    backgroundColor: currentColors.tooltipBg,
                    boxShadow: theme === 'dark' 
                      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' 
                      : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Header */}
                  <div 
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ 
                      background: theme === 'dark' 
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)' 
                        : 'linear-gradient(180deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
                      borderBottom: `1px solid ${currentColors.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" style={{ color: currentColors.textMuted }} />
                      <span className="text-sm font-semibold" style={{ color: currentColors.text }}>
                        Indicators
                      </span>
                    </div>
                    <button
                      onClick={() => setShowIndicatorPanel(false)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                      style={{ 
                        color: currentColors.textMuted,
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Category Tabs */}
                  <div 
                    className="flex gap-1 p-2 mx-2 mt-2 rounded-lg"
                    style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                  >
                    {[
                      { id: 'ma' as const, label: 'Moving Avg', icon: <Waves className="h-3.5 w-3.5" /> },
                      { id: 'oscillators' as const, label: 'Oscillators', icon: <Gauge className="h-3.5 w-3.5" /> },
                      { id: 'bands' as const, label: 'Bands', icon: <Target className="h-3.5 w-3.5" /> },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setIndicatorTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                        style={{
                          backgroundColor: indicatorTab === tab.id ? currentColors.up : 'transparent',
                          color: indicatorTab === tab.id ? '#fff' : currentColors.textMuted,
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Indicator List */}
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {indicators.map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => toggleIndicator(ind.id)}
                        className="w-full px-3 py-2.5 flex items-center justify-between transition-all duration-200 rounded-lg mb-1"
                        style={{ 
                          backgroundColor: ind.enabled 
                            ? `${ind.color}15` 
                            : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-offset-2 transition-all duration-200"
                            style={{ 
                              backgroundColor: ind.color,
                              ringColor: ind.enabled ? ind.color : 'transparent',
                              ringOffsetColor: currentColors.background,
                            }}
                          />
                          <span className="text-sm font-medium" style={{ color: currentColors.text }}>
                            {ind.name}
                          </span>
                        </div>
                        {/* Modern Toggle */}
                        <div 
                          className="w-10 h-6 rounded-full relative transition-all duration-300 cursor-pointer"
                          style={{ 
                            backgroundColor: ind.enabled ? ind.color : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          }}
                        >
                          <div 
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300"
                            style={{ 
                              left: ind.enabled ? '22px' : '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Footer hint */}
                  <div 
                    className="px-4 py-2.5 text-xs text-center"
                    style={{ 
                      color: currentColors.textMuted,
                      borderTop: `1px solid ${currentColors.border}`,
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    {enabledCount === 0 ? 'Select indicators to overlay on chart' : `${enabledCount} indicator${enabledCount > 1 ? 's' : ''} active`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset View - Icon Button */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              color: currentColors.textMuted,
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            }}
            title="Reset View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Period Selector - Modern Pills */}
      <div 
        className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide"
      >
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => handlePeriodChange(period)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 whitespace-nowrap"
            style={{
              backgroundColor: selectedPeriod === period 
                ? currentColors.up 
                : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: selectedPeriod === period ? '#fff' : currentColors.textMuted,
              boxShadow: selectedPeriod === period ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} style={{ height: `${height}px` }} />
        
        {/* OHLCV Overlay - Top Left of Chart */}
        {crosshairData && (
          <div 
            className="absolute top-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-md text-xs z-10"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(4px)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: currentColors.textMuted }}>{crosshairData.time}</span>
            <span style={{ color: currentColors.textMuted }}>O <span className="font-medium" style={{ color: currentColors.text }}>{formatPrice(crosshairData.open)}</span></span>
            <span style={{ color: currentColors.textMuted }}>H <span className="font-medium" style={{ color: currentColors.up }}>{formatPrice(crosshairData.high)}</span></span>
            <span style={{ color: currentColors.textMuted }}>L <span className="font-medium" style={{ color: currentColors.down }}>{formatPrice(crosshairData.low)}</span></span>
            <span style={{ color: currentColors.textMuted }}>C <span className="font-medium" style={{ color: currentColors.text }}>{formatPrice(crosshairData.close)}</span></span>
            {crosshairData.volume > 0 && (
              <span style={{ color: currentColors.textMuted }}>V <span className="font-medium">{formatVolume(crosshairData.volume)}</span></span>
            )}
            <span 
              className="font-semibold px-2 py-0.5 rounded text-xs"
              style={{ 
                color: crosshairData.change >= 0 ? currentColors.up : currentColors.down,
                backgroundColor: crosshairData.change >= 0 ? `${currentColors.up}20` : `${currentColors.down}20`,
              }}
            >
              {crosshairData.change >= 0 ? '+' : ''}{crosshairData.changePercent.toFixed(2)}%
            </span>
          </div>
        )}
        
        {/* Loading Overlay - Modern */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: `${currentColors.background}e0` }}
          >
            <div className="text-center">
              <div className="relative">
                <div 
                  className="animate-spin rounded-full h-10 w-10 border-2 mx-auto" 
                  style={{ 
                    borderColor: `${currentColors.up}30`,
                    borderTopColor: currentColors.up,
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: currentColors.up }}
                />
              </div>
              <p className="text-sm mt-3 font-medium" style={{ color: currentColors.textMuted }}>
                Loading chart data...
              </p>
            </div>
          </div>
        )}

        {/* No Data Overlay - Modern */}
        {!isLoading && sortedData.length === 0 && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: currentColors.background }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
              >
                <CandlestickChart className="h-8 w-8" style={{ color: currentColors.textMuted, opacity: 0.5 }} />
              </div>
              <p className="font-semibold text-lg" style={{ color: currentColors.text }}>
                No Data Available
              </p>
              <p className="text-sm mt-1" style={{ color: currentColors.textMuted }}>
                Chart data will appear when loaded
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Indicator Legend - Floating Pills */}
      {indicators.some((i) => i.enabled) && (
        <div className="absolute top-36 left-5 flex flex-wrap gap-2 z-10">
          {indicators.filter((i) => i.enabled).map((ind) => (
            <div
              key={ind.id}
              className="group flex items-center gap-2 pl-2 pr-1 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                boxShadow: theme === 'dark' 
                  ? '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)' 
                  : '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: ind.color, boxShadow: `0 0 6px ${ind.color}` }} 
              />
              <span style={{ color: currentColors.text }}>{ind.name}</span>
              <button
                onClick={() => toggleIndicator(ind.id)}
                className="p-1 rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
                style={{ 
                  color: currentColors.textMuted,
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
