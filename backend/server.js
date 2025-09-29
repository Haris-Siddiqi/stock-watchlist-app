require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Pool } = require("pg");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
if (!FINNHUB_API_KEY) {
  console.error("FINNHUB_API_KEY is not set in the environment");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in the environment");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const FINNHUB_SEARCH_URL = "https://finnhub.io/api/v1/search";
const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";
const SEARCH_QUERY_REGEX = /^[A-Za-z0-9.:-]+$/;
const TICKER_REGEX = /^[A-Z0-9.:-]+$/;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const WATCHLIST_MAX_ITEMS = 10;

const searchCache = new Map(); // Map<string, { timestamp: number, data: array }>

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const buildCacheKey = (query) => query.toUpperCase();

const getCachedResults = (key) => {
  const cached = searchCache.get(key);
  if (!cached) return null;

  const ageMs = Date.now() - cached.timestamp;
  if (ageMs >= CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  return cached.data;
};

const storeInCache = (key, data) => {
  searchCache.set(key, { timestamp: Date.now(), data });
};

const formatSearchResults = (rawResults) => {
  if (!Array.isArray(rawResults)) return [];

  return rawResults
    .filter((entry) => entry?.symbol && entry?.description)
    .map((entry) => ({
      ticker: entry.symbol.toUpperCase(),
      name: entry.description,
    }));
};

const normalizeTicker = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const isValidTicker = (ticker) => TICKER_REGEX.test(ticker);

const formatQuote = (payload) => {
  const price = typeof payload?.c === "number" ? payload.c : null;
  const changePercent = typeof payload?.dp === "number" ? payload.dp : null;

  if (price === null || changePercent === null) {
    return null;
  }

  return { price, changePercent };
};

const getWatchlistTickers = async () => {
  const { rows } = await pool.query(
    "SELECT ticker FROM watchlist_items ORDER BY created_at ASC"
  );
  return rows.map((row) => row.ticker);
};

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.get("/api/hello", (req, res) => {
  res.json({ msg: "Hello from Express" });
});

app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  if (!SEARCH_QUERY_REGEX.test(q)) {
    return res.status(400).json({
      error: "Query must contain only letters, numbers, dots, colons, or hyphens.",
    });
  }

  const cacheKey = buildCacheKey(q);
  const cachedResults = getCachedResults(cacheKey);
  if (cachedResults) {
    return res.json({ results: cachedResults, cached: true });
  }

  try {
    const response = await axios.get(FINNHUB_SEARCH_URL, {
      params: { q, token: FINNHUB_API_KEY },
    });

    const results = formatSearchResults(response.data?.result);
    storeInCache(cacheKey, results);

    return res.json({ results, cached: false });
  } catch (error) {
    const status = error.response?.status;

    if (status === 429) {
      return res
        .status(429)
        .json({ error: "Search rate limit reached. Please try again shortly." });
    }

    if (status && status >= 400 && status < 500) {
      return res.status(502).json({ error: "Upstream service rejected the request." });
    }

    console.error("Finnhub search failed:", error.message);
    return res
      .status(502)
      .json({ error: "Unable to fetch search results from provider." });
  }
});

app.get("/api/quote/:ticker", async (req, res) => {
  const ticker = normalizeTicker(req.params.ticker);

  if (!ticker) {
    return res.status(400).json({ error: "Ticker is required." });
  }

  if (!isValidTicker(ticker)) {
    return res.status(400).json({
      error:
        "Ticker must contain only uppercase letters, numbers, dots, colons, or hyphens.",
    });
  }

  try {
    const response = await axios.get(FINNHUB_QUOTE_URL, {
      params: { symbol: ticker, token: FINNHUB_API_KEY },
    });

    const quote = formatQuote(response.data);
    if (!quote) {
      return res
        .status(404)
        .json({ error: "No quote data available for this ticker." });
    }

    return res.json({ ticker, ...quote });
  } catch (error) {
    const status = error.response?.status;

    if (status === 429) {
      return res
        .status(429)
        .json({ error: "Quote rate limit reached. Please try again shortly." });
    }

    if (status && status >= 400 && status < 500) {
      return res
        .status(502)
        .json({ error: "Upstream service rejected the quote request." });
    }

    console.error("Finnhub quote failed:", error.message);
    return res
      .status(502)
      .json({ error: "Unable to fetch quote from provider." });
  }
});

app.get("/api/watchlist", async (req, res) => {
  try {
    const tickers = await getWatchlistTickers();
    return res.json({ tickers, limit: WATCHLIST_MAX_ITEMS });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error.message);
    return res.status(500).json({ error: "Failed to fetch watchlist." });
  }
});

app.post("/api/watchlist/items", async (req, res) => {
  const { ticker } = req.body ?? {};
  const normalizedTicker = normalizeTicker(ticker);

  if (!normalizedTicker) {
    return res.status(400).json({ error: "Ticker is required." });
  }

  if (!isValidTicker(normalizedTicker)) {
    return res.status(400).json({
      error: "Ticker must contain only uppercase letters, numbers, dots, colons, or hyphens.",
    });
  }

  try {
    const currentTickers = await getWatchlistTickers();

    if (currentTickers.includes(normalizedTicker)) {
      return res.status(409).json({ error: "Ticker is already in the watchlist." });
    }

    if (currentTickers.length >= WATCHLIST_MAX_ITEMS) {
      return res
        .status(409)
        .json({ error: "Watchlist limit reached. Remove an item before adding another." });
    }

    await pool.query("INSERT INTO watchlist_items (ticker) VALUES ($1)", [
      normalizedTicker,
    ]);

    const updatedTickers = await getWatchlistTickers();
    return res.status(201).json({ tickers: updatedTickers, limit: WATCHLIST_MAX_ITEMS });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ticker is already in the watchlist." });
    }

    console.error("Failed to add ticker:", error.message);
    return res.status(500).json({ error: "Failed to add ticker to watchlist." });
  }
});

app.delete("/api/watchlist/items/:ticker", async (req, res) => {
  const normalizedTicker = normalizeTicker(req.params.ticker);

  if (!normalizedTicker) {
    return res.status(400).json({ error: "Ticker is required." });
  }

  if (!isValidTicker(normalizedTicker)) {
    return res.status(400).json({
      error: "Ticker must contain only uppercase letters, numbers, dots, colons, or hyphens.",
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM watchlist_items WHERE ticker = $1",
      [normalizedTicker]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ticker not found in watchlist." });
    }

    const updatedTickers = await getWatchlistTickers();
    return res.json({ tickers: updatedTickers, limit: WATCHLIST_MAX_ITEMS });
  } catch (error) {
    console.error("Failed to remove ticker:", error.message);
    return res.status(500).json({ error: "Failed to remove ticker from watchlist." });
  }
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
