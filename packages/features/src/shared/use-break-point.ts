import { useState, useEffect } from 'react';

// Breakpoints
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// Use breakpoints

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Update initial state
    setMatches(media.matches);

    // Listen to screen size changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Hook to check breakpoint of Tailwind
 * @example const isMd = useBreakpoint('md');
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(breakpoints[breakpoint]);
}