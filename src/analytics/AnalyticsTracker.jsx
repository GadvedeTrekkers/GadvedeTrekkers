import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analyticsEnabled, trackEvent, trackPageView } from "./tracking";

function classifyLink(href = "") {
  const h = String(href).toLowerCase();
  if (h.startsWith("tel:")) return "phone_click";
  if (h.includes("wa.me/") || h.includes("api.whatsapp.com") || h.includes("web.whatsapp.com") || h.startsWith("whatsapp:")) {
    return "whatsapp_click";
  }
  return null;
}

/**
 * SPA page views + delegated click tracking for WhatsApp and phone links.
 * Only the page path is sent with a click, never the number or the prefilled message.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Wait a tick so useSeo() has written the new <title>.
    const t = setTimeout(() => trackPageView(location.pathname), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (!analyticsEnabled()) return undefined;
    const onClick = (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      const name = classifyLink(anchor.getAttribute("href"));
      if (!name) return;
      const area = anchor.closest("header") ? "header" : anchor.closest("footer") ? "footer" : "page";
      trackEvent(name, { link_location: area, page_path: window.location.pathname });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
