import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 1023px)";

function getInitialMatch(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(query).matches;
}

/**
 * Reactive `matchMedia` hook. Returns true for phone/tablet widths (< 1024px),
 * the breakpoint at which the app switches from the fixed desktop panes to the
 * stacked mobile layout. SSR-safe (defaults to false on the server).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getInitialMatch(query));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on phone/tablet widths (< 1024px). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
