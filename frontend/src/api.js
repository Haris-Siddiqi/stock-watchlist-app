const handleResponse = async (response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export const searchTickers = async (query) => {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
    }
  );

  return handleResponse(response);
};

export const getWatchlist = async () => {
  const response = await fetch("/api/watchlist", { method: "GET" });
  return handleResponse(response);
};

export const addWatchlistItem = async (ticker) => {
  const response = await fetch("/api/watchlist/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });

  return handleResponse(response);
};

export const removeWatchlistItem = async (ticker) => {
  const response = await fetch(`/api/watchlist/items/${ticker}`, {
    method: "DELETE",
  });

  return handleResponse(response);
};

export const getQuote = async (ticker) => {
  const response = await fetch(`/api/quote/${encodeURIComponent(ticker)}`, {
    method: "GET",
  });

  return handleResponse(response);
};
