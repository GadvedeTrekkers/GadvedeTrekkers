import { useRef } from "react";
import logo from "../assets/gadvedelogo-256.png";
import { CONTACT } from "../config/contact";

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function CornerOrnament({ pos }) {
  /* pos: "tl" | "tr" | "bl" | "br" */
  const style = {
    position: "absolute",
    fontSize: 22,
    color: "var(--ht-gold)",
    lineHeight: 1,
    ...(pos === "tl" && { top: 6, left: 8 }),
    ...(pos === "tr" && { top: 6, right: 8 }),
    ...(pos === "bl" && { bottom: 6, left: 8 }),
    ...(pos === "br" && { bottom: 6, right: 8 }),
  };
  return <span style={style} aria-hidden="true">❧</span>;
}

function Divider({ label }) {
  return (
    <div className="ht-divider">
      <span className="ht-divider-line" />
      {label && <span className="ht-divider-label">{label}</span>}
      {label && <span className="ht-divider-line" />}
    </div>
  );
}

function Field({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div className="ht-field">
      <span className="ht-field-label">{label}</span>
      <span className="ht-field-dots" />
      <span className="ht-field-value" style={mono ? { fontFamily: "monospace", fontSize: 12 } : {}}>
        {value}
      </span>
    </div>
  );
}

function Stamp({ text }) {
  return (
    <div className="ht-stamp" aria-label="Confirmed stamp">
      <div className="ht-stamp-inner">
        <div className="ht-stamp-top">✦ CONFIRMED ✦</div>
        <div className="ht-stamp-main">{text || "VALID"}</div>
        <div className="ht-stamp-bottom">Gadvede Trekkers</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main HistoricTicket component
───────────────────────────────────────────── */
export default function HistoricTicket({ booking }) {
  const ticketRef = useRef(null);

  if (!booking) return null;

  const {
    bookingId,
    enhancedBookingId,
    firstName = "",
    lastName = "",
    email = "",
    contactNumber = "",
    whatsappNumber = "",
    emergencyContact = "",
    trekName = "",
    trekLocation = "",
    nextDate = "",
    tickets = 1,
    departureOrigin = "",
    pickupLocation = "",
    paymentOption = "",
    payableNow = 0,
    totalAmount = 0,
    remainingAmount = 0,
    bookingDate = "",
    bookingStatus = "CONFIRMED",
    additionalTravelers = [],
    whatsappGroupLink = "",
    travelDate = "",
    pickupMapUrl = "",
  } = booking;

  // Look up map URL from trek departure plans if not stored on booking
  const resolvedMapUrl = pickupMapUrl || (() => {
    try {
      const treks = JSON.parse(localStorage.getItem("gt_treks") || "[]");
      const trek = treks.find((t) => t.name === trekName || t.title === trekName);
      if (!trek) return "";
      const plans = JSON.parse(trek.departurePlans || "{}");
      const cityPlan = plans[departureOrigin];
      if (!cityPlan) return "";
      const point = (cityPlan.pickupPoints || []).find((p) => p.location === pickupLocation);
      return point?.mapUrl || "";
    } catch {
      return "";
    }
  })();

  const displayId = enhancedBookingId || bookingId || "—";
  const customerName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const dateToShow = travelDate || nextDate;
  const formattedDate = dateToShow
    ? new Date(dateToShow).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const bookedOn = bookingDate || "—";
  const qrData = encodeURIComponent(displayId);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}&bgcolor=F8EDD5&color=5C3A1E&margin=4`;

  /* ── Print handler ── */
  const handlePrint = () => {
    const el = ticketRef.current;
    if (!el) return;
    el.classList.add("ht-printing");
    window.print();
    /* remove class after print dialog closes */
    const cleanup = () => {
      el.classList.remove("ht-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  };

  /* ── Email share handler ── */
  const handleEmail = () => {
    const subject = encodeURIComponent(`Your Pravas Parwana (Travel Permit) — ${displayId}`);
    const body = encodeURIComponent(
      `Dear ${customerName},\n\n` +
      `Your booking is confirmed! Here are your details:\n\n` +
      `Booking ID  : ${displayId}\n` +
      `Trek        : ${trekName}\n` +
      `Date        : ${formattedDate}\n` +
      `Pickup      : ${pickupLocation}${resolvedMapUrl ? ` — ${resolvedMapUrl}` : ""}\n` +
      `Tickets     : ${tickets}\n` +
      `Amount Paid : ₹${Number(payableNow).toLocaleString("en-IN")}\n\n` +
      `${whatsappGroupLink ? `WhatsApp Group : ${whatsappGroupLink}\n\n` : ""}` +
      `आपली यात्रा सुखद आणि सुरक्षित होवो 🙏\n` +
      `— Gadvede Trekkers`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="ht-wrapper">

      {/* ── Action bar (hidden on print) ── */}
      <div className="ht-actions no-print">
        <button className="btn ht-btn-print" onClick={handlePrint}>
          🖨 Download / Print Ticket
        </button>
        <button className="btn ht-btn-email" onClick={handleEmail} disabled={!email}>
          ✉ Share via Email
        </button>
      </div>

      {/* ══════════════════════════════════════════
          THE TICKET
      ══════════════════════════════════════════ */}
      <div className="ht-outer" ref={ticketRef}>
        <CornerOrnament pos="tl" />
        <CornerOrnament pos="tr" />
        <CornerOrnament pos="bl" />
        <CornerOrnament pos="br" />

        {/* ── Header ── */}
        <div className="ht-header">
          <img src={logo} alt="Gadvede Trekkers" className="ht-logo" />
          <div className="ht-org">
            <div className="ht-org-name">Gadvede Trekkers</div>
            <div className="ht-org-tagline">Explore · Discover · Conquer</div>
          </div>
          <Stamp text={bookingStatus || "CONFIRMED"} />
        </div>

        <Divider />

        {/* ── Two-column body ── */}
        <div className="ht-body-cols">

          {/* Left — Traveler */}
          <div className="ht-col">
            <div className="ht-col-heading">✦ Traveler Information</div>
            <Field label="Name"             value={customerName} />
            <Field label="Contact"          value={contactNumber} />
            <Field label="WhatsApp"         value={whatsappNumber || contactNumber} />
            <Field label="Email"            value={email} />
            <Field label="Emergency Contact" value={emergencyContact} />
            {additionalTravelers.length > 0 && (
              <div className="ht-extra-travelers">
                <div className="ht-extra-label">+ {additionalTravelers.length} additional traveler{additionalTravelers.length > 1 ? "s" : ""}</div>
                {additionalTravelers.slice(0, 3).map((t, i) => (
                  <div key={i} className="ht-extra-row">
                    {t.firstName} {t.lastName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Booking */}
          <div className="ht-col">
            <div className="ht-col-heading">✦ Booking Details</div>
            <Field label="Booking ID" value={displayId} mono />
            <Field label="Trek"       value={trekName} />
            <Field label="Location"   value={trekLocation} />
            <Field label="Trek Date"  value={formattedDate} />
            <Field label="Tickets"    value={tickets} />
            <Field label="Booked On"  value={bookedOn} />
          </div>

        </div>

        <Divider label="✦ JOURNEY ✦" />

        {/* ── Journey Section ── */}
        <div className="ht-journey">
          <div className="ht-journey-point">
            <div className="ht-journey-icon">🚌</div>
            <div className="ht-journey-label">Departure</div>
            <div className="ht-journey-value">{departureOrigin || "—"}</div>
          </div>
          <div className="ht-journey-arrow">
            <span className="ht-journey-line" />
            <span className="ht-journey-arrowhead">▶</span>
          </div>
          <div className="ht-journey-point">
            <div className="ht-journey-icon">⛰️</div>
            <div className="ht-journey-label">Destination</div>
            <div className="ht-journey-value">{trekLocation || trekName}</div>
          </div>
        </div>

        <div className="ht-pickup-notice">
          📍 Pickup Point:{" "}
          {resolvedMapUrl ? (
            <a href={resolvedMapUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0f6f4a", fontWeight: 700 }}>
              <strong>{pickupLocation || "—"}</strong> 🗺
            </a>
          ) : (
            <strong>{pickupLocation || "—"}</strong>
          )}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          🕐 Please arrive <strong>15 minutes</strong> before departure
        </div>

        {whatsappGroupLink && (
          <div style={{
            margin: "12px 0",
            background: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#166534" }}>Join Your Trek WhatsApp Group</div>
              <div style={{ fontSize: 11, color: "#15803d" }}>Trek leader &amp; event details will be shared here 8 hrs before departure.</div>
            </div>
            <a href={whatsappGroupLink} target="_blank" rel="noopener noreferrer"
              style={{ background: "#25d366", color: "#fff", borderRadius: 6, padding: "6px 14px", fontWeight: 700, fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
              Join Group →
            </a>
          </div>
        )}

        <Divider label="✦ PAYMENT ✦" />

        {/* ── Payment + QR ── */}
        <div className="ht-payment-row">
          <div className="ht-payment-fields">
            <Field label="Payment Mode"    value={paymentOption} />
            <Field label="Amount Paid"     value={`₹${Number(payableNow).toLocaleString("en-IN")}`} />
            {Number(remainingAmount) > 0 && (
              <Field label="Remaining"     value={`₹${Number(remainingAmount).toLocaleString("en-IN")}`} />
            )}
            <Field label="Total Amount"   value={`₹${Number(totalAmount).toLocaleString("en-IN")}`} />
            <Field label="Status"         value={bookingStatus || "CONFIRMED"} />
          </div>
          <div className="ht-qr-box">
            <img
              src={qrUrl}
              alt={`QR for ${displayId}`}
              className="ht-qr-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="ht-qr-label">Scan to Verify</div>
          </div>
        </div>

        <Divider />

        {/* ── Organizer row ── */}
        <div className="ht-organizer">
          <div className="ht-org-badge">
            <img src={logo} alt="" className="ht-org-badge-logo" />
            <div>
              <div className="ht-org-badge-name">{CONTACT.companyName}</div>
              <div className="ht-org-badge-sub">Authorized Organizer</div>
            </div>
          </div>
          <div className="ht-org-contact">
            <div>📞 +91 {CONTACT.phones[0]}</div>
            <div>🌐 www.gadvede.com</div>
            {CONTACT.email ? <div>📧 {CONTACT.email}</div> : null}
          </div>
        </div>

        <Divider />

        {/* ── Footer ── */}
        <div className="ht-footer">
          <div className="ht-footer-id">Ticket ID: {displayId}</div>
          <div className="ht-footer-policy no-print">
            <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer">
              Cancellation &amp; Refund Policy
            </a>
          </div>
        </div>

      </div>
      {/* end .ht-outer */}

    </div>
  );
}
