import { useEffect, useState } from "react";

export default function App() {
  const [msg, setMsg] = useState("…");

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((d) => setMsg(d.msg))
      .catch(() => setMsg("Could not reach backend"));
  }, []);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Stock Watchlist MVP
        </h1>
        <p className="mt-2 text-gray-500">
          Backend says: <span className="font-medium">{msg}</span>
        </p>
      </div>
    </div>
  );
}
