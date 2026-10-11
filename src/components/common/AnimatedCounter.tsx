import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  format?: (value: number) => string;
}

/** Counts from the previously shown value to `value`. The final frame is always the exact value. */
export function AnimatedCounter({ value, durationMs = 700, format = (n) => Math.round(n).toLocaleString() }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const shown = useRef(value);

  useEffect(() => {
    const from = shown.current;
    if (from === value) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      shown.current = value;
      setDisplay(value);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = progress === 1 ? value : from + (value - from) * eased;
      shown.current = current;
      setDisplay(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className="tabular">{format(display)}</span>;
}
