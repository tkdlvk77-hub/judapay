import { useEffect } from 'react'

// Bottom-tab screen paths — swipe-back must be blocked on these
const TAB_PATHS = new Set([
  '/home', '/home-business', '/messages', '/alerts', '/more', '/business-menu',
])

/**
 * Prevents iOS swipe-back on tab (root) screens.
 *
 * Pushes a guard entry with the same URL so that iOS swipe pops the guard
 * and lands back on the same URL — React Router sees no URL change and stays.
 * The onPop handler immediately re-pushes a fresh guard to keep the wall intact.
 */
export function useNoSwipeBack() {
  useEffect(() => {
    window.history.pushState({ _wall: true }, '')

    const onPop = () => {
      if (TAB_PATHS.has(window.location.pathname)) {
        window.history.pushState({ _wall: true }, '')
      }
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
}
