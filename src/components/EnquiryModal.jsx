import { useState, useEffect } from "react";
import { handleWhatsAppLead } from "../utils/leadActions";
import { getWhatsappNumber } from "../config/whatsappSetting";


export default function EnquiryModal({ dest, category = "Industrial Visit", onClose }) {
  const [form, setForm] = useState({ name: "", contact: "", email: "", pax: "", date: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiNotice, setApiNotice] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.contact.trim() || !/^\d{10}$/.test(form.contact.trim()))
      e.contact = "Enter a valid 10-digit number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (!form.pax || Number(form.pax) < 1) e.pax = "Enter number of travellers";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setSubmitting(true);
      const result = await handleWhatsAppLead({
        phoneNumber: getWhatsappNumber(),
        packageName: dest.title,
        location: dest.title.split("–")[0].trim(),
        category,
        source: "Website",
        customerName: form.name.trim(),
        customerPhone: form.contact.trim(),
        customerEmail: form.email.trim(),
        pax: Number(form.pax),
        preferredDate: form.date || "Flexible",
        openWhatsApp: true,
      });
      if (!result?.apiResult?.ok) {
        setApiNotice("Lead saved locally. External sync is delayed, but your enquiry is recorded.");
      }
      setSubmitted(true);
    } catch (error) {
      setErrors({
        form: error?.message || "Something went wrong while saving the enquiry. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="enq-modal-animate">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerLabel}>Enquire About</div>
            <div style={styles.headerTitle}>{dest.icon} {dest.title}</div>
            <div style={styles.headerSub}>{dest.subtitle}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">✕</button>
        </div>

        {/* Meta pills */}
        <div style={styles.pills}>
          <span style={styles.pill}>⏱ {dest.duration}</span>
          <span style={{ ...styles.pill, background: "#f0fdf4", color: "#065f46", borderColor: "#bbf7d0" }}>
            🎓 {dest.bestFor.split("&")[0].trim()}
          </span>
        </div>

        {submitted ? (
          <div style={styles.success}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#065f46", marginBottom: 6 }}>
              Enquiry Submitted!
            </div>
            <div style={{ fontSize: "0.85rem", color: "#374151" }}>
              Redirecting you to WhatsApp to connect with our team…
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "0 20px 20px" }}>
            {errors.form && (
              <div style={{ marginBottom: 12, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontSize: "0.78rem" }}>
                {errors.form}
              </div>
            )}
            <Field label="Your Name *" error={errors.name}>
              <input style={inputStyle(errors.name)} placeholder="e.g. Rahul Sharma" value={form.name} onChange={set("name")} />
            </Field>
            <Field label="Contact Number *" error={errors.contact}>
              <input style={inputStyle(errors.contact)} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} value={form.contact} onChange={set("contact")} />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input style={inputStyle(errors.email)} type="email" placeholder="e.g. team@college.edu" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Number of Travellers (PAX) *" error={errors.pax}>
              <input style={inputStyle(errors.pax)} type="number" min={1} placeholder="e.g. 45" value={form.pax} onChange={set("pax")} />
            </Field>
            <Field label="Preferred Travel Date">
              <input style={inputStyle()} type="date" value={form.date} onChange={set("date")} min={new Date().toISOString().split("T")[0]} />
            </Field>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Submitting..." : "Send Enquiry & Chat on WhatsApp 💬"}
            </button>
            {apiNotice && (
              <div style={{ marginTop: 10, fontSize: "0.74rem", color: "#475569" }}>{apiNotice}</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: "0.72rem", color: "#dc2626", marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function inputStyle(error) {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px", borderRadius: 8, fontSize: "0.88rem",
    border: `1.5px solid ${error ? "#dc2626" : "#d1d5db"}`,
    outline: "none", color: "#111827", background: "#fff",
    transition: "border-color 0.2s",
  };
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
    boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
    maxHeight: "90vh", overflowY: "auto",
  },
  header: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "20px 20px 14px",
    background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)",
    borderRadius: "20px 20px 0 0",
    gap: 12,
  },
  headerLabel: { fontSize: "0.7rem", color: "#bfdbfe", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  headerTitle: { fontSize: "1rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 },
  headerSub: { fontSize: "0.78rem", color: "#93c5fd", marginTop: 3 },
  closeBtn: {
    background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
    borderRadius: "50%", width: 30, height: 30, cursor: "pointer",
    fontSize: "0.85rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  },
  pills: { display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 20px 4px" },
  pill: {
    background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
    borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600,
  },
  submitBtn: {
    width: "100%", padding: "12px", marginTop: 4,
    background: "linear-gradient(135deg,#059669,#10b981)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  success: {
    textAlign: "center", padding: "32px 20px",
  },
};
