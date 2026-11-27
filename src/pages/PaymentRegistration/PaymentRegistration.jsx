import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentRegistrationsApi } from "../../api/paymentRegistrations.api";
import { compressImageToJpeg } from "../../utils/compressImage";
import { trackEvent } from "../../analytics/tracking";
import { waUrl } from "../../config/whatsappSetting";
import {
  GENDERS,
  INDIAN_MOBILE_RE,
  MAX_PARTICIPANTS,
  OTHER_DATE,
  PAYMENT_MODES,
  datesForOption,
  normalizeIndianMobile,
} from "../../../shared/registrationOptions.js";
import "./PaymentRegistration.css";

/**
 * /register — "Already paid by bank transfer / UPI? Register here" (Pratik, t81u).
 * Event, package/departure, date and pickup come from GET /api/payment-registrations/events (the same DB data the
 * trip pages use). Price per person comes from the chosen package; total = price × participants (read-only).
 * The server re-checks everything and recomputes the price. Submissions are saved as "pending verification".
 */
const QUERY_NUMBER = "9856112727";
const QUERY_NUMBER_DISPLAY = "+91 98561 12727";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTR_RE = /^[A-Za-z0-9][A-Za-z0-9/-]{3,39}$/;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const todayIst = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const emptyParticipant = () => ({ name: "", age: "", gender: "", mobile: "" });

const INITIAL = {
  eventSlug: "", priceOption: "", dateValue: "", otherDate: "", pickupPoint: "",
  fullName: "", mobile: "", whatsappSameAsMobile: true, whatsapp: "", email: "", age: "", gender: "", city: "",
  emergencyName: "", emergencyPhone: "", medicalConditions: "",
  participantsCount: 1, participants: [],
  amountPaid: "", amountTouched: false, paymentDate: todayIst(), paymentMode: "UPI", utr: "", notes: "",
  consent: false, website: "",
};

function Field({ label, error, hint, children, full = false, required = false }) {
  return (
    <label className={`preg-field${full ? " preg-field--full" : ""}${error ? " preg-field--error" : ""}`}>
      <span className="preg-label">{label}{required ? <em aria-hidden="true"> *</em> : null}</span>
      {children}
      {hint && !error ? <small className="preg-hint">{hint}</small> : null}
      {error ? <small className="preg-error" role="alert">{error}</small> : null}
    </label>
  );
}

function validateClient(f, { selectedOption, screenshot }) {
  const e = {};
  if (!f.eventSlug) e.eventSlug = "Please choose the event you paid for.";
  if (f.eventSlug && !selectedOption) e.priceOption = "Please choose the package / departure.";
  if (selectedOption && !f.dateValue) e.dateValue = "Please choose the trip date.";
  if (f.dateValue === OTHER_DATE && !f.otherDate) e.otherDate = "Enter the trip date you booked.";
  if (selectedOption && !f.pickupPoint) e.pickupPoint = "Please choose your pickup point.";
  if (f.fullName.trim().length < 2) e.fullName = "Enter your full name.";
  const mobile = normalizeIndianMobile(f.mobile);
  if (!INDIAN_MOBILE_RE.test(mobile)) e.mobile = "Enter a valid 10-digit mobile number.";
  if (!f.whatsappSameAsMobile && !INDIAN_MOBILE_RE.test(normalizeIndianMobile(f.whatsapp))) e.whatsapp = "Enter a valid 10-digit WhatsApp number.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  const age = Number(f.age);
  if (!Number.isInteger(age) || age < 5 || age > 90) e.age = "Enter your age (5–90).";
  if (!f.gender) e.gender = "Choose gender.";
  if (f.city.trim().length < 2) e.city = "Enter your city.";
  if (f.emergencyName.trim().length < 2) e.emergencyName = "Enter an emergency contact name.";
  const emergency = normalizeIndianMobile(f.emergencyPhone);
  if (!INDIAN_MOBILE_RE.test(emergency)) e.emergencyPhone = "Enter a valid 10-digit number.";
  else if (emergency === mobile) e.emergencyPhone = "Use a different number from yours.";
  f.participants.slice(0, f.participantsCount - 1).forEach((p, i) => {
    if (p.name.trim().length < 2) e[`participants.${i}.name`] = "Enter name.";
    const a = Number(p.age);
    if (!Number.isInteger(a) || a < 1 || a > 90) e[`participants.${i}.age`] = "Enter age.";
    if (!p.gender) e[`participants.${i}.gender`] = "Choose gender.";
    if (p.mobile && !INDIAN_MOBILE_RE.test(normalizeIndianMobile(p.mobile))) e[`participants.${i}.mobile`] = "10-digit number.";
  });
  const paid = Number(String(f.amountPaid).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(paid) || paid < 1) e.amountPaid = "Enter the amount you paid.";
  if (!f.paymentDate || f.paymentDate > todayIst()) e.paymentDate = "Enter the payment date (not in the future).";
  if (!UTR_RE.test(f.utr.replace(/\s/g, ""))) e.utr = f.paymentMode === "Cash" ? "Enter the receipt number you were given." : "Enter the UTR / transaction reference number.";
  if (f.paymentMode !== "Cash" && !screenshot) e.screenshot = "Upload the payment screenshot.";
  if (!f.consent) e.consent = "Please accept the terms and cancellation policy.";
  return e;
}

export default function PaymentRegistration() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [screenshot, setScreenshot] = useState(null); // { dataUrl, bytes, name }
  const [shotBusy, setShotBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const openedAt = useRef(Date.now());
  const formRef = useRef(null);

  useEffect(() => {
    document.title = "Register Your Payment | Gadvede Trekkers";
    let robots = document.head.querySelector('meta[name="robots"]');
    const before = robots?.getAttribute("content") ?? null;
    if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", "noindex, follow");
    return () => { if (before == null) robots.remove(); else robots.setAttribute("content", before); };
  }, []);

  const loadEvents = () => {
    setLoadError("");
    setEvents(null);
    paymentRegistrationsApi.events()
      .then((list) => setEvents(Array.isArray(list) ? list : []))
      .catch(() => setLoadError("Could not load events right now."));
  };
  useEffect(loadEvents, []);

  // Pre-select ?event=<slug> (link from a trip page).
  useEffect(() => {
    const slug = searchParams.get("event");
    if (!events || !slug || form.eventSlug) return;
    if (events.some((e) => e.slug === slug)) chooseEvent(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const event = useMemo(() => events?.find((e) => e.slug === form.eventSlug) || null, [events, form.eventSlug]);
  const selectedOption = event?.priceOptions.find((o) => o.key === form.priceOption) || null;
  const dateChoices = event && selectedOption ? datesForOption(event, selectedOption.key) : [];
  const pickupChoices = event && selectedOption ? event.pickupsByOption[selectedOption.key] || [] : [];
  const pricePerPerson = selectedOption?.price || 0;
  const total = pricePerPerson * form.participantsCount;

  const grouped = useMemo(() => {
    const groups = new Map();
    (events || []).forEach((e) => { if (!groups.has(e.typeLabel)) groups.set(e.typeLabel, []); groups.get(e.typeLabel).push(e); });
    return [...groups.entries()];
  }, [events]);

  const clearErr = (...keys) => setErrors((prev) => { const next = { ...prev }; keys.forEach((k) => delete next[k]); return next; });
  const set = (key) => (ev) => {
    const value = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === "amountPaid" ? { amountTouched: true } : {}) }));
    clearErr(key);
  };

  function chooseEvent(slug) {
    const next = events?.find((e) => e.slug === slug);
    const onlyOption = next?.priceOptions.length === 1 ? next.priceOptions[0] : null;
    setForm((f) => ({ ...f, eventSlug: slug, priceOption: onlyOption?.key || "", dateValue: "", otherDate: "", pickupPoint: onlyOption ? autoPickup(next, onlyOption.key) : "" }));
    clearErr("eventSlug", "priceOption", "dateValue", "pickupPoint");
  }
  function autoPickup(ev, key) {
    const list = ev?.pickupsByOption[key] || [];
    return list.length === 1 ? list[0] : "";
  }
  function chooseOption(key) {
    setForm((f) => {
      const stillValid = event && datesForOption(event, key).some((d) => d.value === f.dateValue);
      return { ...f, priceOption: key, dateValue: stillValid || f.dateValue === OTHER_DATE ? f.dateValue : "", pickupPoint: autoPickup(event, key) };
    });
    clearErr("priceOption", "pickupPoint");
  }
  function setCount(n) {
    const count = Math.min(MAX_PARTICIPANTS, Math.max(1, n));
    setForm((f) => {
      const participants = [...f.participants];
      while (participants.length < count - 1) participants.push(emptyParticipant());
      return { ...f, participantsCount: count, participants };
    });
  }
  const setParticipant = (i, key) => (ev) => {
    const value = ev.target.value;
    setForm((f) => ({ ...f, participants: f.participants.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)) }));
    clearErr(`participants.${i}.${key}`);
  };

  // Amount paid follows the total until the customer edits it (advance payments are allowed).
  useEffect(() => {
    if (!form.amountTouched) setForm((f) => ({ ...f, amountPaid: total ? String(total) : "" }));
  }, [total, form.amountTouched]);

  async function onScreenshot(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setShotBusy(true);
    clearErr("screenshot");
    try {
      const out = await compressImageToJpeg(file);
      setScreenshot({ ...out, name: file.name });
    } catch (e) {
      setScreenshot(null);
      setErrors((prev) => ({ ...prev, screenshot: e.message }));
    } finally {
      setShotBusy(false);
    }
  }

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector(".preg-field--error, .preg-consent--error");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector("input, select, textarea")?.focus({ preventScroll: true });
    });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setFormError("");
    const clientErrors = validateClient(form, { selectedOption, screenshot });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) { setFormError("Please fix the highlighted fields."); scrollToFirstError(); return; }
    setSubmitting(true);
    try {
      const data = await paymentRegistrationsApi.submit({
        eventSlug: form.eventSlug, priceOption: form.priceOption, dateValue: form.dateValue, otherDate: form.otherDate,
        pickupPoint: form.pickupPoint, fullName: form.fullName, mobile: form.mobile,
        whatsappSameAsMobile: form.whatsappSameAsMobile, whatsapp: form.whatsapp, email: form.email,
        age: Number(form.age), gender: form.gender, city: form.city, emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone, medicalConditions: form.medicalConditions,
        participantsCount: form.participantsCount,
        participants: form.participants.slice(0, form.participantsCount - 1).map((p) => ({ ...p, age: Number(p.age) })),
        amountPaid: form.amountPaid, paymentDate: form.paymentDate, paymentMode: form.paymentMode, utr: form.utr,
        screenshot: screenshot?.dataUrl || "", notes: form.notes, consent: form.consent === true,
        website: form.website, formOpenMs: Date.now() - openedAt.current,
      });
      setResult({ ...data, fullName: form.fullName.trim(), email: form.email.trim() });
      // GA4: event + package only. Never the name, phone, email, UTR or reference number.
      trackEvent("payment_registration_submit", {
        form_name: "payment_registration",
        item_id: form.eventSlug,
        item_name: event?.name || "",
        participants: Number(form.participantsCount) || 1,
        currency: "INR",
        ...(Number(form.amountPaid) > 0 ? { value: Number(form.amountPaid) } : {}),
      });
      document.documentElement.scrollTop = 0; // the site scrolls <body>, not window (see ScrollToTop.jsx)
      document.body.scrollTop = 0;
    } catch (e) {
      setErrors(e.errors || {});
      setFormError(e.message);
      if (e.errors && Object.keys(e.errors).length) scrollToFirstError();
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const waMessage = `Hi Gadvede Trekkers, I registered my payment. Reference: ${result.reference} (${result.eventName}${result.batchDate ? `, ${result.batchDate}` : ""}).`;
    return (
      <section className="preg-page">
        <div className="preg-wrap">
          <div className="preg-card preg-success" role="status">
            <div className="preg-success-icon" aria-hidden="true">✓</div>
            <h1>Payment details received</h1>
            <p className="preg-muted">Thank you, {result.fullName}. Our team will check the payment with the bank and confirm your seat on WhatsApp.</p>
            <div className="preg-ref">
              <span>Your reference number</span>
              <strong data-testid="preg-reference">{result.reference}</strong>
              <button type="button" className="preg-btn preg-btn--ghost" onClick={() => { navigator.clipboard?.writeText(result.reference); setCopied(true); }}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <dl className="preg-summary">
              <div><dt>Event</dt><dd>{result.eventName}</dd></div>
              <div><dt>Date</dt><dd>{result.batchLabel?.startsWith("Other") ? result.batchDate : result.batchLabel}</dd></div>
              <div><dt>Package</dt><dd>{result.priceOptionLabel}</dd></div>
              <div><dt>Pickup</dt><dd>{result.pickupPoint}</dd></div>
              <div><dt>Participants</dt><dd>{result.participantsCount} × {inr(result.pricePerPerson)} = {inr(result.totalAmount)}</dd></div>
              <div><dt>Amount paid</dt><dd>{inr(result.amountPaid)}</dd></div>
              <div><dt>Status</dt><dd><span className="preg-badge">Pending verification</span></dd></div>
            </dl>
            <p className="preg-muted">We are emailing a copy to <strong>{result.email}</strong> (check Spam / Promotions if you don't see it in a few minutes).</p>
            <p className="preg-muted">Please keep this reference number. For any query, WhatsApp or call us on <a href={`tel:+91${QUERY_NUMBER}`}>{QUERY_NUMBER_DISPLAY}</a>.</p>
            <div className="preg-actions">
              <a className="preg-btn preg-btn--wa" href={waUrl(waMessage)} target="_blank" rel="noopener noreferrer">WhatsApp {QUERY_NUMBER_DISPLAY}</a>
              <Link className="preg-btn preg-btn--ghost" to="/">Back to home</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="preg-page">
      <div className="preg-wrap">
        <header className="preg-hero">
          <span className="preg-kicker">Already paid?</span>
          <h1>Register your bank transfer / UPI payment</h1>
          <p>Paid the fees directly to our account? Fill this form so we can match your payment and confirm your seat. Takes about 3 minutes.</p>
        </header>

        <form ref={formRef} className="preg-form" onSubmit={onSubmit} noValidate>
          {/* Honeypot: hidden from people, bots fill it. */}
          <div className="preg-hp" aria-hidden="true">
            <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
          </div>

          <div className="preg-card">
            <h2><span className="preg-step">1</span>Event, date &amp; pickup</h2>
            {loadError ? (
              <div className="preg-alert">
                {loadError} <button type="button" className="preg-link-btn" onClick={loadEvents}>Try again</button> or WhatsApp us on {QUERY_NUMBER_DISPLAY}.
              </div>
            ) : null}
            <div className="preg-grid">
              <Field label="Event" required full error={errors.eventSlug}>
                <select value={form.eventSlug} onChange={(e) => chooseEvent(e.target.value)} disabled={!events} data-testid="preg-event">
                  <option value="">{events ? "Select the event you paid for" : "Loading events…"}</option>
                  {grouped.map(([label, list]) => (
                    <optgroup key={label} label={`${label}s`}>
                      {list.map((e) => <option key={e.slug} value={e.slug}>{e.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>

              {event ? (
                <div className={`preg-field preg-field--full${errors.priceOption ? " preg-field--error" : ""}`}>
                  <span className="preg-label">Package / departure<em aria-hidden="true"> *</em></span>
                  <div className="preg-options" role="radiogroup">
                    {event.priceOptions.map((o) => (
                      <label key={o.key} className={`preg-option${form.priceOption === o.key ? " preg-option--on" : ""}`}>
                        <input type="radio" name="priceOption" value={o.key} checked={form.priceOption === o.key} onChange={() => chooseOption(o.key)} />
                        <span className="preg-option-label">{o.label}</span>
                        <strong>{inr(o.price)}<small>/person</small></strong>
                      </label>
                    ))}
                  </div>
                  {errors.priceOption ? <small className="preg-error" role="alert">{errors.priceOption}</small> : null}
                </div>
              ) : null}

              {selectedOption ? (
                <>
                  <Field label="Trip date" required full error={errors.dateValue} hint={dateChoices.length ? "" : "No dates are listed for this event yet. Choose “Other date”."}>
                    <select value={form.dateValue} onChange={set("dateValue")} data-testid="preg-date">
                      <option value="">Select date</option>
                      {dateChoices.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      <option value={OTHER_DATE}>Other date (not listed)</option>
                    </select>
                  </Field>
                  {form.dateValue === OTHER_DATE ? (
                    <Field label="Enter trip date" required error={errors.otherDate}>
                      <input type="date" value={form.otherDate} min={todayIst()} onChange={set("otherDate")} />
                    </Field>
                  ) : null}
                  <Field label="Pickup point" required full error={errors.pickupPoint}>
                    <select value={form.pickupPoint} onChange={set("pickupPoint")} data-testid="preg-pickup">
                      <option value="">Select pickup point</option>
                      {pickupChoices.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </>
              ) : null}
            </div>
            {selectedOption ? (
              <div className="preg-price-line">
                <span>Price per person</span><strong data-testid="preg-ppp">{inr(pricePerPerson)}</strong>
              </div>
            ) : null}
          </div>

          <div className="preg-card">
            <h2><span className="preg-step">2</span>Your details</h2>
            <div className="preg-grid">
              <Field label="Full name" required full error={errors.fullName}>
                <input type="text" autoComplete="name" value={form.fullName} onChange={set("fullName")} placeholder="As on your ID" />
              </Field>
              <Field label="Mobile number" required error={errors.mobile}>
                <div className="preg-phone"><span>+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile" /></div>
              </Field>
              <div className="preg-field">
                <span className="preg-label">WhatsApp number<em aria-hidden="true"> *</em></span>
                <label className="preg-check"><input type="checkbox" checked={form.whatsappSameAsMobile} onChange={set("whatsappSameAsMobile")} /> Same as mobile</label>
                {!form.whatsappSameAsMobile ? (
                  <div className={`preg-phone${errors.whatsapp ? " preg-phone--error" : ""}`}><span>+91</span><input type="tel" inputMode="numeric" maxLength={14} value={form.whatsapp} onChange={set("whatsapp")} placeholder="10-digit WhatsApp" /></div>
                ) : null}
                {errors.whatsapp ? <small className="preg-error" role="alert">{errors.whatsapp}</small> : null}
              </div>
              <Field label="Email" required error={errors.email}>
                <input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </Field>
              <Field label="City" required error={errors.city}>
                <input type="text" autoComplete="address-level2" value={form.city} onChange={set("city")} placeholder="e.g. Pune" />
              </Field>
              <Field label="Age" required error={errors.age}>
                <input type="number" inputMode="numeric" min={5} max={90} value={form.age} onChange={set("age")} />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Emergency contact name" required error={errors.emergencyName}>
                <input type="text" value={form.emergencyName} onChange={set("emergencyName")} placeholder="Parent / friend" />
              </Field>
              <Field label="Emergency contact number" required error={errors.emergencyPhone}>
                <div className="preg-phone"><span>+91</span><input type="tel" inputMode="numeric" maxLength={14} value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="10-digit mobile" /></div>
              </Field>
              <Field label="Medical conditions (optional)" full hint="Asthma, allergies, recent injuries — helps our trek leaders.">
                <textarea rows={2} maxLength={500} value={form.medicalConditions} onChange={set("medicalConditions")} />
              </Field>
            </div>
          </div>

          <div className="preg-card">
            <h2><span className="preg-step">3</span>Participants</h2>
            <div className="preg-counter">
              <span>Total people (including you)</span>
              <div className="preg-stepper">
                <button type="button" aria-label="Fewer participants" onClick={() => setCount(form.participantsCount - 1)} disabled={form.participantsCount <= 1}>−</button>
                <output data-testid="preg-count">{form.participantsCount}</output>
                <button type="button" aria-label="More participants" onClick={() => setCount(form.participantsCount + 1)} disabled={form.participantsCount >= MAX_PARTICIPANTS}>+</button>
              </div>
            </div>
            {form.participants.slice(0, form.participantsCount - 1).map((p, i) => (
              <fieldset className="preg-participant" key={i}>
                <legend>Participant {i + 2}</legend>
                <div className="preg-grid">
                  <Field label="Name" required full error={errors[`participants.${i}.name`]}>
                    <input type="text" value={p.name} onChange={setParticipant(i, "name")} />
                  </Field>
                  <Field label="Age" required error={errors[`participants.${i}.age`]}>
                    <input type="number" inputMode="numeric" min={1} max={90} value={p.age} onChange={setParticipant(i, "age")} />
                  </Field>
                  <Field label="Gender" required error={errors[`participants.${i}.gender`]}>
                    <select value={p.gender} onChange={setParticipant(i, "gender")}>
                      <option value="">Select</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Mobile (optional)" full error={errors[`participants.${i}.mobile`]}>
                    <div className="preg-phone"><span>+91</span><input type="tel" inputMode="numeric" maxLength={14} value={p.mobile} onChange={setParticipant(i, "mobile")} /></div>
                  </Field>
                </div>
              </fieldset>
            ))}
          </div>

          <div className="preg-card">
            <h2><span className="preg-step">4</span>Payment details</h2>
            <div className="preg-total" aria-live="polite">
              <div>
                <span>Total amount</span>
                <small>{selectedOption ? `${form.participantsCount} × ${inr(pricePerPerson)}` : "Choose the event and package first"}</small>
              </div>
              <strong data-testid="preg-total">{inr(total)}</strong>
            </div>
            <div className="preg-grid">
              <Field label="Amount paid" required error={errors.amountPaid} hint={form.amountPaid && total && Number(form.amountPaid) < total ? `Advance — balance ${inr(total - Number(form.amountPaid))}` : ""}>
                <div className="preg-phone"><span>₹</span><input type="number" inputMode="numeric" min={1} value={form.amountPaid} onChange={set("amountPaid")} /></div>
              </Field>
              <Field label="Payment date" required error={errors.paymentDate}>
                <input type="date" max={todayIst()} value={form.paymentDate} onChange={set("paymentDate")} />
              </Field>
              <div className="preg-field preg-field--full">
                <span className="preg-label">Payment mode<em aria-hidden="true"> *</em></span>
                <div className="preg-chips" role="radiogroup">
                  {PAYMENT_MODES.map((m) => (
                    <label key={m} className={`preg-chip${form.paymentMode === m ? " preg-chip--on" : ""}`}>
                      <input type="radio" name="paymentMode" value={m} checked={form.paymentMode === m} onChange={set("paymentMode")} />{m}
                    </label>
                  ))}
                </div>
              </div>
              <Field label={form.paymentMode === "Cash" ? "Receipt number" : "UTR / transaction reference number"} required full error={errors.utr}
                hint={form.paymentMode === "UPI" ? "12-digit UPI reference (UTR) shown in your UPI app's payment details." : form.paymentMode === "Cash" ? "" : "UTR / reference number from your bank's transfer receipt."}>
                <input type="text" autoCapitalize="characters" autoComplete="off" maxLength={40} value={form.utr} onChange={set("utr")} placeholder="e.g. 612345678901" />
              </Field>
              <div className={`preg-field preg-field--full${errors.screenshot ? " preg-field--error" : ""}`}>
                <span className="preg-label">Payment screenshot{form.paymentMode !== "Cash" ? <em aria-hidden="true"> *</em> : " (optional)"}</span>
                <label className="preg-upload">
                  <input type="file" accept="image/*" onChange={onScreenshot} data-testid="preg-file" />
                  {screenshot ? (
                    <span className="preg-upload-done">
                      <img src={screenshot.dataUrl} alt="Payment screenshot preview" />
                      <span><strong>Screenshot added</strong><small>{Math.round(screenshot.bytes / 1024)} KB · tap to change</small></span>
                    </span>
                  ) : (
                    <span className="preg-upload-empty">{shotBusy ? "Processing…" : "📎 Tap to upload screenshot (JPG/PNG, max 10 MB)"}</span>
                  )}
                </label>
                <small className="preg-hint">Location and camera details are removed from the photo before upload.</small>
                {errors.screenshot ? <small className="preg-error" role="alert">{errors.screenshot}</small> : null}
              </div>
              <Field label="Notes (optional)" full>
                <textarea rows={2} maxLength={1000} value={form.notes} onChange={set("notes")} placeholder="Anything we should know (paid from a friend's account, coupon used, etc.)" />
              </Field>
            </div>
          </div>

          <div className={`preg-card preg-consent${errors.consent ? " preg-consent--error" : ""}`}>
            <label className="preg-check">
              <input type="checkbox" checked={form.consent} onChange={set("consent")} />
              <span>I confirm these details are correct and I agree to the <Link to="/cancellation-policy" target="_blank">terms &amp; cancellation policy</Link> and <Link to="/privacy-policy" target="_blank">privacy policy</Link>.</span>
            </label>
            {errors.consent ? <small className="preg-error" role="alert">{errors.consent}</small> : null}
          </div>

          {formError ? <div className="preg-alert" role="alert">{formError}</div> : null}
          <button type="submit" className="preg-btn preg-btn--primary preg-submit" disabled={submitting || shotBusy}>
            {submitting ? "Submitting…" : "Submit payment details"}
          </button>
          <p className="preg-muted preg-center">Questions? WhatsApp / call <a href={`tel:+91${QUERY_NUMBER}`}>{QUERY_NUMBER_DISPLAY}</a></p>
        </form>
      </div>
    </section>
  );
}
