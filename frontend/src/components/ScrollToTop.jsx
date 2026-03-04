/**
 * @file ScrollToTop.jsx
 * @description Behaviour-only component that scrolls the window to the top
 * whenever the React Router pathname changes.
 *
 * @component
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Renders nothing; purely handles scroll-to-top side-effects on navigation.
 *
 * Mount this once inside the router, above `<Routes>`, to ensure every page
 * transition starts at the top of the viewport.
 *
 * @component
 * @returns {null}
 */
const ScrollToTop = () => {
  const { pathname } = useLocation()

  // Scroll to top on every pathname change.
  // ─ Deps: [pathname]. Cleanup: none needed.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
