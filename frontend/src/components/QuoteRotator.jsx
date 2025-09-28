import { useEffect, useState } from "react";

export default function QuoteRotator({ items = [], intervalMs = 4000 }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;
    const tick = setInterval(() => {
      // fade out
      setVisible(false);
      // swap text mid-fade, then fade back in
      const timeout = setTimeout(() => {
        setI((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 250); // match ~250ms fade
      return () => clearTimeout(timeout);
    }, intervalMs);

    return () => clearInterval(tick);
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  return (
    <p
      className={`mt-2 text-sm text-slate-500 transition-opacity duration-300 ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      {items[i]}
    </p>
  );
}
