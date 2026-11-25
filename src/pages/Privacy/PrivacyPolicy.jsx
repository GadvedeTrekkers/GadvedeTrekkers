import { Link } from "react-router-dom";
import { CONTACT, whatsappHref } from "../../config/contact";
import { formatWhatsappDisplay, getWhatsappNumber } from "../../config/whatsappSetting";

/**
 * /privacy — DRAFT for Pratik's review (needed as the Privacy Policy URL in the Meta app).
 * Plain description of what the site and our Instagram/Facebook channels collect.
 * Deliberately makes no legal-compliance claims and states no retention periods — those must be
 * decided and confirmed by Gadvede Trekkers before this page is linked from the footer.
 */
const S = { wrap: { maxWidth: 860, margin: "0 auto", padding: "110px 20px 60px", lineHeight: 1.7, color: "#1f2d27" }, h2: { fontSize: "1.25rem", marginTop: 28, color: "#103528" }, draft: { background: "#fff4d6", border: "1px solid #e8c25a", borderRadius: 8, padding: "10px 14px", fontSize: ".92rem", marginBottom: 20 } };

export default function PrivacyPolicy() {
  return (
    <main style={S.wrap}>
      <div style={S.draft} role="note"><strong>Draft — pending review by Gadvede Trekkers.</strong> This page is not yet final.</div>
      <h1>Privacy Policy</h1>
      <p>This page explains what personal information Gadvede Trekkers (“we”) collects through www.gadvede.com and our Instagram and Facebook channels, how we use it, and how you can ask us to delete it.</p>

      <h2 style={S.h2}>Information we collect</h2>
      <ul>
        <li><strong>Enquiry and booking forms:</strong> name, phone number, email address, the trek or tour you are interested in, preferred dates, group size and any message you write.</li>
        <li><strong>WhatsApp:</strong> when you tap a WhatsApp button, your message and phone number are shared with us through WhatsApp.</li>
        <li><strong>Instagram messages and comments:</strong> if you message or comment on our Instagram account, we receive the message or comment text, your Instagram account identifier and the time it was sent.</li>
        <li><strong>Facebook / Instagram lead forms:</strong> if you submit one of our lead forms, we receive the answers you entered (for example name, phone, email and trek interest).</li>
        <li><strong>Payments:</strong> if you pay online, payment is handled by the payment provider; we receive the payment reference and status, not your full card details.</li>
      </ul>

      <h2 style={S.h2}>How we use it</h2>
      <p>To reply to your enquiry, arrange and confirm bookings, share trip details and updates, and improve our trips and service. We do not sell your personal information.</p>

      <h2 style={S.h2}>Who we share it with</h2>
      <p>Only with service providers that help us run the website and bookings (for example hosting, database and payment providers), and with trip leaders when needed to run your trip.</p>

      <h2 style={S.h2}>Data deletion</h2>
      <p>You can ask us to delete the personal information we hold about you, including Instagram messages, comments and lead-form answers received through Meta:</p>
      <ol>
        <li>Email <a href={`mailto:${CONTACT.email}?subject=Data%20deletion%20request`}>{CONTACT.email}</a> with the subject “Data deletion request”, or message us on WhatsApp at <a href={whatsappHref("Data deletion request")} target="_blank" rel="noopener noreferrer">{formatWhatsappDisplay(getWhatsappNumber())}</a>.</li>
        <li>Tell us the name, phone number, email address and/or Instagram username you used, so we can find your records.</li>
        <li>We will confirm when your request has been completed. We may need to keep records we are legally required to retain (for example payment records).</li>
      </ol>
      <p>You can also remove our app’s access from your Facebook or Instagram settings (Settings → Apps and Websites).</p>

      <h2 style={S.h2}>Contact</h2>
      <p>Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> · WhatsApp: <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">{formatWhatsappDisplay(getWhatsappNumber())}</a></p>
      <p><Link to="/cancellation-policy">Cancellation policy</Link></p>
    </main>
  );
}
