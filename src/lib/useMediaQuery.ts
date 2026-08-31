import { useEffect, useState } from 'react'

/* Small matchMedia hook for responsive layout decisions. SSR-safe-ish
   (defaults to false when window is unavailable). */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// Breakpoints. "Compact" (< 1024px) collapses the desk sidebar into a drawer
// and swaps the queue table for a card list. "Phone" (< 600px) applies the
// tightest top-bar / gutter tweaks.
export const useIsCompact = () => useMediaQuery('(max-width: 1023px)')
export const useIsPhone = () => useMediaQuery('(max-width: 599px)')
