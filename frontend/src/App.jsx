import QuoteRotator from "./components/QuoteRotator.jsx";
import quotes from "./data/quotes.js";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stock Dashboard</h1>
            <QuoteRotator items={quotes} intervalMs={4000} />
          </div>
          <input
            className="w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search ticker (e.g., AAPL)"
          />
        </header>

        {/* Quick Metrics */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Metrics</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Percent Change (1D)</div>
              <div className="mt-1 text-xl font-semibold text-emerald-600">+1.42%</div>
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">52-Week Range</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">$121 – $187</div>
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="text-xs text-slate-500">Volume</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">32.4M</div>
            </div>
          </div>
        </section>

        {/* AI Researcher Input */}
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Ask the Market Researcher</h2>
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
