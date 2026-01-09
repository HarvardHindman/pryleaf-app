/**
 * Time Series Cache Service
 * Centralizes cache access for historical price data.
 * - Shared Supabase cache for all users
 * - Cache-first, then live fetch with retry; no synthetic placeholders
 */

import { createClient } from '@supabase/supabase-js';
import { CACHE_TTL } from '../constants';
import { throttleAlphaVantage } from './alphaVantageThrottle';

type Interval = 'intraday' | 'daily' | 'weekly' | 'monthly';
type OutputSize = 'compact' | 'full';

export class TimeSeriesCacheService {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Lightweight JSON fetch with retry for transient upstream failures.
   */
  private static async fetchJsonWithRetry(
    url: string,
    validate: (data: any) => void,
    // Keep attempts low to avoid tripping Alpha Vantage 5 req/min limits when multiple endpoints fire together
    attempts: number = 1,
    delayMs: number = 600
  ): Promise<any | null> {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        if (json && json.error) {
          throw new Error(json.error);
        }
        validate(json);
        return json;
      } catch (err) {
        if (i === attempts - 1) {
          console.error(`fetchJsonWithRetry failed for ${url}:`, err);
          return null;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return null;
  }

  static async getTimeSeries(symbol: string, interval: Interval, outputsize: OutputSize) {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `timeseries_${interval}_${outputsize}`;

    // 1) Try cache
    const cached = await this.getCached(normalizedSymbol, cacheKey);
    if (cached) {
      return {
        data: cached,
        fromCache: true,
        fallback: false,
        source: 'cache' as const,
        timestamp: new Date().toISOString(),
      };
    }

    // 2) Try live fetch via server route (Alpha Vantage)
    const live = await this.fetchLive(normalizedSymbol, interval, outputsize);
    if (live) {
      await this.setCached(normalizedSymbol, cacheKey, live.data, this.ttlMinutes(interval));
      return {
        data: live.data,
        fromCache: false,
        fallback: false,
        source: 'alpha_vantage' as const,
        timestamp: live.timestamp,
      };
    }

    // 3) Nothing available; return empty result
    return {
      data: [],
      fromCache: false,
      fallback: true,
      source: 'none' as const,
      timestamp: new Date().toISOString(),
    };
  }

  private static ttlMinutes(interval: Interval) {
    // For research views, prefer 24h cache to minimize external calls
    return 24 * 60;
  }

  private static async fetchLive(symbol: string, interval: Interval, outputsize: OutputSize) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key missing; skipping live time-series fetch');
      return null;
    }

    // Throttle to avoid Alpha Vantage rate limits
    await throttleAlphaVantage();

    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/alpha-vantage-real/time-series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}`;

    const body = await this.fetchJsonWithRetry(
      apiUrl,
      (data) => {
        if (!data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error('No time series data returned');
        }
      }
    );

    if (!body) {
      return null;
    }

    return {
      data: body.data,
      timestamp: body._timestamp || new Date().toISOString(),
    };
  }

  private static async getCached(symbol: string, dataType: string) {
    try {
      const { data, error } = await this.supabase.rpc('get_cached_stock_data', {
        p_symbol: symbol,
        p_data_type: dataType,
      });
      if (error) {
        console.error('TimeSeries cache get error:', error);
        return null;
      }
      return data && data !== 'null' ? data : null;
    } catch (error) {
      console.error('TimeSeries cache get error:', error);
      return null;
    }
  }

  private static async setCached(symbol: string, dataType: string, data: any, ttlMinutes: number) {
    try {
      const { error } = await this.supabase.rpc('set_cached_stock_data', {
        p_symbol: symbol,
        p_data_type: dataType,
        p_data: data,
        p_cache_duration_minutes: ttlMinutes,
      });
      if (error) {
        console.error('TimeSeries cache set error:', error);
      }
    } catch (error) {
      console.error('TimeSeries cache set error:', error);
    }
  }
}

export type { Interval, OutputSize };

