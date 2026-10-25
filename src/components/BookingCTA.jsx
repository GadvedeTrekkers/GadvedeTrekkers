/**
 * BookingCTA — unified Call-To-Action for public booking buttons.
 *
 * Always renders a real wa.me link. iOS and Android both follow <a href>,
 * including target="_blank". This component does not route to /book,
 * /booking, or a payment page.
 *
 * Props:
 *   trek          {object}  Trek/tour/camp object (required)
 *   selectedDate  {string}  Pre-fill date in message (optional)
 *   label         {string}  Override button text (optional)
 *   className     {string}  CSS class(es)
 *   style         {object}  Inline styles
 *   block         {bool}    Render as display:block full-width (default false)
 */

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

  const href = buildBookingWhatsAppUrl(trek, selectedDate);
  const text = label ?? (BOOKING_MODE === "WHATSAPP" ? CTA_LABELS.WHATSAPP : "Book Now");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={resolvedStyle}
      aria-label={`Book ${trek.name} on WhatsApp`}
    >
      {children ?? text}
    </a>
  );
}
