## Massive API Documentation (Local Mirror)

This folder contains a **locally generated mirror** of the Massive REST API documentation pages so future agents can reference the docs without re-browsing.

- **Source**: [https://massive.com/docs](https://massive.com/docs)
- **Generated index**: [INDEX.md](INDEX.md)
- **Generator**: `scripts/massive_docs_mirror.py`
- **Last generated**: 2026-01-28
- **Pages fetched**: 41 Massive REST API endpoints ✅

### Coverage

This mirror includes **complete documentation** for:
- **Tickers** (4 pages) - All tickers, ticker overview, ticker types, related tickers
- **Aggregate Bars / OHLC** (4 pages) - Custom bars, daily market summary, daily ticker summary, previous day bar
- **Snapshots** (4 pages) - Full market snapshot, single ticker snapshot, unified snapshot, top market movers
- **Trades & Quotes** (4 pages) - Trades, last trade, quotes, last quote
- **Technical Indicators** (4 pages) - SMA, EMA, MACD, RSI
- **Market Operations** (4 pages) - Exchanges, market holidays, market status, condition codes
- **Corporate Actions** (4 pages) - IPOs, splits, dividends, ticker events
- **Fundamentals** (7 pages) - Balance sheets, cash flow statements, income statements, ratios, short interest, short volume, float
- **Filings & Disclosures** (3 pages) - 10-K sections, risk factors, risk categories
- **News** (1 page) - Market news with sentiment analysis

### Usage

Browse the [INDEX.md](INDEX.md) to see all available pages, or directly navigate to specific sections:
- [REST Quickstart](rest/quickstart.md)
- [Stocks Overview](rest/stocks/overview.md)
- [All Tickers](rest/stocks-tickers/all-tickers.md)
- [Custom Bars (OHLC)](rest/stocks-aggregates/custom-bars.md)
- [Full Market Snapshot](rest/stocks-snapshots/full-market-snapshot.md)
- [Technical Indicators - SMA](rest/stocks-technical-indicators/simple-moving-average.md)
- [News](rest/stocks/news.md)

### Regenerating

From repo root:

```bash
python scripts/massive_docs_mirror.py
```

This will fetch and rewrite files under `docs/massive/` (except this `README.md`).

### Notes

- All pages fetched successfully from Massive's `.md` endpoints
- Each page includes endpoint details, query parameters, response attributes, and sample responses
- The `.md` endpoints provide cleaner markdown than scraping HTML
- All pages include a source link back to the original documentation
