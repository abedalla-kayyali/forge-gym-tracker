import { useState } from 'react';

/**
 * Timestamp captured once per mount. Use for time-bucketed stats (day/week
 * granularity) where re-render-stable "now" is required for render purity.
 * Pages/tabs unmount on navigation, so per-mount staleness is acceptable.
 */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
