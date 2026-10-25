import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT, telHref, whatsappHref } from "../config/contact";
import { enquiryService } from "../services/enquiry.service";

const INTERESTS = ["Trek", "Tour", "Camping", "Corporate Outing", "Industrial Visit", "Rentals", "Other"];

const BRAND = "#198754";
const BRAND_DARK = "#146c43";

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "Trek", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waMessage, setWaMessage] = useState("");

  useEffect(() => {
    document.title = "Contact Us | Gadvede Trekkers";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    const digits = form.phone.replace(/\D/g, "");
    if (!(digits.length === 10 || (digits.length === 12 && digits.startsWith("91"))))
      e.phone = "Enter a valid 10-digit mobile number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (!form.message.trim()) e.message = "Tell us what you're looking for";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const phone = form.phone.replace(/\D/g, "").slice(-10);
    const message = [
      "Hi Gadvede Trekkers! I have an enquiry.",
      `Name: ${form.name.trim()}`,
      `Phone: ${phone}`,
      form.email.trim() ? `Email: ${form.email.trim()}` : "",
      `Interested in: ${form.interest}`,
      `Message: ${form.message.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setSubmitting(true);
      await enquiryService.create({
        eventName: `Contact Page – ${form.interest}`,
        category: form.interest,
        name: form.name.trim(),
        phone,
        email: form.email.trim(),
        message: form.message.trim(),
        notes: form.message.trim(),
        date: "Flexible",
        source: "Website – Contact Page",
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
      });
      setWaMessage(message);
      setSubmitted(true);
      window.open(whatsappHref(message), "_blank", "noopener,noreferrer");
    } catch (err) {
      setErrors({ form: err?.message || "Something went wrong. Please call or WhatsApp us directly." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError) => ({
    borderRadius: 10,
    borderColor: hasError ? "#dc3545" : "#d4e4db",
    padding: "10px 12px",
    fontSize: "0.95rem",
  });

  return (
    <div className="gt-contact-page" style={{ background: "#f4fbf7" }}>
      {/* HERO */}
      <section
        style={{
          background: `linear-gradient(135deg, ${BRAND_DARK} 0%, ${BRAND} 60%, #1fa56c 100%)`,
          color: "#fff",
          padding: "56px 0 48px",
        }}
      >
        <div className="container">
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            We usually reply within a few hours
          </span>
          <h1 className="fw-bold mb-2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
            Contact Gadvede Trekkers
          </h1>
          <p className="mb-4" style={{ maxWidth: 640, color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
            Questions about a trek, tour, camping trip or a corporate outing? Call us, drop a WhatsApp message,
            or send an enquiry below and our team will get back to you.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <a
              href={telHref(CONTACT.phones[0])}
              className="btn fw-bold"
              style={{ background: "#fff", color: BRAND_DARK, borderRadius: 12, padding: "11px 20px" }}
            >
              📞 Call {CONTACT.phones[0]}
            </a>
            <a
              href={whatsappHref("Hi Gadvede Trekkers! I'd like more details.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn fw-bold"
              style={{ background: "#25d366", color: "#fff", borderRadius: 12, padding: "11px 20px", border: "none" }}
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4">
          {/* CONTACT OPTIONS */}
          <div className="col-lg-5">
            <div className="d-flex flex-column gap-3">
              <div className="gt-contact-card">
                <div className="gt-contact-icon">📞</div>
                <div>
                  <h2 className="gt-contact-title">Call us</h2>
                  {CONTACT.phones.map((phone) => (
                    <a key={phone} href={telHref(phone)} className="gt-contact-link d-block">
                      +91 {phone}
                    </a>
                  ))}
                  <p className="gt-contact-meta">{CONTACT.hours}</p>
                </div>
              </div>

              <div className="gt-contact-card">
                <div className="gt-contact-icon" style={{ background: "#e7f9ee" }}>💬</div>
                <div>
                  <h2 className="gt-contact-title">WhatsApp</h2>
                  <a
                    href={whatsappHref("Hi Gadvede Trekkers! I'd like more details.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gt-contact-link d-block"
                  >
                    Chat on +91 {CONTACT.whatsapp.slice(-10)}
                  </a>
                  <p className="gt-contact-meta">Fastest way to check dates, availability and booking.</p>
                </div>
              </div>

              <div className="gt-contact-card">
                <div className="gt-contact-icon">✉️</div>
                <div>
                  <h2 className="gt-contact-title">Email</h2>
                  <a href={`mailto:${CONTACT.email}`} className="gt-contact-link d-block">
                    {CONTACT.email}
                  </a>
                  <a href={`mailto:${CONTACT.supportEmail}`} className="gt-contact-link d-block">
                    {CONTACT.supportEmail}
                  </a>
                  <p className="gt-contact-meta">For bookings, cancellations and invoices.</p>
                </div>
              </div>

              <div className="gt-contact-card">
                <div className="gt-contact-icon">📍</div>
                <div>
                  <h2 className="gt-contact-title">Our office</h2>
                  <p className="mb-0" style={{ color: "#294151", lineHeight: 1.6 }}>
                    {CONTACT.addressLines.join(", ")}
                  </p>
                  <p className="gt-contact-meta">
                    Looking for refund rules? See our <Link to="/cancellation-policy">Cancellation Policy</Link> or{" "}
                    <Link to="/faq">FAQ</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ENQUIRY FORM */}
          <div className="col-lg-7">
            <div className="gt-contact-form-card">
              <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#0c3224" }}>
                Send an enquiry
              </h2>
              <p className="mb-4" style={{ color: "#5e7a8a", fontSize: "0.92rem" }}>
                Share a few details and we'll call or WhatsApp you back.
              </p>

              {submitted ? (
                <div
                  role="status"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 22px" }}
                >
                  <div className="fw-bold mb-1" style={{ color: BRAND_DARK, fontSize: "1.05rem" }}>
                    ✅ Thanks, {form.name.trim().split(" ")[0]}! Your enquiry has been received.
                  </div>
                  <p className="mb-3" style={{ color: "#294151" }}>
                    Tap “Open WhatsApp” if it didn't open automatically, so you can send your details instantly. Our team will contact you on{" "}
                    <strong>{form.phone}</strong> shortly.
                  </p>
                  <a
                    href={whatsappHref(waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn fw-bold me-2 mb-2"
                    style={{ background: "#25d366", color: "#fff", borderRadius: 10, border: "none" }}
                  >
                    💬 Open WhatsApp
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline-success fw-semibold mb-2"
                    style={{ borderRadius: 10 }}
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", phone: "", email: "", interest: "Trek", message: "" });
                    }}
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="ct-name" className="form-label fw-semibold">Full name *</label>
                      <input id="ct-name" type="text" className="form-control" value={form.name} onChange={set("name")} style={inputStyle(errors.name)} autoComplete="name" />
                      {errors.name && <div className="small text-danger mt-1">{errors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="ct-phone" className="form-label fw-semibold">Mobile number *</label>
                      <input id="ct-phone" type="tel" inputMode="numeric" className="form-control" value={form.phone} onChange={set("phone")} style={inputStyle(errors.phone)} autoComplete="tel" placeholder="10-digit number" />
                      {errors.phone && <div className="small text-danger mt-1">{errors.phone}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="ct-email" className="form-label fw-semibold">Email (optional)</label>
                      <input id="ct-email" type="email" className="form-control" value={form.email} onChange={set("email")} style={inputStyle(errors.email)} autoComplete="email" />
                      {errors.email && <div className="small text-danger mt-1">{errors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="ct-interest" className="form-label fw-semibold">Interested in</label>
                      <select id="ct-interest" className="form-select" value={form.interest} onChange={set("interest")} style={inputStyle(false)}>
                        {INTERESTS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label htmlFor="ct-message" className="form-label fw-semibold">Message *</label>
                      <textarea id="ct-message" rows={4} className="form-control" value={form.message} onChange={set("message")} style={inputStyle(errors.message)} placeholder="Which trek/tour, preferred dates, group size…" />
                      {errors.message && <div className="small text-danger mt-1">{errors.message}</div>}
                    </div>
                  </div>

                  {errors.form && <div className="alert alert-danger mt-3 mb-0 py-2">{errors.form}</div>}

                  <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                    <button
                      type="submit"
                      className="btn fw-bold"
                      disabled={submitting}
                      style={{ background: BRAND, color: "#fff", borderRadius: 12, padding: "12px 26px", border: "none" }}
                    >
                      {submitting ? "Sending…" : "Send enquiry"}
                    </button>
                    <span className="small" style={{ color: "#5e7a8a" }}>
                      Prefer to talk? <a href={telHref(CONTACT.phones[0])}>Call {CONTACT.phones[0]}</a>
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
