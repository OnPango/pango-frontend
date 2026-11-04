import { useCallback, useEffect, useState } from 'react';

/** Seconds left of a cooldown (0 = ready) and a function that starts it. */
export function useCountdown(seconds: number): [remaining: number, start: () => void] {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  return [remaining, start];
}
