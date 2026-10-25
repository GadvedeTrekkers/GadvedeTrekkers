import { useState } from "react";

/* ── Sample data for preview ── */
const SAMPLE_BOOKING = {
  enhancedBookingId: "GT-2026-000042",
  firstName: "Arjun",
  lastName: "Sharma",
  email: "arjun.sharma@gmail.com",
  contactNumber: "9823456701",
  trekName: "Harishchandragad Trek",
  eventCategory: "Trek",
  tickets: 2,
  departureOrigin: "Pune",
  pickupLocation: "McDonald's, Deccan",
  travelDate: "2026-04-05",
  paymentOption: "UPI",
  baseAmount: 2898,
  taxAmount: 145,
  totalAmount: 3043,
  payableNow: 3043,
  remainingAmount: 0,
  bookingStatus: "CONFIRMED",
  bookingDate: "28/03/2026, 11:45 AM",
  taxExempt: false,
};

const SAMPLE_ENQUIRY = {
  id: "ENQ-2026-00028",
  name: "Priya Patil",
  phone: "9834567802",
  email: "priya.patil@gmail.com",
  eventName: "Kalsubai Trek",
  category: "Trek",
  pax: "4",
  date: "2026-04-12",
  location: "Bari Village, Maharashtra",
  pageUrl: "/treks/kalsubai-trek",
  createdAt: new Date().toISOString(),
};

const BRAND_GREEN = "#0c6e44";
const BRAND_DARK  = "#0f172a";
const ACCENT      = "#22c55e";

/* ════════════════════════════════════════════
   EMAIL 1: Booking Confirmation → Customer
════════════════════════════════════════════ */
function BookingConfirmationEmail({ data = SAMPLE_BOOKING }) {
  const isPaid = data.remainingAmount === 0;
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", background: "#f1f5f9", padding: "32px 0" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, #134e4a 100%)`, padding: "36px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏔</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: 0.5 }}>Gadvede Trekkers</div>
          <div style={{ color: "#a7f3d0", fontSize: 13, marginTop: 4 }}>Your adventure starts here</div>
        </div>

        {/* Success banner */}
        <div style={{ background: ACCENT, padding: "18px 40px", textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>✅ Booking Confirmed!</div>
          <div style={{ color: "#dcfce7", fontSize: 13, marginTop: 4 }}>
            Booking ID: <strong style={{ fontFamily: "monospace" }}>{data.enhancedBookingId}</strong>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: "#fff", padding: "36px 40px" }}>
          <p style={{ color: BRAND_DARK, fontSize: 15, marginBottom: 24 }}>
            Hi <strong>{data.firstName}</strong> 👋,<br /><br />
            Your booking for <strong>{data.trekName}</strong> has been confirmed! We're thrilled to have you join us.
            Here are your booking details:
          </p>

          {/* Booking Details Card */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: BRAND_GREEN, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              📋 Booking Details
            </div>
            {[
              ["Trek / Event",     data.trekName],
              ["Travel Date",      data.travelDate],
              ["No. of Travelers", `${data.tickets} person${data.tickets > 1 ? "s" : ""}`],
              ["Departure From",   data.departureOrigin],
              ["Pickup Point",     data.pickupLocation],
              ["Payment Method",   data.paymentOption],
              ["Booking Date",     data.bookingDate],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: BRAND_DARK, fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: BRAND_GREEN, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              💳 Payment Summary
            </div>
            {[
              ["Base Amount", `₹${data.baseAmount.toLocaleString("en-IN")}`],
              [data.taxExempt ? "Tax (Exempt)" : "GST (5%)", data.taxExempt ? "₹0" : `₹${data.taxAmount.toLocaleString("en-IN")}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: BRAND_DARK }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", borderTop: "1px solid #86efac", marginTop: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: BRAND_GREEN }}>Total Paid</span>
              <span style={{ fontWeight: 800, fontSize: 17, color: BRAND_GREEN }}>₹{data.payableNow.toLocaleString("en-IN")}</span>
            </div>
            {data.remainingAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 14 }}>
                <span style={{ color: "#d97706", fontWeight: 700 }}>⚠ Balance Due</span>
                <span style={{ color: "#d97706", fontWeight: 700 }}>₹{data.remainingAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "18px 24px", marginBottom: 28, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#065f46", marginBottom: 12 }}>
              📲 Join your trek WhatsApp group to get real-time updates, safety tips, and meet fellow trekkers!
            </div>
            <a
              href="https://wa.me/919856112727"
              style={{ background: "#25d366", color: "#fff", textDecoration: "none", padding: "10px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, display: "inline-block" }}
            >
              💬 Join WhatsApp Group
            </a>
          </div>

          {/* Important info */}
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 8 }}>⚡ Important Reminders</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#78350f", fontSize: 13, lineHeight: 1.8 }}>
              <li>Carry a government-issued photo ID on the day of the trek.</li>
              <li>Be at your pickup point <strong>15 minutes early</strong>.</li>
              <li>Wear trekking shoes and carry at least 2 litres of water.</li>
              <li>Follow your trek leader's instructions at all times.</li>
              {data.remainingAmount > 0 && <li><strong>Balance of ₹{data.remainingAmount.toLocaleString("en-IN")} is due on the trek day.</strong></li>}
            </ul>
          </div>

          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
            For any changes, cancellations or queries please reply to this email or WhatsApp us at{" "}
            <strong style={{ color: BRAND_GREEN }}>+91 98561 12727</strong>.<br />
            Cancellation policy applies as per our <a href="#" style={{ color: BRAND_GREEN }}>cancellation terms</a>.
          </p>
        </div>

        {/* Footer */}
        <div style={{ background: BRAND_DARK, padding: "24px 40px", textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🏔 Gadvede Trekkers</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
            Pune, Maharashtra · gadvedetrekkers@gmail.com · +91 98561 12727
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            {[["Website", "https://www.gadvede.com"], ["Instagram", "https://www.instagram.com/gadvede_trekkers/"], ["WhatsApp", "https://wa.me/919856112727"]].map(([l, href]) => (
              <a key={l} href={href} style={{ color: "#6ee7b7", fontSize: 12, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 14 }}>
            You're receiving this because you made a booking with Gadvede Trekkers.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EMAIL 2: New Booking Alert → Admin
════════════════════════════════════════════ */
function AdminBookingAlertEmail({ data = SAMPLE_BOOKING }) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", background: "#f1f5f9", padding: "32px 0" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div style={{ background: "#0f172a", padding: "28px 40px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 32 }}>🏔</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Gadvede Trekkers — Admin</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Booking Notification</div>
          </div>
        </div>

        {/* Alert bar */}
        <div style={{ background: "#16a34a", padding: "14px 40px" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            🎉 New Booking Received — {data.enhancedBookingId}
          </div>
          <div style={{ color: "#dcfce7", fontSize: 12, marginTop: 3 }}>
            {new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
          </div>
        </div>

        {/* Body */}
        <div style={{ background: "#fff", padding: "32px 40px" }}>

          {/* Quick summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { icon: "👤", label: "Customer",   value: `${data.firstName} ${data.lastName}` },
              { icon: "📞", label: "Phone",       value: data.contactNumber },
              { icon: "🥾", label: "Trek",        value: data.trekName },
              { icon: "📅", label: "Travel Date", value: data.travelDate },
              { icon: "🎫", label: "Tickets",     value: `${data.tickets} pax` },
              { icon: "💳", label: "Revenue",     value: `₹${data.payableNow.toLocaleString("en-IN")}` },
            ].map(card => (
              <div key={card.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{card.icon}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
                <div style={{ fontWeight: 700, color: BRAND_DARK, fontSize: 14, marginTop: 2 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Full details table */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ background: "#f8fafc", padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
              Booking Details
            </div>
            {[
              ["Booking ID",       data.enhancedBookingId],
              ["Email",            data.email],
              ["Departure",        data.departureOrigin],
              ["Pickup Point",     data.pickupLocation],
              ["Payment Method",   data.paymentOption],
              ["Base Amount",      `₹${data.baseAmount.toLocaleString("en-IN")}`],
              ["Tax",              data.taxExempt ? "₹0 (Exempt)" : `₹${data.taxAmount.toLocaleString("en-IN")}`],
              ["Total Collected",  `₹${data.payableNow.toLocaleString("en-IN")}`],
              ["Balance Due",      data.remainingAmount > 0 ? `₹${data.remainingAmount.toLocaleString("en-IN")}` : "Fully Paid"],
              ["Status",           data.bookingStatus],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: BRAND_DARK, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <a href="/admin/bookings" style={{ background: BRAND_GREEN, color: "#fff", textDecoration: "none", padding: "12px 32px", borderRadius: 8, fontWeight: 700, fontSize: 14, display: "inline-block", marginRight: 12 }}>
              View in Admin →
            </a>
            <a href={`https://wa.me/91${data.contactNumber}`} style={{ background: "#25d366", color: "#fff", textDecoration: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, display: "inline-block" }}>
              💬 WhatsApp Customer
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#0f172a", padding: "16px 40px", textAlign: "center" }}>
          <div style={{ color: "#475569", fontSize: 11 }}>
            Gadvede Trekkers Admin System · This is an automated notification
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EMAIL 3: New Enquiry Alert → Admin
════════════════════════════════════════════ */
function AdminEnquiryAlertEmail({ data = SAMPLE_ENQUIRY }) {
  const timeAgo = (() => {
    const diff = (Date.now() - new Date(data.createdAt).getTime()) / 60000;
    if (diff < 1) return "just now";
    if (diff < 60) return `${Math.round(diff)} min ago`;
    return `${Math.round(diff / 60)}h ago`;
  })();

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", background: "#f1f5f9", padding: "32px 0" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div style={{ background: "#0f172a", padding: "28px 40px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 32 }}>📬</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Gadvede Trekkers — Admin</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>New Enquiry Notification</div>
          </div>
        </div>

        {/* Alert bar */}
        <div style={{ background: "#d97706", padding: "14px 40px" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            🔔 New Lead — Respond within 30 minutes for best conversion
          </div>
          <div style={{ color: "#fef3c7", fontSize: 12, marginTop: 3 }}>Received {timeAgo}</div>
        </div>

        {/* Body */}
        <div style={{ background: "#fff", padding: "32px 40px" }}>

          {/* Lead card */}
          <div style={{ background: "#fffbeb", border: "2px solid #fcd34d", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, background: BRAND_GREEN, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
                {data.name?.[0] || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: BRAND_DARK }}>{data.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{data.phone} · {data.email || "No email"}</div>
              </div>
            </div>
            {[
              ["Package",        data.eventName],
              ["Type",          data.category],
              ["Travellers",    `${data.pax} pax`],
              ["Preferred Date", data.date],
              ["Location",      data.location],
              ["Source Page",   data.pageUrl],
            ].map(([label, value]) => value ? (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #fde68a", fontSize: 13 }}>
                <span style={{ color: "#92400e" }}>{label}</span>
                <span style={{ color: BRAND_DARK, fontWeight: 600 }}>{value}</span>
              </div>
            ) : null)}
          </div>

          {/* Response actions */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "18px 24px", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: BRAND_GREEN, marginBottom: 14 }}>⚡ Quick Response Actions</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={`https://wa.me/91${data.phone}?text=${encodeURIComponent(`Hi ${data.name} 👋\n\nThank you for your interest in ${data.eventName}!\nWe'd love to help you plan your adventure.\n\nPlease share your preferred dates and we'll send you a customised quote.\n\n— Gadvede Trekkers`)}`}
                style={{ background: "#25d366", color: "#fff", textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, display: "inline-block" }}>
                💬 WhatsApp Now
              </a>
              <a href={`tel:${data.phone}`} style={{ background: "#0284c7", color: "#fff", textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, display: "inline-block" }}>
                📞 Call
              </a>
              <a href="/admin/enquiries" style={{ background: BRAND_GREEN, color: "#fff", textDecoration: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, display: "inline-block" }}>
                📬 Open CRM
              </a>
            </div>
          </div>

          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#b91c1c" }}>
            ⏱ <strong>Response Time Matters:</strong> Leads contacted within 30 minutes are 7x more likely to convert. This lead is currently in <strong>New Lead</strong> stage.
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#0f172a", padding: "16px 40px", textAlign: "center" }}>
          <div style={{ color: "#475569", fontSize: 11 }}>
            Gadvede Trekkers Admin System · This is an automated notification
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EMAIL 4: Enquiry Acknowledgement → Customer
════════════════════════════════════════════ */
function EnquiryAckEmail({ data = SAMPLE_ENQUIRY }) {
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", background: "#f1f5f9", padding: "32px 0" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, #134e4a 100%)`, padding: "36px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏔</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>Gadvede Trekkers</div>
          <div style={{ color: "#a7f3d0", fontSize: 13, marginTop: 4 }}>We've received your enquiry!</div>
        </div>

        <div style={{ background: "#fff", padding: "36px 40px" }}>
          <p style={{ color: BRAND_DARK, fontSize: 15, marginBottom: 20 }}>
            Hi <strong>{data.name?.split(" ")[0]}</strong> 👋,
          </p>
          <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            Thank you for your interest in the <strong>{data.eventName}</strong>!
            We've received your enquiry and our team will reach out to you within <strong>30 minutes</strong> with pricing and availability.
          </p>

          {/* Enquiry summary */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: BRAND_GREEN, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Your Enquiry Summary
            </div>
            {[
              ["Package",         data.eventName],
              ["Category",        data.category],
              ["No. of Travelers", `${data.pax} person${data.pax > 1 ? "s" : ""}`],
              ["Preferred Date",  data.date],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: BRAND_DARK, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* WA CTA */}
          <div style={{ background: "#f0fdf4", border: "1px solid #6ee7b7", borderRadius: 10, padding: "18px 24px", marginBottom: 24, textAlign: "center" }}>
            <p style={{ color: "#065f46", fontSize: 13, marginBottom: 12 }}>
              Want a faster response? Chat with us directly on WhatsApp — we're usually online!
            </p>
            <a
              href={`https://wa.me/919856112727?text=${encodeURIComponent(`Hi 👋\n\nI'm interested in:\n\n📍 Location: ${data.location || data.eventName}\n📦 Package: ${data.eventName}\n👥 Type: ${data.category}\n\nPlease share price and details.`)}`}
              style={{ background: "#25d366", color: "#fff", textDecoration: "none", padding: "11px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, display: "inline-block" }}
            >
              💬 Chat on WhatsApp
            </a>
          </div>

          <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}>
            📞 Call us: <strong style={{ color: BRAND_GREEN }}>+91 98561 12727</strong> &nbsp;|&nbsp;
            ✉️ <strong style={{ color: BRAND_GREEN }}>gadvedetrekkers@gmail.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{ background: BRAND_DARK, padding: "24px 40px", textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🏔 Gadvede Trekkers</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Pune, Maharashtra · gadvedetrekkers@gmail.com · www.gadvede.com</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 12 }}>
            You're receiving this because you submitted an enquiry on our website.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Main Page
════════════════════════════════════════════ */
const TABS = [
  { id: "booking-customer", label: "✅ Booking Confirmation", sub: "→ Customer", component: BookingConfirmationEmail },
  { id: "booking-admin",    label: "🎉 New Booking Alert",    sub: "→ Admin",    component: AdminBookingAlertEmail },
  { id: "enquiry-admin",    label: "🔔 New Enquiry Alert",    sub: "→ Admin",    component: AdminEnquiryAlertEmail },
  { id: "enquiry-customer", label: "📩 Enquiry Received",     sub: "→ Customer", component: EnquiryAckEmail },
];

export default function EmailTemplates() {
  const [activeTab, setActiveTab] = useState("booking-customer");

  const active = TABS.find(t => t.id === activeTab);
  const EmailComponent = active?.component;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h3 className="adm-page-title">✉️ Email Templates</h3>
          <div className="text-muted small mt-1">
            Preview all transactional emails — sent on booking, enquiry, and admin alerts.
            <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: 10 }}>
              Email sending: not yet configured — connect EmailJS or SMTP to activate
            </span>
          </div>
        </div>
      </div>

      {/* Setup notice */}
      <div className="alert d-flex align-items-start gap-3 mb-4" style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12 }}>
        <div style={{ fontSize: 22 }}>⚙️</div>
        <div style={{ fontSize: 13 }}>
          <div className="fw-bold mb-1" style={{ color: "#92400e" }}>Email Sending is Not Yet Active</div>
          <div style={{ color: "#78350f", lineHeight: 1.7 }}>
            These are your email templates — the designs are ready. To start sending real emails, connect an email provider:
            <strong> EmailJS</strong> (free, no backend needed) or <strong>Nodemailer via your Express backend</strong>.
            WhatsApp notifications are already working via the CRM.
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="adm-form-card mb-4 p-0" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #e2e8f0" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                borderBottom: activeTab === tab.id ? `3px solid ${BRAND_GREEN}` : "3px solid transparent",
                background: activeTab === tab.id ? "#f0fdf4" : "#fff",
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: activeTab === tab.id ? 800 : 500, color: activeTab === tab.id ? BRAND_GREEN : "#64748b", lineHeight: 1.4 }}>
                {tab.label}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{tab.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Email preview */}
      <div className="adm-form-card p-0" style={{ overflow: "hidden" }}>
        <div style={{ background: "#e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
            📧 Preview: {active?.label} {active?.sub}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
          </div>
        </div>
        <div style={{ overflowY: "auto", maxHeight: 720 }}>
          {EmailComponent && <EmailComponent />}
        </div>
      </div>
    </div>
  );
}
