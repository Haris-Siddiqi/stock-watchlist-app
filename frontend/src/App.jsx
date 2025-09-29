import { useEffect, useRef, useState } from "react";
import QuoteRotator from "./components/QuoteRotator.jsx";
import quotes from "./data/quotes.js";
import {
  addWatchlistItem,
  getQuote,
  getWatchlist,
  removeWatchlistItem,
  searchTickers,
} from "./api.js";

const DEBOUNCE_MS = 350;

export default function App() {
  const [searchState, setSearchState] = useState({
    query: "",
    results: [],
    loading: false,
    error: "",
  });

  const [watchlistState, setWatchlistState] = useState({
    tickers: [],
    limit: 10,
    loading: true,
    error: "",
    updating: false,
    actionError: "",
  });

  const [quoteState, setQuoteState] = useState({
    data: {},
  });

  const debounceTimer = useRef();

  const handleSearchInputChange = (event) => {
    const { value } = event.target;

    setSearchState((prev) => ({
      ...prev,
      query: value,
    }));
  };

  const handleAddToWatchlist = async (ticker) => {
    if (watchlistState.updating) return;

    if (watchlistState.tickers.length >= watchlistState.limit) {
      setWatchlistState((prev) => ({
        ...prev,
        actionError:
          "Watchlist limit reached. Remove an item before adding another.",
      }));
      return;
    }

    setWatchlistState((prev) => ({
      ...prev,
      updating: true,
      actionError: "",
    }));

    try {
      const { tickers, limit } = await addWatchlistItem(ticker);
      setWatchlistState((prev) => ({
        ...prev,
        tickers,
        limit,
        updating: false,
        actionError: "",
      }));

      setSearchState((prev) => ({
        ...prev,
        query: "",
        results: [],
      }));
    } catch (error) {
      setWatchlistState((prev) => ({
        ...prev,
        updating: false,
        actionError: error.message ?? "Failed to add ticker.",
      }));
    }
  };

  const handleRemoveFromWatchlist = async (ticker) => {
    if (watchlistState.updating) return;

    setWatchlistState((prev) => ({
      ...prev,
      updating: true,
      actionError: "",
    }));

    try {
      const { tickers, limit } = await removeWatchlistItem(ticker);
      setWatchlistState((prev) => ({
        ...prev,
        tickers,
        limit,
        updating: false,
        actionError: "",
      }));
    } catch (error) {
      setWatchlistState((prev) => ({
        ...prev,
        updating: false,
        actionError: error.message ?? "Failed to remove ticker.",
      }));
    }
  };

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const { tickers, limit } = await getWatchlist();
        setWatchlistState({
          tickers,
          limit,
          loading: false,
          error: "",
          updating: false,
          actionError: "",
        });
      } catch (error) {
        setWatchlistState({
          tickers: [],
          limit: 10,
          loading: false,
          error: error.message ?? "Failed to load watchlist.",
          updating: false,
          actionError: "",
        });
      }
    };

    loadWatchlist();
  }, []);

  useEffect(() => {
    const query = searchState.query.trim();

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query) {
      setSearchState((prev) => ({
        ...prev,
        results: [],
        loading: false,
        error: "",
      }));
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearchState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const { results } = await searchTickers(query);
        setSearchState((prev) => ({
          ...prev,
          results,
          loading: false,
          error: "",
        }));
      } catch (error) {
        setSearchState((prev) => ({
          ...prev,
          results: [],
          loading: false,
          error: error.message ?? "Search failed.",
        }));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchState.query]);

  useEffect(() => {
    let cancelled = false;

    const fetchQuotes = async () => {
      if (watchlistState.tickers.length === 0) {
        setQuoteState({ data: {} });
        return;
      }

      const results = await Promise.allSettled(
        watchlistState.tickers.map((ticker) =>
          getQuote(ticker).then(({ ticker: symbol, price, changePercent }) => ({
            ticker: symbol,
            price,
            changePercent,
          }))
        )
      );

      if (cancelled) return;

      const data = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          data[result.value.ticker] = {
            price: result.value.price,
            changePercent: result.value.changePercent,
          };
        }
      });

      setQuoteState({ data });
    };

    fetchQuotes().catch(() => {
      if (!cancelled) {
        setQuoteState({ data: {} });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [watchlistState.tickers]);

  const watchlistIsFull =
    watchlistState.tickers.length >= watchlistState.limit;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  const formatPercent = (value) =>
    `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

  const percentClass = (value) => {
    if (value > 0) return "text-emerald-600";
    if (value < 0) return "text-rose-600";
    return "text-slate-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Stock Dashboard
            </h1>
            <QuoteRotator items={quotes} intervalMs={4000} />
          </div>
          <div className="relative w-64">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={
                watchlistIsFull
                  ? "Watchlist full (remove to add more)"
                  : "Search ticker (e.g., AAPL)"
              }
              value={searchState.query}
              onChange={handleSearchInputChange}
              disabled={watchlistIsFull && !searchState.query}
            />
            {(searchState.loading ||
              searchState.error ||
              searchState.results.length > 0) && (
              <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {searchState.loading && (
                  <div className="px-4 py-2 text-sm text-slate-500">
                    Searching…
                  </div>
                )}
                {!searchState.loading && searchState.error && (
                  <div className="px-4 py-2 text-sm text-rose-600">
                    {searchState.error}
                  </div>
                )}
                {!searchState.loading &&
                  !searchState.error &&
                  searchState.results.length === 0 && (
                    <div className="px-4 py-2 text-sm text-slate-500">
                      No matches found.
                    </div>
                  )}
                {!searchState.loading &&
                  !searchState.error &&
                  searchState.results.length > 0 && (
                    <ul>
                      {searchState.results.map((item) => (
                        <li key={item.ticker} className="last:border-none">
                          <button
                            type="button"
                            onClick={() => handleAddToWatchlist(item.ticker)}
                            disabled={
                              watchlistState.updating || watchlistIsFull
                            }
                            className="flex w-full items-start gap-2 border-b border-slate-100 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div className="font-medium text-slate-900">
                              {item.ticker}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.name}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </div>
        </header>

        {/* Watchlist */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Watchlist</h2>
            <span className="text-sm text-slate-500">
              {watchlistState.tickers.length}/{watchlistState.limit}
            </span>
          </div>
          {watchlistState.loading && (
            <div className="text-sm text-slate-500">Loading watchlist…</div>
          )}
          {!watchlistState.loading && watchlistState.error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {watchlistState.error}
            </div>
          )}
          {!watchlistState.loading &&
            watchlistState.actionError &&
            !watchlistState.error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                {watchlistState.actionError}
              </div>
            )}
          {!watchlistState.loading &&
            !watchlistState.error &&
            watchlistState.tickers.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No tickers yet. Search above and add your first company.
              </div>
            )}
          {!watchlistState.loading &&
            !watchlistState.error &&
            watchlistState.tickers.length > 0 && (
              <ul className="space-y-3">
                {watchlistState.tickers.map((ticker) => {
                  const quote = quoteState.data[ticker];

                  return (
                    <li
                      key={ticker}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {ticker}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {quote ? (
                            <>
                              <span className="font-medium text-slate-900">
                                {formatPrice(quote.price)}
                              </span>{" "}
                              <span
                                className={percentClass(
                                  quote.changePercent
                                )}
                              >
                                {formatPercent(quote.changePercent)}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWatchlist(ticker)}
                        disabled={watchlistState.updating}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm text-indigo-700 hover:bg-indigo-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Remove ${ticker} from watchlist`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </section>

        {/* AI Researcher Input */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Ask the Market Researcher
          </h2>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Summarize latest risks for NVDA"
            />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Analyze
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
