import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { getWhatsappTrip, subscribeWhatsappTrip, tripChatUrl } from "../../config/whatsappTrip";
import "./FloatingWhatsApp.css";
import { formatWhatsappDisplay, getWhatsappNumber } from "../../config/whatsappSetting";

/** Pages that never show the button (staff areas and the printable ticket). App.jsx already hides it on /admin. */
const HIDDEN_PREFIXES = ["/admin", "/employee", "/leader-training", "/ticket", "/qa/"];
/** Fixed bottom bars the button must sit above (trip page CTA bar, booking page mobile bar). */
const BOTTOM_BARS = ".td-cta-bar, .booking-mobile-cta";

function WhatsAppIcon({ size = 30 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

/** Keeps the button above a fixed bottom bar when the page has one. */
function useBottomOffset(pathname) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector(BOTTOM_BARS);
      const css = bar && getComputedStyle(bar);
      // (offsetParent is always null for position:fixed, so check display/visibility + size instead)
      const visible = css && css.position === "fixed" && css.display !== "none" && css.visibility !== "hidden";
      setOffset(visible ? Math.round(bar.getBoundingClientRect().height) : 0);
    };
    const timers = [100, 600, 1500, 3000].map((ms) => setTimeout(measure, ms)); // trip pages render live data a moment later
    // Page content (and the bar) can change size after data loads: re-measure when the page resizes.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(document.body);
    window.addEventListener("resize", measure);
    return () => { timers.forEach(clearTimeout); ro?.disconnect(); window.removeEventListener("resize", measure); };
  }, [pathname]);
  return offset;
}

/**
 * The ONE floating WhatsApp button on public pages (replaces the old one on the home page).
 * Off trip pages: one tap opens the chat. On trip pages: a small card to optionally pick the date and pickup point,
 * then "Open WhatsApp" with the trip, the choices and the (UTM-tagged) page link prefilled.
 * Clicks are tracked by AnalyticsTracker as whatsapp_click with placement "floating" (no number, no message text).
 */
export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const trip = useSyncExternalStore(subscribeWhatsappTrip, getWhatsappTrip, () => null);
  const offset = useBottomOffset(pathname);
  if (HIDDEN_PREFIXES.some((p) => pathname.toLowerCase().startsWith(p))) return null;
  // keyed: a new page or trip starts with the card closed and nothing picked
  return <FloatingWhatsAppButton key={`${pathname}|${trip?.id || ""}`} trip={trip} offset={offset} />;
}

function FloatingWhatsAppButton({ trip, offset }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [pickup, setPickup] = useState("");
  const panelId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("select, a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hasChoices = Boolean(trip && (trip.dates.length || trip.pickups.length));
  const href = tripChatUrl({ trip, date, pickup });
  const trackAttrs = { "data-wa-placement": "floating", ...(trip ? { "data-trip-name": trip.name, "data-trip-id": trip.id } : {}) };
  const style = { "--gt-wa-offset": `${offset}px` };

  if (!hasChoices) {
    return (
      <a className="gt-wa-fab" style={style} href={href} target="_blank" rel="noopener noreferrer"
        aria-label={trip ? `Chat on WhatsApp about ${trip.name}` : "Chat with us on WhatsApp"} title="Chat on WhatsApp" {...trackAttrs}>
        <WhatsAppIcon />
      </a>
    );
  }

  return (
    <div className="gt-wa-wrap" style={style}>
      {open && (
        <div className="gt-wa-panel" id={panelId} role="dialog" aria-label="Chat on WhatsApp" ref={panelRef}>
          <div className="gt-wa-panel-head">
            <div>
              <div className="gt-wa-panel-title">Chat on WhatsApp</div>
              <div className="gt-wa-panel-trip">{trip.name}</div>
            </div>
            <button type="button" className="gt-wa-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          {trip.dates.length > 0 && (
            <label className="gt-wa-field">
              <span>Date <em>(optional)</em></span>
              <select value={date} onChange={(e) => setDate(e.target.value)}>
                <option value="">Not decided yet</option>
                {trip.dates.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          )}
          {trip.pickups.length > 0 && (
            <label className="gt-wa-field">
              <span>Pickup point <em>(optional)</em></span>
              <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
                <option value="">Not decided yet</option>
                {trip.pickups.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          )}
          <a className="gt-wa-send" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} {...trackAttrs}>
            <WhatsAppIcon size={18} /> Open WhatsApp
          </a>
          <div className="gt-wa-note">We reply on {formatWhatsappDisplay(getWhatsappNumber())}</div>
        </div>
      )}
      <button type="button" className="gt-wa-fab" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={open ? panelId : undefined}
        aria-label={`Chat on WhatsApp about ${trip.name}`} title="Chat on WhatsApp">
        {open ? <span className="gt-wa-x" aria-hidden="true">×</span> : <WhatsAppIcon />}
      </button>
    </div>
  );
}
