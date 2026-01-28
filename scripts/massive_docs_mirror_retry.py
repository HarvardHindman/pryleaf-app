"""
Retry script for failed Massive docs pages.
Tries alternative URL patterns for pages that returned 404.
"""

from __future__ import annotations

import sys
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path


BASE = "https://massive.com"
DOCS_BASE = f"{BASE}/docs/rest"

OUT_ROOT = Path("docs/massive")

# Pages that failed with alternative URL patterns to try
PAGES_TO_RETRY = [
    # Aggregate Bars - try different section names
    ("Custom Bars", [
        "stocks/aggregate-bars-ohlc/custom-bars",
        "stocks/aggregates/custom-bars",
        "stocks/aggregates/bars",
        "stocks/aggregates/aggregate-bars",
    ]),
    ("Daily Market Summary", [
        "stocks/aggregate-bars-ohlc/daily-market-summary",
        "stocks/aggregates/daily-market-summary",
        "stocks/aggregates/grouped-daily",
        "stocks/aggregates/grouped-daily-bars",
    ]),
    ("Daily Ticker Summary", [
        "stocks/aggregate-bars-ohlc/daily-ticker-summary",
        "stocks/aggregates/daily-ticker-summary",
        "stocks/aggregates/daily",
    ]),
    ("Previous Day Bar", [
        "stocks/aggregate-bars-ohlc/previous-day-bar",
        "stocks/aggregates/previous-day-bar",
        "stocks/aggregates/previous-close",
        "stocks/aggregates/prev-close",
    ]),
    # Technical Indicators
    ("SMA", [
        "stocks/technical-indicators/sma",
        "stocks/technicals/sma",
        "stocks/indicators/sma",
    ]),
    ("EMA", [
        "stocks/technical-indicators/ema",
        "stocks/technicals/ema",
        "stocks/indicators/ema",
    ]),
    ("MACD", [
        "stocks/technical-indicators/macd",
        "stocks/technicals/macd",
        "stocks/indicators/macd",
    ]),
    ("RSI", [
        "stocks/technical-indicators/rsi",
        "stocks/technicals/rsi",
        "stocks/indicators/rsi",
    ]),
    # Corporate Actions - deprecated versions
    ("Splits (Deprecated)", [
        "stocks/corporate-actions/splits-deprecated",
        "stocks/corporate-actions/stock-splits-v2",
    ]),
    ("Dividends (Deprecated)", [
        "stocks/corporate-actions/dividends-deprecated",
        "stocks/corporate-actions/dividends-v2",
    ]),
    # Fundamentals
    ("Financials (Deprecated)", [
        "stocks/fundamentals/financials-deprecated",
        "stocks/fundamentals/financials-v2",
        "stocks/financials/financials",
    ]),
    # Filings & Disclosures
    ("10-K Sections", [
        "stocks/filings-disclosures/10-k-sections",
        "stocks/filings/10-k-sections",
        "stocks/filings/sections",
    ]),
    ("Risk Factors", [
        "stocks/filings-disclosures/risk-factors",
        "stocks/filings/risk-factors",
    ]),
    ("Risk Categories", [
        "stocks/filings-disclosures/risk-categories",
        "stocks/filings/risk-categories",
    ]),
]


def fetch(url: str, *, timeout_s: float = 30.0) -> str:
    """Fetch URL content as text."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "pryleaf-app-docs-mirror/1.0",
            "Accept": "text/markdown,text/plain,text/html",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def try_url(url_path: str) -> str | None:
    """Try fetching a URL, return content if successful."""
    url = f"{DOCS_BASE}/{url_path}.md"
    try:
        content = fetch(url, timeout_s=10.0)
        if content.strip().startswith("<!DOCTYPE") or content.strip().startswith("<html"):
            return None
        return content
    except Exception:
        return None


def main(argv: list[str]) -> int:
    """Try alternative URLs for failed pages."""
    
    print(f"Trying alternative URLs for {len(PAGES_TO_RETRY)} failed pages...")
    print("")
    
    found: list[tuple[str, str, str]] = []
    still_failed: list[str] = []
    
    for title, url_patterns in PAGES_TO_RETRY:
        print(f"[{title}] Trying {len(url_patterns)} variations...")
        
        found_content = None
        found_url = None
        
        for url_path in url_patterns:
            content = try_url(url_path)
            if content:
                found_content = content
                found_url = f"{DOCS_BASE}/{url_path}.md"
                print(f"  [OK] Found at: {url_path}")
                break
            time.sleep(0.2)
        
        if found_content:
            found.append((title, found_url, found_content))
        else:
            still_failed.append(title)
            print(f"  [FAIL] No working URL found")
        
        print("")
    
    print("")
    print(f"[RESULTS]")
    print(f"  Found: {len(found)} pages")
    print(f"  Still failed: {len(still_failed)} pages")
    
    if found:
        print("")
        print("Working URLs found:")
        for title, url, _ in found:
            print(f"  - {title}: {url}")
    
    if still_failed:
        print("")
        print("Still no working URL:")
        for title in still_failed:
            print(f"  - {title}")
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
