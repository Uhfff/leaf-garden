import { useEffect, useState } from 'react';

/** Drives every age/countdown display in the garden — this one value
 *  flows down to every plot, so its cadence directly sets how often the
 *  whole tree re-renders. Paused while the tab/Mini App is hidden for the
 *  same reason as the income tick in useGarden: nothing is watching, and
 *  a single refresh on return is all a countdown display needs to look
 *  correct again. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id !== null) return;
      setNow(Date.now());
      id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id === null) return;
      clearInterval(id);
      id = null;
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs]);
  return now;
}
