/**
 * ScrollToTop — resets window scroll to (0, 0) on every route change.
 *
 * Why useLayoutEffect: runs synchronously *before* the browser paints the
 * new route. Using a plain useEffect can leave the user looking at the
 * old scroll position for one frame while the new page renders.
 *
 * Why "instant" behavior: this is intentional snap-to-top, not a smooth
 * animated scroll — smooth scrolling on every navigation feels broken.
 *
 * Renders nothing. Mount once inside <BrowserRouter>.
 */

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
