/**
 * BookingCTA — unified Call-To-Action component for all booking buttons.
 *
 * Renders the correct element based on BOOKING_MODE from bookingConfig.js.
 * To change the booking method site-wide, edit BOOKING_MODE in that one file.
 *
 * Props:
 *   trek          {object}  Trek/tour object (required)
 *   selectedDate  {string}  Pre-fill date in message (optional, ISO YYYY-MM-DD or display string)
 *   label         {string}  Override button text (optional)
 *   className     {string}  CSS class(es)
 *   style         {object}  Inline styles
 *   block         {bool}    Render as display:block full-width (default false)
 */

import { Link } from "react-router-dom";
import {
  BOOKING_MODE,
  CTA_LABELS,
  buildBookingWhatsAppUrl,
} from "../config/bookingConfig";

export default function BookingCTA({
  trek,
  selectedDate = null,
  label,
  className = "",
  style = {},
  block = false,
  children,
}) {
  if (!trek) return null;

  const resolvedStyle = block
    ? { display: "block", textAlign: "center", ...style }
    : style;

  /* ── WHATSAPP mode ─────────────────────────────────────────── */
  if (BOOKING_MODE === "WHATSAPP") {
    const href = buildBookingWhatsAppUrl(trek, selectedDate);
    const text = label ?? CTA_LABELS.WHATSAPP;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={resolvedStyle}
        aria-label={`Book ${trek.name} via WhatsApp`}
      >
        {children ?? text}
      </a>
    );
  }

  /* ── DIRECT_BOOKING mode ───────────────────────────────────── */
  if (BOOKING_MODE === "DIRECT_BOOKING") {
    const text = label ?? CTA_LABELS.DIRECT_BOOKING;
    return (
      <Link to="/book" state={{ trek }} className={className} style={resolvedStyle}>
        {children ?? text}
      </Link>
    );
  }

  /* ── PAYMENT_GATEWAY mode (future) ────────────────────────── */
  if (BOOKING_MODE === "PAYMENT_GATEWAY") {
    const text = label ?? CTA_LABELS.PAYMENT_GATEWAY;
    return (
      <button
        type="button"
        className={className}
        style={resolvedStyle}
        onClick={() => {
          /* TODO: trigger payment gateway checkout */
          console.warn("Payment gateway not yet implemented.");
        }}
      >
        {children ?? text}
      </button>
    );
  }

  /* ── Fallback (unknown mode) — default to WhatsApp ─────────── */
  const href = buildBookingWhatsAppUrl(trek, selectedDate);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={resolvedStyle}
    >
      {children ?? (label ?? "Book Now")}
    </a>
  );
}
