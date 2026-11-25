import { Link } from "react-router-dom";

const TREKS_CAMPING_POLICY = [
  {
    window: "More than 30 days before departure",
    refund: "75% refund of the total amount paid",
    highlight: false,
  },
  {
    window: "15 to 30 days before departure",
    refund: "50% refund of the total amount paid",
    highlight: false,
  },
  {
    window: "Less than 15 days before departure",
    refund: "No refund",
    highlight: true,
  },
];

const BACKPACKING_POLICY = [
  {
    window: "30 days or more before departure",
    refund: "Full refund minus booking/processing fee",
    highlight: false,
  },
  {
    window: "15 to 29 days before departure",
    refund: "50% refund of the total amount paid",
    highlight: false,
  },
  {
    window: "0 to 14 days before departure",
    refund: "No refund",
    highlight: true,
  },
];

const HOW_TO_CANCEL = [
  "Send a cancellation request via WhatsApp to 98561 12727 or email us at support@gadvede.com.",
  "Mention your Booking ID, full name, registered phone number, and reason for cancellation.",
  "Our team will verify your booking and confirm the cancellation within 24–48 hours.",
  "Eligible refunds will be processed within 7–10 business days to the original payment method.",
  "Refunds for cash payments will be transferred via bank transfer (provide account details).",
  "You will receive an email/WhatsApp confirmation once the refund is initiated.",
];

export default function CancellationPolicy() {
  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      <style>{`
        .cp-hero { background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%); padding: 56px 0 48px; }
        .cp-card { background: #fff; border-radius: 14px; padding: 32px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .cp-section-title { font-size: 1.15rem; font-weight: 800; color: #065f46; margin-bottom: 18px; }
        .cp-table { width: 100%; border-collapse: collapse; }
        .cp-table th { background: #065f46; color: #fff; padding: 12px 16px; text-align: left; font-size: 0.88rem; font-weight: 700; }
        .cp-table td { padding: 12px 16px; font-size: 0.88rem; color: #374151; border-bottom: 1px solid #e5e7eb; }
        .cp-table tr:last-child td { border-bottom: none; }
        .cp-table tr.highlight td { background: #fff1f2; color: #dc2626; font-weight: 600; }
        .cp-table tr:not(.highlight):hover td { background: #f0fdf4; }
        .cp-note { background: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 18px; font-size: 0.88rem; color: #92400e; margin-top: 16px; }
        .cp-step { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
        .cp-step-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.88rem; }
        .cp-step-text { font-size: 0.9rem; color: #374151; line-height: 1.6; padding-top: 4px; }
        .cp-badge { display: inline-block; background: #d1fae5; color: #065f46; border-radius: 20px; padding: 4px 14px; font-size: 0.78rem; font-weight: 700; margin-right: 6px; margin-bottom: 6px; }
        .cp-badge.red { background: #fee2e2; color: #dc2626; }
        .cp-badge.amber { background: #fef3c7; color: #92400e; }
      `}</style>

      {/* Hero */}
      <div className="cp-hero">
        <div className="container">
          <p style={{ color: "#6ee7b7", fontSize: "0.82rem", marginBottom: 12 }}>
            <Link to="/" style={{ color: "#6ee7b7", textDecoration: "none" }}>Home</Link>
            {" › "}
            <span style={{ color: "#fff" }}>Cancellation & Refund Policy</span>
          </p>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: 8 }}>
            Cancellation & Refund Policy
          </h1>
          <p style={{ color: "#a7f3d0", fontSize: "0.95rem", maxWidth: 600, margin: 0 }}>
            We understand that plans change. Please read our cancellation and refund policy carefully before booking.
          </p>
        </div>
      </div>

      <div className="container py-5">

        {/* Treks & Camping */}
        <div className="cp-card">
          <h2 className="cp-section-title">🥾 Treks & Camping — Cancellation Policy</h2>
          <p style={{ fontSize: "0.9rem", color: "#374151", marginBottom: 20 }}>
            Applies to all Gadvede Trekkers trek events, overnight camping trips, and day treks.
          </p>
          <table className="cp-table">
            <thead>
              <tr>
                <th>Cancellation Window</th>
                <th>Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              {TREKS_CAMPING_POLICY.map((row, i) => (
                <tr key={i} className={row.highlight ? "highlight" : ""}>
                  <td>{row.window}</td>
                  <td>{row.refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cp-note">
            <strong>Please Note:</strong> Date transfers within 3 days of departure attract a ₹200/person transfer fee. No refund is provided for no-shows or last-minute cancellations.
          </div>
        </div>

        {/* Backpacking Tours */}
        <div className="cp-card">
          <h2 className="cp-section-title">🎒 Backpacking Tours — Cancellation Policy</h2>
          <p style={{ fontSize: "0.9rem", color: "#374151", marginBottom: 20 }}>
            Applies to all multi-day backpacking tours, Velas Turtle Festival, and similar extended group tours.
          </p>
          <table className="cp-table">
            <thead>
              <tr>
                <th>Cancellation Window</th>
                <th>Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              {BACKPACKING_POLICY.map((row, i) => (
                <tr key={i} className={row.highlight ? "highlight" : ""}>
                  <td>{row.window}</td>
                  <td>{row.refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cp-note">
            <strong>Please Note:</strong> Booking/processing fees are non-refundable in all cases. Payments made via third-party platforms may have additional processing time.
          </div>
        </div>

        {/* Event Cancellation by Gadvede */}
        <div className="cp-card">
          <h2 className="cp-section-title">⚡ Event Cancelled by Gadvede Trekkers</h2>
          <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8, marginBottom: 12 }}>
            In the rare event that Gadvede Trekkers cancels a trek or tour due to unforeseen circumstances (extreme weather, natural disasters, government orders, safety concerns), the following applies:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: "0.9rem", color: "#374151", lineHeight: 2 }}>
            <li>You will receive a <strong>full refund</strong> or the option to transfer to the next available date at no extra charge.</li>
            <li>Notification will be sent via WhatsApp, email, and phone at least 12–24 hours before departure where possible.</li>
            <li>For cancellations due to weather at the location, refund/transfer will be offered at our discretion based on the circumstances.</li>
            <li>Gadvede Trekkers is not responsible for travel costs (flights, trains, personal transport) incurred independently.</li>
          </ul>
        </div>

        {/* Trip Delays */}
        <div className="cp-card">
          <h2 className="cp-section-title">🕐 Trip Delays & Unforeseen Circumstances</h2>
          <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8, marginBottom: 12 }}>
            Delays may occur due to bad road conditions, traffic, vehicle breakdown, heavy rainfall, or driver breaks. In such cases:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: "0.9rem", color: "#374151", lineHeight: 2 }}>
            <li>Gadvede Trekkers is not liable for delays caused by external factors beyond our control.</li>
            <li>No refund is offered for delays unless the event is cancelled entirely.</li>
            <li>In case of roadblocks or forest closures en route, we will try to offer an alternate activity or itinerary.</li>
            <li>Costs due to unforeseen delays (meals, accommodation, transport) are to be borne by the participant.</li>
            <li>Medical and emergency evacuation costs are the participant's responsibility. We strongly recommend travel insurance.</li>
          </ul>
        </div>

        {/* Non-Refundable Situations */}
        <div className="cp-card">
          <h2 className="cp-section-title">❌ Non-Refundable Situations</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <span className="cp-badge red">Missing the train/bus</span>
            <span className="cp-badge red">Late arrival at pickup</span>
            <span className="cp-badge red">No-show on event day</span>
            <span className="cp-badge red">Cancellation within 15 days</span>
            <span className="cp-badge amber">Personal reasons (illness, work)</span>
            <span className="cp-badge amber">Refused boarding (safety breach)</span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8 }}>
            Refunds are not provided if a participant misses the bus/train pickup, arrives late, or is refused boarding by the trek leader for safety reasons (intoxication, improper gear, medical unsuitability, etc.).
          </p>
        </div>

        {/* How to Cancel */}
        <div className="cp-card">
          <h2 className="cp-section-title">📋 How to Cancel Your Booking</h2>
          <div style={{ marginTop: 8 }}>
            {HOW_TO_CANCEL.map((step, i) => (
              <div className="cp-step" key={i}>
                <div className="cp-step-num">{i + 1}</div>
                <div className="cp-step-text">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 14, padding: 32, textAlign: "center" }}>
          <h2 style={{ color: "#6ee7b7", fontWeight: 800, fontSize: "1.15rem", marginBottom: 12 }}>Need Help with a Cancellation?</h2>
          <p style={{ color: "#a7f3d0", fontSize: "0.9rem", marginBottom: 20 }}>
            Reach out to us directly — we're happy to help resolve any booking issues.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://wa.me/919856112727" target="_blank" rel="noopener noreferrer"
              style={{ background: "#25d366", color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
              💬 WhatsApp: 98561 12727
            </a>
            <a href="mailto:support@gadvede.com"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
              ✉️ support@gadvede.com
            </a>
          </div>
          <p style={{ color: "#6ee7b7", fontSize: "0.8rem", marginTop: 20, marginBottom: 0 }}>
            Policy last updated: March 2026. Subject to change without prior notice.
          </p>
        </div>

      </div>
    </div>
  );
}
