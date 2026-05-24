/**
 * ScrollToTop — resets window scroll to (0, 0) on every route change.
 *
 * Why useLayoutEffect: runs synchronously *before* the browser paints the
 * new route, so the user never sees a frame of the old scroll position.
 *
 * Why direct .scrollTop = 0 (instead of window.scrollTo with behavior):
 * App.css sets `html { scroll-behavior: smooth }` for in-page anchor
 * scrolls. The `behavior: "instant"` option on window.scrollTo is
 * supposed to override that, but combined with the App's 400 ms fade-out
 * transition, the smooth-scroll animation can be interrupted mid-flight
 * and land somewhere other than the top. Setting .scrollTop directly is
 * always instant, never animated, regardless of CSS.
 *
 * Both documentElement and body are set to cover legacy quirks-mode
 * documents.
 *
 * Renders nothing. Mount once inside <BrowserRouter>.
 */

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
