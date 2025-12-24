/**
 * Price Cache Service
 * In-memory caching for batch price quotes
 * Used by the /api/prices route
 */

import { CACHE_TTL } from '../constants';

interface PriceCacheEntry {
  data: any;
  timestamp: number;
}

class PriceCacheService {
  private cache: Record<string, PriceCacheEntry> = {};
  private ttl: number = CACHE_TTL.PRICE_BATCH;

  /**
   * Get cached price data for a symbol
   */
  get(symbol: string): any | null {
    const entry = this.cache[symbol.toUpperCase()];
    
    if (!entry) {
      return null;
    }

    // Check if cache is still fresh
    if (Date.now() - entry.timestamp < this.ttl) {
      return entry.data;
    }

    // Cache expired, remove it
    delete this.cache[symbol.toUpperCase()];
    return null;
  }

  /**
   * Set cached price data for a symbol
   */
  set(symbol: string, data: any): void {
    this.cache[symbol.toUpperCase()] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Check if a symbol is in cache and fresh
   */
  has(symbol: string): boolean {
    return this.get(symbol) !== null;
  }

  /**
   * Clear cache for a specific symbol or all symbols
   */
  clear(symbol?: string): void {
    if (symbol) {
      delete this.cache[symbol.toUpperCase()];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Object.entries(this.cache);
    
    return {
      totalEntries: entries.length,
      freshEntries: entries.filter(([_, entry]) => now - entry.timestamp < this.ttl).length,
      staleEntries: entries.filter(([_, entry]) => now - entry.timestamp >= this.ttl).length,
      ttl: this.ttl,
      cacheSize: JSON.stringify(this.cache).length
    };
  }

  /**
   * Clean up stale entries
   */
  cleanStale(): number {
    const now = Date.now();
    const staleKeys = Object.entries(this.cache)
      .filter(([_, entry]) => now - entry.timestamp >= this.ttl)
      .map(([key]) => key);
    
    staleKeys.forEach(key => delete this.cache[key]);
    
    return staleKeys.length;
  }
}

// Export singleton instance
export const priceCache = new PriceCacheService();

