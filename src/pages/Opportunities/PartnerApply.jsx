import { useState } from "react";

const ROLES = [
  "Trek Leader",
  "Local Guide",
  "Photographer",
  "Content Creator",
  "Social Media Manager",
  "Driver / Transport",
  "Cook / Catering",
  "Medical Staff",
  "Other",
];

const EMPTY = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  role: ROLES[0],
  experience: "",
  about: "",
  resumeFile: null,
};

export default function PartnerApply() {
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.about.trim()) e.about = "Please tell us about yourself";
    return e;
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setForm((f) => ({
        ...f,
        resumeFile: { name: file.name, type: file.type, data: ev.target.result },
      }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const applications = JSON.parse(localStorage.getItem("gt_partner_applications") || "[]");
    applications.unshift({
      id: `PARTNER-${Date.now()}`,
      ...form,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
    });
    localStorage.setItem("gt_partner_applications", JSON.stringify(applications));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="vr-page">
        <div className="container py-5">
          <div className="vr-success">
            <div className="vr-success-icon">✅</div>
            <h2>Application Submitted!</h2>
            <p>
              Thank you, <strong>{form.fullName}</strong>! We've received your application for{" "}
              <strong>{form.role}</strong>. Our team will reach out within 3–5 business days.
            </p>
            <button
              className="btn btn-success mt-3"
              onClick={() => { setForm(EMPTY); setSubmitted(false); setErrors({}); }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="vr-page">
      <div className="container py-5">
        <div className="vr-hero mb-5">
          <span className="vr-kicker">Join Our Team</span>
          <h1>Join Our Team</h1>
          <p>
            Join the Gadvede Trekkers community as a trek leader, guide, photographer, or
            content creator. Share your passion for the outdoors with fellow adventurers.
          </p>
        </div>

        <div className="vr-form-card">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                <input
                  className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
                {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">City</label>
                <input
                  className="form-control"
                  placeholder="e.g. Pune, Mumbai"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Role You're Applying For</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Years of Experience</label>
                <input
                  className="form-control"
                  placeholder="e.g. 3 years as a trek leader"
                  value={form.experience}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  About Yourself <span className="text-danger">*</span>
                </label>
                <textarea
                  className={`form-control ${errors.about ? "is-invalid" : ""}`}
                  rows={4}
                  placeholder="Tell us about your experience, skills, and why you want to join Gadvede Trekkers..."
                  value={form.about}
                  onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                />
                {errors.about && <div className="invalid-feedback">{errors.about}</div>}
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Upload Resume / CV</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleResumeChange}
                />
                {form.resumeFile && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <span className="badge bg-success">✓ {form.resumeFile.name}</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-danger"
                      onClick={() => setForm((f) => ({ ...f, resumeFile: null }))}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="form-text">Accepted: PDF, Word doc, or image. Max 5MB.</div>
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-success px-5 py-2 fw-semibold">
                  Submit Application →
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
