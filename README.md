# Stock Dashboard with Agentic AI Market Researcher

An interactive stock dashboard that integrates an **agentic AI "Market Researcher"** to provide on-demand, natural-language insights.  
Users can select a ticker, view price trends and quick stats, then request market analysis powered by sentiment, news, and filings data.

---

## ✨ Features

- **Single-Stock Dashboard**
  - Search and select a ticker
  - Line chart with price history (Recharts)
  - Quick metrics (percent change, 52-week range, volume)

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
- **Backend:** Node.js (Express.js), PostgreSQL  
- **AI Service:** Python (FastAPI), Google ADK, FinBERT  
- **Data Sources:** Alpha Vantage / Polygon.io (prices), NewsAPI / GDELT (news), SEC EDGAR API (filings)  

---

## 📜 License
MIT
