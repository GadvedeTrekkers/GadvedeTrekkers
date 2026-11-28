/**
 * Admin → Profile Setup (Pratik t84u: "In crm generate new feature Profile setup…", t85u: "And other required fields").
 * One business profile: company, owner, address, logo, theme, purpose emails, WhatsApp, GST/PAN/MTDC, contact,
 * online links, billing & bank, policies, branding.
 * Required: company name, owner name, primary phone, booking-confirmation email. Everything else optional.
 * Only Super Admin / Admin can open it; WhatsApp, bank/UPI and payment QR are Super Admin only (server enforces both).
 * No delete buttons and no export. Styles live in ProfileSetup.css (kept apart from index.css for the 3D redesign).
 */
import { useEffect, useMemo, useState } from "react";
import { businessProfileApi } from "../api/businessProfile.api";
import { getCurrentAdminUser } from "../data/permissionStorage";
import { compressImageToJpeg } from "../utils/compressImage";
import {
  EMAIL_PURPOSES, IMAGE_KINDS, THEME_PRESETS, emptyProfile, formatWhatsapp, validateProfile, withDefaults,
} from "../../shared/businessProfile.js";
import "./ProfileSetup.css";

const SECTIONS = [
  { id: "ps-company", label: "Company" },
  { id: "ps-business", label: "Business & legal" },
  { id: "ps-contact", label: "Contact" },
  { id: "ps-emails", label: "Emails" },
  { id: "ps-address", label: "Address" },
  { id: "ps-online", label: "Online" },
  { id: "ps-billing", label: "Billing & bank" },
  { id: "ps-policies", label: "Policies" },
  { id: "ps-branding", label: "Logo & theme" },
];
const roleKey = (r) => String(r || "").toLowerCase().replace(/[\s_-]/g, "");
const isProfileAdminRole = (u) => u?.username === "admin" || ["superadmin", "admin"].includes(roleKey(u?.role));

const getIn = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
function setIn(obj, path, value) {
  const keys = path.split(".");
  const copy = { ...obj };
  let cur = copy;
  keys.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys.at(-1)] = value;
  return copy;
}

/** PNG keeps logo transparency; drawing on a canvas drops all metadata (server strips again). */
async function toPngDataUrl(file, { maxSide, maxBytes }) {
  if (!file || !/^image\//.test(file.type || "")) throw new Error("Please choose an image (PNG or JPG).");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image is larger than 10 MB.");
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("This image could not be opened. Use PNG or JPG."); });
  let scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  for (let i = 0; i < 6; i += 1) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * scale));
    c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/png");
    if (Math.floor(((url.length - 22) * 3) / 4) <= maxBytes) { bmp.close?.(); return url; }
    scale *= 0.75;
  }
  bmp.close?.();
  throw new Error("Could not make this image small enough. Try a simpler or smaller image.");
}

function Field({ label, path, errors, required, help, children, wide }) {
  const err = errors[path];
  return (
    <label className={`ps-field ${wide ? "ps-field--wide" : ""} ${err ? "ps-field--error" : ""}`}>
      <span className="ps-label">{label}{required ? <span className="ps-req"> *</span> : null}</span>
      {children}
      {err ? <span className="ps-error" role="alert">{err}</span> : help ? <span className="ps-help">{help}</span> : null}
    </label>
  );
}

function ImagePicker({ kind, value, onUploaded, disabled, note }) {
  const spec = IMAGE_KINDS[kind];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = value?.url || value?.previewUrl || value?.localPreview || "";
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setBusy(true);
    try {
      const dataUrl = spec.format === "png"
        ? await toPngDataUrl(file, spec)
        : (await compressImageToJpeg(file, { maxSide: spec.maxSide, maxBytes: spec.maxBytes * 0.95 })).dataUrl;
      const saved = await businessProfileApi.uploadImage(kind, dataUrl);
      onUploaded({ path: saved.path, url: saved.url || "", previewUrl: saved.previewUrl || "", localPreview: dataUrl });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`ps-image ps-image--${kind}`}>
      <div className="ps-image-preview" aria-label={`${spec.label} preview`}>
        {preview ? <img src={preview} alt={`${spec.label} preview`} /> : <span>No {spec.label.toLowerCase()} yet</span>}
      </div>
      <div className="ps-image-side">
        <div className="ps-label">{spec.label}</div>
        <label className={`ps-btn ps-btn--ghost ${disabled || busy ? "ps-btn--disabled" : ""}`}>
          {busy ? "Uploading…" : preview ? "Replace" : "Upload"}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} disabled={disabled || busy} hidden />
        </label>
        <span className="ps-help">
          {spec.format === "png" ? "PNG or JPG" : "JPG or PNG"}, up to {Math.round(spec.maxBytes / 1024)} KB after resize.
          Location/camera data is removed. {spec.visibility === "private" ? "Private: only admins can see it." : ""}
          {note ? ` ${note}` : ""}
        </span>
        {error ? <span className="ps-error" role="alert">{error}</span> : null}
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  const user = getCurrentAdminUser();
  const allowed = isProfileAdminRole(user);
  const [profile, setProfile] = useState(emptyProfile());
  const [saved, setSaved] = useState(null);
  const [meta, setMeta] = useState({ canEditSensitive: false, nextReceiptNumber: "GT-00001" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!allowed) { setLoading(false); return undefined; }
    let active = true;
    businessProfileApi.get()
      .then((data) => {
        if (!active) return;
        const p = withDefaults(data?.profile || {});
        setProfile(p); setSaved(p);
        setMeta(data?.meta || {});
      })
      .catch((e) => active && setLoadError(e.message || "Could not load the profile"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [allowed]);

  const canSensitive = Boolean(meta.canEditSensitive);
  const dirty = useMemo(() => saved && JSON.stringify(profile) !== JSON.stringify(saved), [profile, saved]);
  const live = useMemo(() => validateProfile(profile, { currentAccountNumber: "000000000" }).errors, [profile]);
  const shownErrors = touched ? { ...live, ...errors } : errors;

  const set = (path) => (e) => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setProfile((p) => setIn(p, path, v));
    setErrors((er) => { const n = { ...er }; delete n[path]; return n; });
    setStatus(null);
  };
  const input = (path, props = {}) => <input className="ps-input" value={getIn(profile, path) ?? ""} onChange={set(path)} {...props} />;

  const save = async () => {
    setTouched(true);
    const errs = validateProfile(profile, { currentAccountNumber: "000000000" }).errors;
    if (Object.keys(errs).length) {
      setStatus({ kind: "error", text: "Please fix the highlighted fields." });
      const first = document.querySelector(".ps-field--error");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      // Send only image references (path/url), never the local preview data URL.
      const images = Object.fromEntries(Object.entries(profile.images).map(([k, v]) => [k, v ? { path: v.path, url: v.url || "" } : null]));
      const data = await businessProfileApi.save({ ...profile, images });
      const p = withDefaults(data?.profile || {});
      setProfile(p); setSaved(p); setMeta(data?.meta || meta); setErrors({});
      setStatus({ kind: "ok", text: "Profile saved." });
    } catch (e) {
      const fieldErrs = { ...(e.errors || {}) };
      (e.fields || []).forEach((f) => { fieldErrs[f] = "Only Super Admin can change this."; });
      setErrors(fieldErrs);
      setStatus({ kind: "error", text: e.message || "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => setProfile((p) => ({ ...p, theme: { ...p.theme, preset: preset.id, primary: preset.primary, accent: preset.accent } }));
  const setColour = (key) => (e) => setProfile((p) => ({ ...p, theme: { ...p.theme, preset: "custom", [key]: e.target.value.toUpperCase() } }));
  const setImage = (kind) => (img) => { setProfile((p) => ({ ...p, images: { ...p.images, [kind]: img } })); setStatus({ kind: "info", text: `${IMAGE_KINDS[kind].label} uploaded. Press Save to use it.` }); };

  if (!allowed) {
    return (
      <div className="adm-page ps-page">
        <div className="adm-page-header"><h3 className="adm-page-title">🏢 Profile Setup</h3></div>
        <div className="ps-card ps-locked">Only a Super Admin or Admin can open Profile Setup.</div>
      </div>
    );
  }

  const sensitiveNote = canSensitive ? null : <span className="ps-lock">🔒 Super Admin only</span>;
  const theme = profile.theme;

  return (
    <div className="adm-page ps-page">
      <div className="adm-page-header ps-header">
        <div>
          <h3 className="adm-page-title">🏢 Profile Setup</h3>
          <p className="ps-sub">Your business details, used on receipts, emails and the website. Fields marked * are required.</p>
        </div>
        {meta.updatedAt ? <span className="ps-updated">Last saved {new Date(meta.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}{meta.updatedBy ? ` by ${meta.updatedBy}` : ""}</span> : null}
      </div>

      <nav className="ps-chips" aria-label="Profile sections">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="ps-chip" onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{s.label}</a>)}
      </nav>

      {loading ? <div className="ps-card">Loading…</div> : null}
      {loadError ? <div className="ps-card ps-banner ps-banner--error">{loadError}</div> : null}

      {!loading ? (
        <div className="ps-layout">
          <div className="ps-main">
            <section id="ps-company" className="ps-card">
              <h4 className="ps-card-title">Company</h4>
              <div className="ps-grid">
                <Field label="Company name" path="companyName" errors={shownErrors} required>{input("companyName", { maxLength: 120, autoComplete: "organization" })}</Field>
                <Field label="Owner name" path="ownerName" errors={shownErrors} required>{input("ownerName", { maxLength: 100, autoComplete: "name" })}</Field>
                <Field label="Brand tagline" path="business.tagline" errors={shownErrors} wide help="Short line shown under your name, e.g. “Treks, tours & camping across the Sahyadris”.">{input("business.tagline", { maxLength: 140 })}</Field>
              </div>
            </section>

            <section id="ps-business" className="ps-card">
              <h4 className="ps-card-title">Business &amp; legal</h4>
              <div className="ps-grid">
                <Field label="Legal / registered name" path="business.legalName" errors={shownErrors} wide>{input("business.legalName", { maxLength: 160 })}</Field>
                <Field label="GSTIN" path="business.gstin" errors={shownErrors} help="15 characters, e.g. 27AAPFU0939F1ZV">{input("business.gstin", { maxLength: 15, className: "ps-input ps-upper", spellCheck: false })}</Field>
                <Field label="PAN" path="business.pan" errors={shownErrors} help="10 characters, e.g. ABCDE1234F">{input("business.pan", { maxLength: 10, className: "ps-input ps-upper", spellCheck: false })}</Field>
                <Field label="MTDC registration number" path="business.mtdcRegistrationNo" errors={shownErrors}>{input("business.mtdcRegistrationNo", { maxLength: 60 })}</Field>
                <Field label="Year established" path="business.yearEstablished" errors={shownErrors}>{input("business.yearEstablished", { inputMode: "numeric", maxLength: 4, placeholder: "e.g. 2016" })}</Field>
              </div>
              <ImagePicker kind="mtdcCertificate" value={profile.images.mtdcCertificate} onUploaded={setImage("mtdcCertificate")} note="Photo or scan of the certificate." />
            </section>

            <section id="ps-contact" className="ps-card">
              <h4 className="ps-card-title">Contact</h4>
              <div className="ps-grid">
                <Field label="Primary phone" path="contact.primaryPhone" errors={shownErrors} required help="10-digit Indian mobile">{input("contact.primaryPhone", { inputMode: "tel", maxLength: 16, autoComplete: "tel" })}</Field>
                <Field label="Alternate phone" path="contact.alternatePhone" errors={shownErrors}>{input("contact.alternatePhone", { inputMode: "tel", maxLength: 16 })}</Field>
                <Field label={<>WhatsApp number {sensitiveNote}</>} path="whatsappNumber" errors={shownErrors} help={`Customers message this number. Now: ${formatWhatsapp(saved?.whatsappNumber || profile.whatsappNumber) || "+91 98561 12727"}`}>
                  <div className="ps-prefix"><span>+91</span>{input("whatsappNumber", { inputMode: "tel", maxLength: 16, disabled: !canSensitive, value: String(profile.whatsappNumber || "").replace(/^91(?=\d{10}$)/, "") })}</div>
                </Field>
                <Field label="Support email (public)" path="contact.supportEmail" errors={shownErrors} help="Shown to customers on the website.">{input("contact.supportEmail", { type: "email", maxLength: 120, autoComplete: "email" })}</Field>
                <Field label="Office hours" path="contact.officeHours" errors={shownErrors} wide>{input("contact.officeHours", { maxLength: 120, placeholder: "Mon–Sat, 10:00 AM – 7:00 PM" })}</Field>
              </div>
            </section>

            <section id="ps-emails" className="ps-card">
              <h4 className="ps-card-title">Email addresses by purpose</h4>
              <p className="ps-note">Emails are still sent from the site’s Gmail account; customer replies go to the address you set here. These are internal and never shown on the website.</p>
              <div className="ps-grid">
                {EMAIL_PURPOSES.map(({ key, label, help }) => (
                  <Field key={key} label={`${label} email`} path={`emails.${key}`} errors={shownErrors} required={key === "bookingConfirmation"} help={help}>
                    {input(`emails.${key}`, { type: "email", maxLength: 120 })}
                  </Field>
                ))}
              </div>
            </section>

            <section id="ps-address" className="ps-card">
              <h4 className="ps-card-title">Address</h4>
              <div className="ps-grid">
                <Field label="Address line 1" path="address.line1" errors={shownErrors} wide>{input("address.line1", { maxLength: 160, autoComplete: "address-line1" })}</Field>
                <Field label="Address line 2" path="address.line2" errors={shownErrors} wide>{input("address.line2", { maxLength: 160, autoComplete: "address-line2" })}</Field>
                <Field label="City" path="address.city" errors={shownErrors}>{input("address.city", { maxLength: 80, autoComplete: "address-level2" })}</Field>
                <Field label="State" path="address.state" errors={shownErrors}>{input("address.state", { maxLength: 80, autoComplete: "address-level1" })}</Field>
                <Field label="PIN code" path="address.pin" errors={shownErrors}>{input("address.pin", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}</Field>
                <Field label="Country" path="address.country" errors={shownErrors}>{input("address.country", { maxLength: 80, autoComplete: "country-name" })}</Field>
              </div>
            </section>

            <section id="ps-online" className="ps-card">
              <h4 className="ps-card-title">Website &amp; social</h4>
              <div className="ps-grid">
                <Field label="Website" path="online.website" errors={shownErrors}>{input("online.website", { type: "url", maxLength: 300 })}</Field>
                <Field label="Instagram" path="online.instagram" errors={shownErrors}>{input("online.instagram", { type: "url", maxLength: 300 })}</Field>
                <Field label="Facebook" path="online.facebook" errors={shownErrors}>{input("online.facebook", { type: "url", maxLength: 300 })}</Field>
                <Field label="YouTube" path="online.youtube" errors={shownErrors}>{input("online.youtube", { type: "url", maxLength: 300 })}</Field>
                <Field label="Google Maps link" path="online.googleMaps" errors={shownErrors} wide>{input("online.googleMaps", { type: "url", maxLength: 300 })}</Field>
              </div>
            </section>

            <section id="ps-billing" className="ps-card">
              <h4 className="ps-card-title">Billing, receipts &amp; bank</h4>
              <div className="ps-grid">
                <Field label="Receipt / invoice prefix" path="billing.receiptPrefix" errors={shownErrors} help="e.g. GT- or GT/26-27/">{input("billing.receiptPrefix", { maxLength: 12, className: "ps-input ps-upper" })}</Field>
                <Field label="Next receipt number" path="billing.next" errors={{}} help="Read-only. Moves up automatically when receipts are issued.">
                  <input className="ps-input" value={`${profile.billing.receiptPrefix || ""}${String(meta.nextReceiptNumber || "").replace(/^.*?(\d+)$/, "$1")}`} readOnly aria-readonly="true" />
                </Field>
                <div className="ps-field--wide ps-label ps-subhead">Bank &amp; UPI details {sensitiveNote}</div>
                <Field label="Account holder name" path="bank.accountName" errors={shownErrors}>{input("bank.accountName", { maxLength: 120, disabled: !canSensitive })}</Field>
                <Field label="Bank name" path="bank.bankName" errors={shownErrors}>{input("bank.bankName", { maxLength: 120, disabled: !canSensitive })}</Field>
                <Field label="Account number" path="bank.accountNumber" errors={shownErrors} help={saved?.bank?.accountNumber ? "Saved number is masked. Type a new number only to change it." : "9–18 digits"}>
                  {input("bank.accountNumber", { inputMode: "numeric", maxLength: 22, autoComplete: "off", disabled: !canSensitive, onFocus: (e) => { if (e.target.value.includes("•")) set("bank.accountNumber")(""); }, onBlur: (e) => { if (!e.target.value && saved?.bank?.accountNumber) set("bank.accountNumber")(saved.bank.accountNumber); } })}
                </Field>
                <Field label="IFSC" path="bank.ifsc" errors={shownErrors} help="e.g. SBIN0001234">{input("bank.ifsc", { maxLength: 11, className: "ps-input ps-upper", disabled: !canSensitive, spellCheck: false })}</Field>
                <Field label="UPI ID" path="bank.upiId" errors={shownErrors} help="e.g. gadvede@okaxis">{input("bank.upiId", { maxLength: 120, disabled: !canSensitive, spellCheck: false })}</Field>
              </div>
              <ImagePicker kind="paymentQr" value={profile.images.paymentQr} onUploaded={setImage("paymentQr")} disabled={!canSensitive} note="UPI QR customers scan to pay." />
            </section>

            <section id="ps-policies" className="ps-card">
              <h4 className="ps-card-title">Policies</h4>
              <p className="ps-note">Paste a link (https://…) or the full text.</p>
              <div className="ps-grid">
                {[["cancellation", "Cancellation & refund policy"], ["terms", "Terms & conditions"], ["privacy", "Privacy policy"]].map(([k, label]) => (
                  <Field key={k} label={label} path={`policies.${k}`} errors={shownErrors} wide>
                    <textarea className="ps-input ps-textarea" rows={3} maxLength={10000} value={profile.policies[k]} onChange={set(`policies.${k}`)} />
                  </Field>
                ))}
              </div>
            </section>

            <section id="ps-branding" className="ps-card">
              <h4 className="ps-card-title">Logo, favicon &amp; theme</h4>
              <div className="ps-images">
                <ImagePicker kind="logo" value={profile.images.logo} onUploaded={setImage("logo")} note="Transparent PNG looks best." />
                <ImagePicker kind="favicon" value={profile.images.favicon} onUploaded={setImage("favicon")} note="Square icon for browser tabs." />
              </div>
              <div className="ps-label ps-mt">Theme presets</div>
              <div className="ps-presets" role="radiogroup" aria-label="Theme presets">
                {THEME_PRESETS.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={theme.preset === t.id} className={`ps-preset ${theme.preset === t.id ? "ps-preset--on" : ""}`} onClick={() => applyPreset(t)}>
                    <span className="ps-swatch" style={{ background: `linear-gradient(135deg, ${t.primary} 0 60%, ${t.accent} 60% 100%)` }} />
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="ps-grid ps-mt">
                <Field label="Primary colour" path="theme.primary" errors={shownErrors}>
                  <div className="ps-colour"><input type="color" value={/^#[0-9A-F]{6}$/i.test(theme.primary) ? theme.primary : "#0C6E44"} onChange={setColour("primary")} aria-label="Primary colour picker" /><input className="ps-input ps-upper" value={theme.primary} onChange={setColour("primary")} maxLength={7} /></div>
                </Field>
                <Field label="Accent colour" path="theme.accent" errors={shownErrors}>
                  <div className="ps-colour"><input type="color" value={/^#[0-9A-F]{6}$/i.test(theme.accent) ? theme.accent : "#F59E0B"} onChange={setColour("accent")} aria-label="Accent colour picker" /><input className="ps-input ps-upper" value={theme.accent} onChange={setColour("accent")} maxLength={7} /></div>
                </Field>
                <Field label="Mode" path="theme.mode" errors={shownErrors}>
                  <div className="ps-toggle" role="radiogroup" aria-label="Light or dark mode">
                    {["light", "dark"].map((m) => <button key={m} type="button" role="radio" aria-checked={theme.mode === m} className={theme.mode === m ? "ps-toggle--on" : ""} onClick={() => set("theme.mode")(m)}>{m === "light" ? "☀️ Light" : "🌙 Dark"}</button>)}
                  </div>
                </Field>
              </div>
              <Field label="Email signature / footer text" path="branding.emailSignature" errors={shownErrors} wide help="Added at the bottom of customer emails.">
                <textarea className="ps-input ps-textarea" rows={3} maxLength={1000} value={profile.branding.emailSignature} onChange={set("branding.emailSignature")} placeholder={"Team Gadvede Trekkers\n+91 98561 12727 · www.gadvede.com"} />
              </Field>
            </section>
          </div>

          <aside className="ps-aside" aria-label="Preview">
            <div className={`ps-preview ps-preview--${theme.mode}`} style={{ "--ps-primary": theme.primary, "--ps-accent": theme.accent }}>
              <div className="ps-preview-bar">
                {profile.images.logo ? <img src={profile.images.logo.url || profile.images.logo.localPreview} alt="" className="ps-preview-logo" /> : <span className="ps-preview-logo ps-preview-logo--empty">🏔</span>}
                <div>
                  <div className="ps-preview-name">{profile.companyName || "Company name"}</div>
                  {profile.business.tagline ? <div className="ps-preview-tag">{profile.business.tagline}</div> : null}
                </div>
              </div>
              <div className="ps-preview-body">
                <div className="ps-preview-line">📞 {formatWhatsapp(`91${String(profile.contact.primaryPhone || "").replace(/\D/g, "").slice(-10)}`) || "—"}</div>
                <div className="ps-preview-line">💬 {formatWhatsapp(profile.whatsappNumber) || "—"}</div>
                {profile.address.city ? <div className="ps-preview-line">📍 {[profile.address.city, profile.address.state].filter(Boolean).join(", ")}</div> : null}
                <button type="button" className="ps-preview-cta" tabIndex={-1}>Book now</button>
                <span className="ps-preview-pill">Receipt {profile.billing.receiptPrefix}{String(meta.nextReceiptNumber || "00001").replace(/^.*?(\d+)$/, "$1")}</span>
              </div>
            </div>
            <p className="ps-help">Preview of your theme. The website keeps its current look until the theme is switched on there.</p>
          </aside>
        </div>
      ) : null}

      {!loading ? (
        <div className="ps-savebar">
          {status ? <span className={`ps-status ps-status--${status.kind}`} role="status">{status.text}</span> : <span className="ps-status">{dirty ? "Unsaved changes" : "All changes saved"}</span>}
          <button type="button" className="ps-btn ps-btn--primary" onClick={save} disabled={saving || (!dirty && Boolean(meta.stored))}>{saving ? "Saving…" : "Save profile"}</button>
        </div>
      ) : null}
    </div>
  );
}
