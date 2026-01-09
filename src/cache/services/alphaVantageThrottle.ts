/**
 * Global throttle for Alpha Vantage API calls
 * Shared across all cache services to avoid rate limits (5 req/min on free tier)
 */

let lastCallTime = 0;
const MIN_INTERVAL_MS = 1500; // ~40 calls/min max, well under the limit

export async function throttleAlphaVantage(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    const wait = MIN_INTERVAL_MS - elapsed;
    console.log(`[AV Throttle] Waiting ${wait}ms before next Alpha Vantage call`);
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCallTime = Date.now();
}

