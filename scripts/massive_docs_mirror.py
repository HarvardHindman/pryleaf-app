"""
Massive docs mirror generator.

Fetches Massive docs pages (via .md endpoints) and writes
a local Markdown mirror under: docs/massive/
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
INDEX_PATH = OUT_ROOT / "INDEX.md"

# Exact list of pages to fetch (provided by user)
KNOWN_PAGES = [
    # Core
    ("", "quickstart", "REST Quickstart"),
    ("stocks", "overview", "Stocks Overview"),
    
    # Tickers
    ("stocks/tickers", "all-tickers", "All Tickers"),
    ("stocks/tickers", "ticker-overview", "Ticker Overview"),
    ("stocks/tickers", "ticker-types", "Ticker Types"),
    ("stocks/tickers", "related-tickers", "Related Tickers"),
    
    # Aggregate Bars (OHLC)
    ("stocks/aggregates", "custom-bars", "Custom Bars"),
    ("stocks/aggregates", "daily-market-summary", "Daily Market Summary"),
    ("stocks/aggregates", "daily-ticker-summary", "Daily Ticker Summary"),
    ("stocks/aggregates", "previous-day-bar", "Previous Day Bar"),
    
    # Snapshots
    ("stocks/snapshots", "single-ticker-snapshot", "Single Ticker Snapshot"),
    ("stocks/snapshots", "full-market-snapshot", "Full Market Snapshot"),
    ("stocks/snapshots", "unified-snapshot", "Unified Snapshot"),
    ("stocks/snapshots", "top-market-movers", "Top Market Movers"),
    
    # Trades & Quotes
    ("stocks/trades-quotes", "trades", "Trades"),
    ("stocks/trades-quotes", "last-trade", "Last Trade"),
    ("stocks/trades-quotes", "quotes", "Quotes"),
    ("stocks/trades-quotes", "last-quote", "Last Quote"),
    
    # Technical Indicators
    ("stocks/technical-indicators", "simple-moving-average", "SMA (Simple Moving Average)"),
    ("stocks/technical-indicators", "exponential-moving-average", "EMA (Exponential Moving Average)"),
    ("stocks/technical-indicators", "moving-average-convergence-divergence", "MACD"),
    ("stocks/technical-indicators", "relative-strength-index", "RSI (Relative Strength Index)"),
    
    # Market Operations
    ("stocks/market-operations", "exchanges", "Exchanges"),
    ("stocks/market-operations", "market-holidays", "Market Holidays"),
    ("stocks/market-operations", "market-status", "Market Status"),
    ("stocks/market-operations", "condition-codes", "Condition Codes"),
    
    # Corporate Actions
    ("stocks/corporate-actions", "ipos", "IPOs"),
    ("stocks/corporate-actions", "splits", "Splits"),
    ("stocks/corporate-actions", "dividends", "Dividends"),
    ("stocks/corporate-actions", "ticker-events", "Ticker Events"),
    
    # Fundamentals
    ("stocks/fundamentals", "balance-sheets", "Balance Sheets"),
    ("stocks/fundamentals", "cash-flow-statements", "Cash Flow Statements"),
    ("stocks/fundamentals", "income-statements", "Income Statements"),
    ("stocks/fundamentals", "ratios", "Ratios"),
    ("stocks/fundamentals", "short-interest", "Short Interest"),
    ("stocks/fundamentals", "short-volume", "Short Volume"),
    ("stocks/fundamentals", "float", "Float"),
    
    # Filings & Disclosures
    ("stocks/filings", "10-k-sections", "10-K Sections"),
    ("stocks/filings", "risk-factors", "Risk Factors"),
    ("stocks/filings", "risk-categories", "Risk Categories"),
    
    # News
    ("stocks", "news", "News"),
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


@dataclass(frozen=True)
class Page:
    url: str
    out_path: Path
    title: str
    content: str


def build_url(section_slug: str, page_slug: str) -> str:
    """Build the .md URL for a page."""
    if not section_slug:
        return f"{DOCS_BASE}/{page_slug}.md"
    return f"{DOCS_BASE}/{section_slug}/{page_slug}.md"


def out_path_for(section_slug: str, page_slug: str) -> Path:
    """Determine output path for a page."""
    if not section_slug:
        return OUT_ROOT / "rest" / f"{page_slug}.md"
    
    section_safe = section_slug.replace("/", "-")
    return OUT_ROOT / "rest" / section_safe / f"{page_slug}.md"


def try_fetch_page(section_slug: str, page_slug: str, title: str) -> Page | None:
    """Try to fetch a page's markdown content."""
    url = build_url(section_slug, page_slug)
    try:
        content = fetch(url)
        if content.strip().startswith("<!DOCTYPE") or content.strip().startswith("<html"):
            return None
        return Page(
            url=url,
            out_path=out_path_for(section_slug, page_slug),
            title=title,
            content=content,
        )
    except Exception as e:
        print(f"  [FAIL] {title}: {e}")
        return None


def write_page(page: Page) -> None:
    """Write a page to disk with metadata header."""
    page.out_path.parent.mkdir(parents=True, exist_ok=True)
    
    header = [
        f"# {page.title}",
        "",
        f"**Source**: [{page.url}]({page.url})",
        "",
        "---",
        "",
    ]
    
    content = "\n".join(header) + page.content
    page.out_path.write_text(content, encoding="utf-8")


def write_index(pages: list[Page]) -> None:
    """Generate the index file."""
    grouped: dict[str, list[Page]] = {}
    for p in pages:
        rel_parent = p.out_path.parent.relative_to(OUT_ROOT)
        section = str(rel_parent).replace("\\", "/")
        grouped.setdefault(section, []).append(p)
    
    for section in grouped:
        grouped[section].sort(key=lambda x: x.out_path.name)

    lines: list[str] = []
    lines.append("# Massive API Documentation (Local Mirror)")
    lines.append("")
    lines.append(f"**Source**: [{BASE}/docs]({BASE}/docs)")
    lines.append(f"**Generated**: {time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append("")
    lines.append("This is a local mirror of the Massive (formerly Polygon) REST API documentation.")
    lines.append("All content is sourced from the official Massive documentation site.")
    lines.append("")
    lines.append("## Quick Links")
    lines.append("")
    lines.append("- [REST Quickstart](rest/quickstart.md)")
    lines.append("- [Stocks Overview](rest/stocks/overview.md)")
    lines.append("")
    lines.append("## Sections")
    lines.append("")
    
    for section in sorted(grouped.keys()):
        # Format section title nicely
        section_title = section.replace("rest/", "").replace("stocks-", "Stocks / ").replace("-", " ").title()
        lines.append(f"### {section_title}")
        lines.append("")
        for p in grouped[section]:
            rel = p.out_path.relative_to(OUT_ROOT).as_posix()
            lines.append(f"- [{p.title}]({rel})")
        lines.append("")
    
    INDEX_PATH.write_text("\n".join(lines), encoding="utf-8")


def main(argv: list[str]) -> int:
    """Main entry point."""
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    print(f"Fetching {len(KNOWN_PAGES)} Massive docs pages...")
    print("")
    
    all_pages: list[Page] = []
    failed: list[tuple[str, str, str]] = []
    
    for i, (section_slug, page_slug, title) in enumerate(KNOWN_PAGES, start=1):
        print(f"[{i}/{len(KNOWN_PAGES)}] {title}...")
        page = try_fetch_page(section_slug, page_slug, title)
        if page:
            all_pages.append(page)
        else:
            failed.append((section_slug, page_slug, title))
        
        # Small delay to be polite
        if i < len(KNOWN_PAGES):
            time.sleep(0.3)

    # Write all pages
    print("")
    print("Writing pages...")
    for page in all_pages:
        write_page(page)

    write_index(all_pages)

    print("")
    print(f"[DONE] Wrote {len(all_pages)} pages.")
    print(f"[INDEX] {INDEX_PATH.as_posix()}")
    
    if failed:
        print(f"[WARNING] {len(failed)} pages failed to fetch:")
        for section_slug, page_slug, title in failed:
            url = build_url(section_slug, page_slug)
            print(f"  - {title} ({url})")
        return 1
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
