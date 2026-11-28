import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analyticsEnabled, trackEvent, trackPageView } from "./tracking";
import { getWhatsappTrip } from "../config/whatsappTrip";
import { DESTINATION_HUBS } from "../../shared/destinationHubs.js";

const HUB_PATHS = new Set(DESTINATION_HUBS.map((h) => h.path));
/** trip_page | hub | page — where on the site a WhatsApp link was tapped (the floating button says "floating"). */
function pagePlacement(pathname, trip = getWhatsappTrip()) {
  if (trip) return "trip_page";
  const p = String(pathname || "/").replace(/\/$/, "") || "/";
  return HUB_PATHS.has(p) || p === "/trips" || p.startsWith("/trips/") ? "hub" : "page";
}

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
 * Only the page path, placement and (on trip pages) the trip name/id are sent with a click, never the number or
 * the prefilled message. Links can set data-wa-placement / data-trip-name / data-trip-id (the floating button does).
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
      const path = window.location.pathname;
      if (name !== "whatsapp_click") { trackEvent(name, { link_location: area, page_path: path }); return; }
      const trip = getWhatsappTrip();
      trackEvent(name, {
        link_location: anchor.dataset.waPlacement === "floating" ? "floating" : area,
        placement: anchor.dataset.waPlacement || pagePlacement(path, trip),
        trip_name: anchor.dataset.tripName || trip?.name || "",
        trip_id: anchor.dataset.tripId || trip?.id || "",
        page_path: path,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
