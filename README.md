# Stock Dashboard with Agentic AI Market Researcher

An interactive stock dashboard that integrates an **agentic AI "Market Researcher"** to provide on-demand, natural-language insights.  
Users can select a ticker, view price trends and quick stats, then request market analysis powered by sentiment, news, and filings data.

---

## ✨ Features

- **Live Symbol Search** – Debounced search field backed by Finnhub’s `/search` endpoint, with validation and rate-limit handling.
- **Watchlist Management** – Add up to 10 tickers, prevent duplicates, and remove items inline. Server-side rules enforce limits and return friendly errors.
- **Persistent Storage** – PostgreSQL table `watchlist_items` keeps your selections. Backend exposes `GET/POST/DELETE` routes (`/api/watchlist`, `/api/watchlist/items`).
- **Responsive UI** – React + Tailwind styles for watchlist chips, loading states, and inline error messages.

- **Agentic AI Market Research**
  - Ask natural-language questions about a stock
  - AI orchestrates tools to:
    - Fetch latest news and filings  
    - Run sentiment analysis (FinBERT)  
    - Summarize market trends and risks  
  - Returns synthesized commentary with citations

---

## 🛠️ Tech Stack

- **Frontend:** JavaScript, React, Tailwind CSS, Recharts
- **Backend:** Node.js (Express 5, Axios), PostgreSQL (`pg`)  
- **AI Service:** Python (FastAPI), Google ADK, FinBERT  
- **Integration:** Finnhub Search API (requires API key)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+; tested with 16.10 on WSL)
- Finnhub API key (search API, free tier is fine)

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` (gitignored):

FINNHUB_API_KEY=your-finnhub-key
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/stock_watchlist

4. Create the database/table:

createdb stock_watchlist
psql stock_watchlist
-- inside psql
CREATE TABLE IF NOT EXISTS watchlist_items (
id SERIAL PRIMARY KEY,
ticker TEXT NOT NULL UNIQUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CONSTRAINT ticker_uppercase CHECK (ticker = UPPER(ticker))
);
\q

5. Start the server: `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. Start Vite dev server: `npm run dev`
- Proxies `/api/*` to the backend (`vite.config.js` handles it)


## 📜 License
MIT
