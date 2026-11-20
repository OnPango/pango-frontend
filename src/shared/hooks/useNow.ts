import { useEffect, useState } from 'react';

/** The current time (epoch ms), updated every `intervalMs`: for countdowns to a server date. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/** Whole seconds from `now` until `isoDate`; 0 once it has passed. */
export const secondsUntil = (isoDate: string, now: number) =>
  Math.max(0, Math.ceil((Date.parse(isoDate) - now) / 1000));
