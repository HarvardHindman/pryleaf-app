/**
 * Financials Cache Service
 * Fetches Alpha Vantage financial statements and caches them in Supabase
 * - Shared cache for all users (avoids duplicate API calls)
 * - 24h TTL for financial statements
 * - Normalizes missing values to "0" to keep UI stable
 */

import { createClient } from '@supabase/supabase-js';
import { CACHE_TTL, DATA_TYPES } from '../constants';

type FinancialStatementType = 'income' | 'balance' | 'cashflow' | 'earnings';

type FinancialsResponse = {
  symbol: string;
  annualReports?: any[];
  quarterlyReports?: any[];
  annualEarnings?: any[];
  quarterlyEarnings?: any[];
} | null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DATA_TYPE_MAP: Record<FinancialStatementType, string> = {
  income: DATA_TYPES.FINANCIALS_INCOME,
  balance: DATA_TYPES.FINANCIALS_BALANCE,
  cashflow: DATA_TYPES.FINANCIALS_CASHFLOW,
  earnings: DATA_TYPES.FINANCIALS_EARNINGS,
};

const API_FUNCTION_MAP: Record<FinancialStatementType, string> = {
  income: 'INCOME_STATEMENT',
  balance: 'BALANCE_SHEET',
  cashflow: 'CASH_FLOW',
  earnings: 'EARNINGS',
};

export class FinancialsCacheService {
  /**
   * Get financial statements with Supabase cache (24h TTL)
   */
  static async getFinancials(
    symbol: string,
    type: FinancialStatementType
  ): Promise<{
    data: FinancialsResponse;
    fromCache: boolean;
    fallback: boolean;
    source: 'alpha_vantage' | 'cache' | 'fallback';
    timestamp: string;
  }> {
    const normalizedSymbol = symbol.toUpperCase();
    const dataType = DATA_TYPE_MAP[type];
    const now = new Date().toISOString();

    // 1) Try fresh cache
    const cached = await this.getCachedData<FinancialsResponse>(normalizedSymbol, dataType);
    const earningsCacheMissing =
      type === 'earnings' &&
      cached &&
      !(cached as any).annualEarnings &&
      !(cached as any).quarterlyEarnings;

    if (cached && !earningsCacheMissing) {
      return {
        data: this.normalizeFinancials(cached),
        fromCache: true,
        fallback: false,
        source: 'cache',
        timestamp: now,
      };
    }

    if (earningsCacheMissing) {
      console.warn(`[FinancialsCache] Earnings cache for ${normalizedSymbol} missing data; refetching`);
    }

    // 2) Fetch from Alpha Vantage and cache
    const apiData = await this.fetchFromAlphaVantage(normalizedSymbol, type);
    if (apiData) {
      const normalized = this.normalizeFinancials(apiData);
      await this.setCachedData(normalizedSymbol, dataType, normalized, CACHE_TTL.FINANCIALS / (60 * 1000)); // minutes
      return {
        data: normalized,
        fromCache: false,
        fallback: false,
        source: 'alpha_vantage',
        timestamp: now,
      };
    }

    // 3) Fallback: return zeroed structure if nothing else
    const fallbackBase =
      type === 'earnings'
        ? { symbol: normalizedSymbol, annualEarnings: [], quarterlyEarnings: [] }
        : { symbol: normalizedSymbol, annualReports: [], quarterlyReports: [] };
    const fallback = this.normalizeFinancials(fallbackBase);

    return {
      data: fallback,
      fromCache: false,
      fallback: true,
      source: 'fallback',
      timestamp: now,
    };
  }

  /**
   * Supabase cache helpers
   */
  private static async getCachedData<T>(symbol: string, dataType: string): Promise<T | null> {
    try {
      const { data, error } = await supabase.rpc('get_cached_stock_data', {
        p_symbol: symbol,
        p_data_type: dataType,
      });

      if (error) {
        console.error('Financials cache get error:', error);
        return null;
      }

      return data && data !== 'null' ? (data as T) : null;
    } catch (error) {
      console.error('Financials cache get error:', error);
      return null;
    }
  }

  private static async setCachedData<T>(
    symbol: string,
    dataType: string,
    data: T,
    cacheDurationMinutes: number
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_cached_stock_data', {
        p_symbol: symbol,
        p_data_type: dataType,
        p_data: data,
        p_cache_duration_minutes: cacheDurationMinutes,
      });

      if (error) {
        console.error('Financials cache set error:', error);
      }
    } catch (error) {
      console.error('Financials cache set error:', error);
    }
  }

  /**
   * Call Alpha Vantage directly for financial statements
   */
  private static async fetchFromAlphaVantage(symbol: string, type: FinancialStatementType): Promise<FinancialsResponse> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key missing; cannot fetch financials');
      return null;
    }

    const func = API_FUNCTION_MAP[type];
    const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Alpha Vantage ${func} HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json.Note || json['Error Message'] || json.Information) {
        throw new Error(json.Note || json['Error Message'] || json.Information || 'Unknown Alpha Vantage error');
      }

      // Ensure shape matches our expectations
      if (type === 'earnings') {
        return {
          symbol,
          annualEarnings: json.annualEarnings || [],
          quarterlyEarnings: json.quarterlyEarnings || [],
        };
      }

      return {
        symbol,
        annualReports: json.annualReports || [],
        quarterlyReports: json.quarterlyReports || [],
      };
    } catch (error) {
      console.error(`Alpha Vantage financials fetch failed for ${symbol} (${type}):`, error);
      return null;
    }
  }

  /**
   * Normalize missing values to "0" to avoid undefined in UI
   */
  private static normalizeFinancials(data: FinancialsResponse): FinancialsResponse {
    if (!data) return null;

    const normalizeReport = (report: Record<string, any>) => {
      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(report)) {
        if (value === null || value === undefined || value === '') {
          normalized[key] = 'N/A';
        } else {
          normalized[key] = value;
        }
      }
      return normalized;
    };

    return {
      ...data,
      annualReports: (data.annualReports || []).map(normalizeReport),
      quarterlyReports: (data.quarterlyReports || []).map(normalizeReport),
      annualEarnings: (data as any).annualEarnings
        ? (data as any).annualEarnings.map(normalizeReport)
        : (data as any).annualEarnings || [],
      quarterlyEarnings: (data as any).quarterlyEarnings
        ? (data as any).quarterlyEarnings.map(normalizeReport)
        : (data as any).quarterlyEarnings || [],
    };
  }
}

export type { FinancialStatementType };

