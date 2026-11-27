/**
 * Admin → Settings → Automations (Pratik t91u: "Build CRM follow-up and post-trip review automations").
 * Lives where the proposed Settings hub section will go (settings/sections/AutomationSettings.jsx) but works on
 * its own today at /admin/automations.
 *
 * Tabs: Automations (toggles + timings + templates) · Preview (dry run: who WOULD get what) · WhatsApp queue
 * (prefilled wa.me links a person sends by hand) · Sent log · Opt-outs.
 * Every automation is OFF by default. The server sends nothing unless CRM_AUTOMATIONS_LIVE=true on Render.
 * No delete buttons and no export.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { crmAutomationsApi } from "../../../api/crmAutomations.api";
import {
  AUTOMATION_LABELS, MAX_FOLLOWUP_STEPS, defaultCrmSettings, placeholdersFor, validateCrmSettings, withCrmDefaults,
} from "../../../../shared/crmAutomations.js";
import "./AutomationSettings.css";

const TABS = [
  { id: "automations", label: "Automations" },
  { id: "preview", label: "Preview (dry run)" },
  { id: "queue", label: "WhatsApp queue" },
  { id: "log", label: "Sent log" },
  { id: "optouts", label: "Opt-outs" },
];
const STATUS_LABEL = { sending: "Sending", sent: "Sent", failed: "Failed", queued: "Queued", sent_manual: "Sent by hand", skipped: "Skipped" };
const ist = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) + " IST" : "—");

function setIn(obj, path, value) {
  const keys = path.split(".");
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = copy;
  keys.slice(0, -1).forEach((k) => { cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys.at(-1)] = value;
  return copy;
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="au-toggle">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="au-toggle-track"><span className="au-toggle-thumb" /></span>
      <span className={`au-toggle-text ${checked ? "on" : ""}`}>{checked ? "ON" : "OFF"}</span>
    </label>
  );
}
function Field({ label, error, hint, children, wide }) {
  return (
    <label className={`au-field ${wide ? "wide" : ""} ${error ? "has-error" : ""}`}>
      <span className="au-label">{label}</span>
      {children}
      {hint && !error && <span className="au-hint">{hint}</span>}
      {error && <span className="au-error">{error}</span>}
    </label>
  );
}
function Placeholders({ id }) {
  return (
    <div className="au-placeholders">
      <span>Placeholders:</span>
      {placeholdersFor(id).map(([k, d]) => <code key={k} title={d}>{`{{${k}}}`}</code>)}
    </div>
  );
}
function Channels({ id, a, set, errors }) {
  return (
    <div className="au-channels">
      <label><input type="checkbox" checked={a.channels.email} onChange={(e) => set(`${id}.channels.email`, e.target.checked)} /> Email</label>
      <label><input type="checkbox" checked={a.channels.whatsapp} onChange={(e) => set(`${id}.channels.whatsapp`, e.target.checked)} /> WhatsApp queue</label>
      {errors[`${id}.channels`] && <span className="au-error">{errors[`${id}.channels`]}</span>}
    </div>
  );
}
function Templates({ prefix, t, set, errors, id }) {
  return (
    <div className="au-templates">
      <Field label="Email subject" error={errors[`${prefix}.subject`]} wide>
        <input value={t.subject} onChange={(e) => set(`${prefix}.subject`, e.target.value)} maxLength={200} />
      </Field>
      <Field label="Email text" error={errors[`${prefix}.body`]} hint="An unsubscribe link is always added at the bottom." wide>
        <textarea rows={7} value={t.body} onChange={(e) => set(`${prefix}.body`, e.target.value)} maxLength={4000} />
      </Field>
      <Field label="WhatsApp text" error={errors[`${prefix}.waBody`]} wide>
        <textarea rows={3} value={t.waBody} onChange={(e) => set(`${prefix}.waBody`, e.target.value)} maxLength={1000} />
      </Field>
      <Placeholders id={id} />
    </div>
  );
}

function DelayInput({ hours, onChange }) {
  const inDays = hours % 24 === 0 && hours >= 24;
  const [unit, setUnit] = useState(inDays ? "days" : "hours");
  const value = unit === "days" ? hours / 24 : hours;
  return (
    <span className="au-delay">
      <input type="number" min={1} value={value} onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * (unit === "days" ? 24 : 1)))} />
      <select value={unit} onChange={(e) => { setUnit(e.target.value); }}>
        <option value="hours">hours</option>
        <option value="days">days</option>
      </select>
    </span>
  );
}

/* ── tab: automations ─────────────────────────────────────── */
function AutomationsTab({ s, set, errors, meta }) {
  const ef = s.enquiryFollowup; const pt = s.preTrip; const po = s.postTrip;
  const confirmOn = (id) => (on) => {
    if (on && !window.confirm(`Switch ON "${AUTOMATION_LABELS[id]}"?\n\nAfter you save, real customers will get these messages${meta?.live ? "" : " once live sending is enabled on the server"}. Use Preview first to check who would get what.`)) return;
    set(`${id}.enabled`, on);
  };
  return (
    <>
      <section className="au-card">
        <h3>General</h3>
        <div className="au-grid">
          <Field label="Google review link" error={errors["global.googleReviewUrl"]} hint={s.global.googleReviewUrl ? "" : meta?.reviewUrlSource ? `Empty here; using ${meta.reviewUrlSource}.` : "Not set yet. Post-trip messages are held until a review link is added."}>
            <input placeholder="https://g.page/r/…/review" value={s.global.googleReviewUrl} onChange={(e) => set("global.googleReviewUrl", e.target.value)} />
          </Field>
          <Field label="Feedback form link" error={errors["global.feedbackUrl"]}>
            <input value={s.global.feedbackUrl} onChange={(e) => set("global.feedbackUrl", e.target.value)} />
          </Field>
          <Field label="Send emails between (IST)" error={errors["global.sendWindow"]} hint="Outside these hours emails wait for the next run.">
            <span className="au-inline">
              <input type="number" min={0} max={23} value={s.global.sendWindow.startHour} onChange={(e) => set("global.sendWindow.startHour", Number(e.target.value))} />
              <span>:00 to</span>
              <input type="number" min={1} max={24} value={s.global.sendWindow.endHour} onChange={(e) => set("global.sendWindow.endHour", Number(e.target.value))} />
              <span>:00</span>
            </span>
          </Field>
          <Field label="Max messages per run" error={errors["global.maxPerRun"]}>
            <input type="number" min={1} max={500} value={s.global.maxPerRun} onChange={(e) => set("global.maxPerRun", Number(e.target.value))} />
          </Field>
        </div>
      </section>

      <section className={`au-card ${ef.enabled ? "is-on" : ""}`}>
        <header className="au-card-head">
          <div><h3>💬 {AUTOMATION_LABELS.enquiryFollowup}</h3><p>Enquiries with no booking get a follow-up. Stops by itself when the customer books, registers a payment, opts out, or the enquiry is marked Converted / Lost.</p></div>
          <Toggle checked={ef.enabled} onChange={confirmOn("enquiryFollowup")} label="Enquiry follow-ups" />
        </header>
        <Channels id="enquiryFollowup" a={ef} set={set} errors={errors} />
        <div className="au-grid">
          <Field label="Number of follow-ups">
            <select value={ef.steps.length} onChange={(e) => {
              const n = Number(e.target.value); const d = defaultCrmSettings().enquiryFollowup.steps;
              const steps = Array.from({ length: n }, (_, i) => ef.steps[i] || { ...(d[i] || d.at(-1)), delayHours: (ef.steps.at(-1)?.delayHours || 24) + 72 * (i - ef.steps.length + 1) });
              set("enquiryFollowup.steps", steps);
            }}>
              {Array.from({ length: MAX_FOLLOWUP_STEPS }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </Field>
          <Field label="Don't follow up enquiries older than (days)" error={errors["enquiryFollowup.maxAgeDays"]}>
            <input type="number" min={1} max={60} value={ef.maxAgeDays} onChange={(e) => set("enquiryFollowup.maxAgeDays", Number(e.target.value))} />
          </Field>
          <label className="au-check"><input type="checkbox" checked={ef.onlyNewEnquiries} onChange={(e) => set("enquiryFollowup.onlyNewEnquiries", e.target.checked)} /> Only enquiries that come in after this is switched on</label>
        </div>
        {ef.steps.map((st, i) => (
          <div className="au-step" key={i}>
            <div className="au-step-head">
              <strong>Follow-up {i + 1}</strong>
              <span>sent</span>
              <DelayInput hours={st.delayHours} onChange={(h) => set(`enquiryFollowup.steps.${i}.delayHours`, h)} />
              <span>after the enquiry</span>
              {errors[`enquiryFollowup.steps.${i}.delayHours`] && <span className="au-error">{errors[`enquiryFollowup.steps.${i}.delayHours`]}</span>}
            </div>
            <Templates prefix={`enquiryFollowup.steps.${i}`} t={st} set={set} errors={errors} id="enquiryFollowup" />
          </div>
        ))}
      </section>

      <section className={`au-card ${pt.enabled ? "is-on" : ""}`}>
        <header className="au-card-head">
          <div><h3>🚌 {AUTOMATION_LABELS.preTrip}</h3><p>Reminder before the trip with the pickup point and time, for confirmed bookings and verified payment registrations.</p></div>
          <Toggle checked={pt.enabled} onChange={confirmOn("preTrip")} label="Pre-trip reminder" />
        </header>
        <Channels id="preTrip" a={pt} set={set} errors={errors} />
        <div className="au-grid">
          <Field label="Days before the trip" error={errors["preTrip.daysBefore"]}>
            <input type="number" min={1} max={7} value={pt.daysBefore} onChange={(e) => set("preTrip.daysBefore", Number(e.target.value))} />
          </Field>
          <Field label="Pickup time when none is known" wide>
            <input value={pt.defaultPickupTime} onChange={(e) => set("preTrip.defaultPickupTime", e.target.value)} />
          </Field>
        </div>
        <div className="au-pickups">
          <div className="au-label">Pickup times (first match on the pickup point wins; a time written in the pickup point, like “(09:00 PM)”, is used too)</div>
          {pt.pickupTimes.map((p, i) => (
            <div className="au-pickup-row" key={i}>
              <input placeholder="Pickup point contains… e.g. FC Road" value={p.match} onChange={(e) => set(`preTrip.pickupTimes.${i}.match`, e.target.value)} />
              <input placeholder="Time e.g. 9:00 PM" value={p.time} onChange={(e) => set(`preTrip.pickupTimes.${i}.time`, e.target.value)} />
              {errors[`preTrip.pickupTimes.${i}`] && <span className="au-error">{errors[`preTrip.pickupTimes.${i}`]}</span>}
            </div>
          ))}
          <button type="button" className="au-btn ghost" onClick={() => set("preTrip.pickupTimes", [...pt.pickupTimes, { match: "", time: "" }])}>+ Add pickup time</button>
          <span className="au-hint"> Leave a row empty to ignore it.</span>
        </div>
        <Templates prefix="preTrip" t={pt} set={set} errors={errors} id="preTrip" />
      </section>

      <section className={`au-card ${po.enabled ? "is-on" : ""}`}>
        <header className="au-card-head">
          <div><h3>⭐ {AUTOMATION_LABELS.postTrip}</h3><p>“Welcome back” after the trip with your Google review link, the feedback form and an optional next-trip offer code.</p></div>
          <Toggle checked={po.enabled} onChange={confirmOn("postTrip")} label="Post-trip welcome back" />
        </header>
        <Channels id="postTrip" a={po} set={set} errors={errors} />
        <div className="au-grid">
          <Field label="Days after the trip date" error={errors["postTrip.daysAfter"]}>
            <input type="number" min={1} max={7} value={po.daysAfter} onChange={(e) => set("postTrip.daysAfter", Number(e.target.value))} />
          </Field>
          <Field label="Next-trip offer code (optional)" error={errors["postTrip.offerCode"]} hint="Leave empty for no offer.">
            <input value={po.offerCode} placeholder="e.g. TRAIL10" onChange={(e) => set("postTrip.offerCode", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Offer sentence" error={errors["postTrip.offerText"]} wide>
            <input value={po.offerText} onChange={(e) => set("postTrip.offerText", e.target.value)} />
          </Field>
        </div>
        <Templates prefix="postTrip" t={po} set={set} errors={errors} id="postTrip" />
      </section>
    </>
  );
}

/* ── tab: preview ─────────────────────────────────────────── */
function PreviewTab({ settings, clientErrors }) {
  const [state, setState] = useState({ loading: false, data: null, error: "" });
  const [open, setOpen] = useState(null);
  const run = async () => {
    if (Object.keys(clientErrors).length) { setState({ loading: false, data: null, error: "Fix the highlighted fields on the Automations tab first." }); return; }
    setState({ loading: true, data: null, error: "" });
    try { setState({ loading: false, data: await crmAutomationsApi.preview(settings), error: "" }); }
    catch (e) { setState({ loading: false, data: null, error: e.message }); }
  };
  const d = state.data;
  return (
    <section className="au-card">
      <header className="au-card-head">
        <div><h3>Dry run</h3><p>Shows who <b>would</b> get which message if the automations ran right now, using the settings on screen (saved or not). Nothing is sent and nothing is saved. Automations that are OFF are included so you can check them before switching on.</p></div>
        <button type="button" className="au-btn" onClick={run} disabled={state.loading}>{state.loading ? "Checking…" : "Run dry run"}</button>
      </header>
      {state.error && <div className="au-banner warn">{state.error}</div>}
      {d && (
        <>
          {(d.notes || []).map((n) => <div key={n} className="au-banner warn">{n}</div>)}
          <p className="au-muted">{d.total} message{d.total === 1 ? "" : "s"} due · today {d.today} (IST){d.total > d.items.length ? ` · showing first ${d.items.length}` : ""}</p>
          {!d.items.length && <div className="au-empty">Nobody is due a message right now.</div>}
          <div className="au-table-wrap">
            <table className="au-table">
              <thead><tr><th>Automation</th><th>Customer</th><th>Channel</th><th>To</th><th>Trip / enquiry</th><th>Would…</th><th /></tr></thead>
              <tbody>
                {d.items.map((it, i) => (
                  <PreviewRow key={it.idempotencyKey + i} it={it} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
function PreviewRow({ it, open, onToggle }) {
  const label = `${AUTOMATION_LABELS[it.automation]}${it.automation === "enquiryFollowup" ? ` #${it.step}` : ""}`;
  return (
    <>
      <tr>
        <td>{label}{!it.automationEnabled && <span className="au-pill off">OFF</span>}</td>
        <td>{it.recipientName || "—"}</td>
        <td><span className={`au-pill ${it.channel}`}>{it.channel === "email" ? "Email" : "WhatsApp"}</span></td>
        <td className="au-mono">{it.channel === "email" ? it.email : `+91 ${it.phone}`}</td>
        <td>{it.context || "—"}</td>
        <td>{it.skipReason ? <span className="au-pill held">Held: {it.skipReason}</span> : <span className="au-pill ok">{it.channel === "email" ? "Send email" : "Queue WhatsApp"}</span>}</td>
        <td><button type="button" className="au-btn ghost sm" onClick={onToggle}>{open ? "Hide" : "View message"}</button></td>
      </tr>
      {open && (
        <tr className="au-msg-row"><td colSpan={7}>
          {it.channel === "email"
            ? (<div className="au-email-preview"><div className="au-email-subject"><b>Subject:</b> {it.subject}</div><iframe title="Email preview" sandbox="" srcDoc={it.html} /></div>)
            : (<div className="au-wa-bubble">{it.text}</div>)}
        </td></tr>
      )}
    </>
  );
}

/* ── tab: WhatsApp queue ──────────────────────────────────── */
function QueueTab() {
  const [rows, setRows] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try { setRows((await crmAutomationsApi.whatsappQueue()).data || []); setError(""); }
    catch (e) { setRows([]); setError(e.status === 501 ? "The WhatsApp queue starts working after migration 020 is run." : e.message); }
  }, []);
  useEffect(() => { Promise.resolve().then(() => load()); }, [load]); // async load (setState after the request)
  const mark = async (id, status) => {
    setBusy(id);
    try { await crmAutomationsApi.markWhatsapp(id, status); setRows((r) => r.filter((x) => x.id !== id)); }
    catch (e) { setError(e.message); } finally { setBusy(""); }
  };
  return (
    <section className="au-card">
      <header className="au-card-head"><div><h3>Send via WhatsApp</h3><p>WhatsApp messages are never sent automatically. Tap <b>Open WhatsApp</b>, check the prefilled message, send it, then tap <b>Mark sent</b>.</p></div>
        <button type="button" className="au-btn ghost" onClick={load}>Refresh</button></header>
      {error && <div className="au-banner warn">{error}</div>}
      {rows && !rows.length && !error && <div className="au-empty">Nothing waiting. 🎉</div>}
      <div className="au-queue">
        {(rows || []).map((r) => (
          <div className="au-queue-item" key={r.id}>
            <div className="au-queue-top"><b>{r.recipient_name || "Customer"}</b><span className="au-mono">+91 {r.recipient_phone}</span><span className="au-pill">{AUTOMATION_LABELS[r.automation] || r.automation}{r.automation === "enquiryFollowup" ? ` #${r.step}` : ""}</span><span className="au-muted">{ist(r.created_at)}</span></div>
            <div className="au-wa-bubble">{r.body}</div>
            <div className="au-queue-actions">
              <a className="au-btn wa" href={r.wa_link} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
              <button type="button" className="au-btn" disabled={busy === r.id} onClick={() => mark(r.id, "sent_manual")}>Mark sent</button>
              <button type="button" className="au-btn ghost" disabled={busy === r.id} onClick={() => mark(r.id, "skipped")}>Skip</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── tab: log ─────────────────────────────────────────────── */
function LogTab() {
  const [f, setF] = useState({ automation: "", channel: "", status: "" });
  const [rows, setRows] = useState(null); const [total, setTotal] = useState(0); const [error, setError] = useState("");
  const load = useCallback(async (offset = 0) => {
    try {
      const r = await crmAutomationsApi.log({ ...f, limit: 100, offset });
      setRows((prev) => (offset ? [...(prev || []), ...(r.data || [])] : r.data || [])); setTotal(r.total || 0); setError("");
    } catch (e) { setRows([]); setError(e.status === 501 ? "The log starts working after migration 020 is run." : e.message); }
  }, [f]);
  useEffect(() => { Promise.resolve().then(() => load(0)); }, [load]); // reload when filters change
  return (
    <section className="au-card">
      <header className="au-card-head"><div><h3>Sent messages</h3><p>Every email sent and every WhatsApp message queued. Each customer gets each message at most once.</p></div></header>
      <div className="au-filters">
        <select value={f.automation} onChange={(e) => setF({ ...f, automation: e.target.value })}><option value="">All automations</option>{Object.entries(AUTOMATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}><option value="">All channels</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      {error && <div className="au-banner warn">{error}</div>}
      {rows && !rows.length && !error && <div className="au-empty">No messages yet.</div>}
      {rows && rows.length > 0 && (
        <div className="au-table-wrap"><table className="au-table">
          <thead><tr><th>When</th><th>Automation</th><th>Channel</th><th>To</th><th>Message</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td>{ist(r.sent_at || r.created_at)}</td>
              <td>{AUTOMATION_LABELS[r.automation] || r.automation}{r.automation === "enquiryFollowup" ? ` #${r.step}` : ""}</td>
              <td><span className={`au-pill ${r.channel}`}>{r.channel === "email" ? "Email" : "WhatsApp"}</span></td>
              <td className="au-mono">{r.recipient_email || (r.recipient_phone ? `+91 ${r.recipient_phone}` : "—")}<div className="au-muted">{r.recipient_name}</div></td>
              <td className="au-snippet">{r.subject || String(r.body || "").slice(0, 90)}</td>
              <td><span className={`au-pill st-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>{r.error_code && <div className="au-muted">{r.error_code}</div>}</td>
            </tr>))}</tbody>
        </table></div>
      )}
      {rows && rows.length < total && <button type="button" className="au-btn ghost" onClick={() => load(rows.length)}>Load more</button>}
    </section>
  );
}

/* ── tab: opt-outs ────────────────────────────────────────── */
function OptOutsTab() {
  const [rows, setRows] = useState(null); const [error, setError] = useState(""); const [contact, setContact] = useState(""); const [reason, setReason] = useState(""); const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    try { setRows(await crmAutomationsApi.optOuts() || []); setError(""); }
    catch (e) { setRows([]); setError(e.status === 501 ? "Opt-outs start working after migration 020 is run." : e.message); }
  }, []);
  useEffect(() => { Promise.resolve().then(() => load()); }, [load]); // async load (setState after the request)
  const add = async (e) => {
    e.preventDefault(); setMsg("");
    try { await crmAutomationsApi.addOptOut(contact, reason); setContact(""); setReason(""); setMsg("Added. They won't get any more automated messages."); load(); }
    catch (err) { setMsg(err.errors?.contact || err.message); }
  };
  return (
    <section className="au-card">
      <header className="au-card-head"><div><h3>Opt-outs</h3><p>People here never get automated follow-ups or reminders. Customers are added when they tap Unsubscribe in an email; add someone by hand if they ask on WhatsApp or call.</p></div></header>
      <form className="au-optout-form" onSubmit={add}>
        <input placeholder="Email or 10-digit mobile" value={contact} onChange={(e) => setContact(e.target.value)} />
        <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button type="submit" className="au-btn" disabled={!contact.trim()}>Add opt-out</button>
      </form>
      {msg && <div className="au-banner">{msg}</div>}
      {error && <div className="au-banner warn">{error}</div>}
      {rows && rows.length > 0 && (
        <div className="au-table-wrap"><table className="au-table">
          <thead><tr><th>Contact</th><th>How</th><th>Reason</th><th>Added</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td className="au-mono">{r.contact}</td><td>{r.source === "email_link" ? "Unsubscribe link" : `By ${r.created_by || "admin"}`}</td><td>{r.reason || "—"}</td><td>{ist(r.created_at)}</td></tr>)}</tbody>
        </table></div>
      )}
      {rows && !rows.length && !error && <div className="au-empty">No opt-outs yet.</div>}
    </section>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default function AutomationSettings() {
  const [tab, setTab] = useState("automations");
  const [settings, setSettings] = useState(() => withCrmDefaults({}));
  const [saved, setSaved] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [serverErrors, setServerErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    crmAutomationsApi.get()
      .then((d) => { const s = withCrmDefaults(d.settings); setSettings(s); setSaved(s); setMeta(d.meta); })
      .catch((e) => { setLoadError(e.message); setSaved(withCrmDefaults({})); });
  }, []);

  const cleaned = useMemo(() => setIn(settings, "preTrip.pickupTimes", settings.preTrip.pickupTimes.filter((p) => p.match.trim() || p.time.trim())), [settings]);
  const clientErrors = useMemo(() => validateCrmSettings(cleaned).errors, [cleaned]);
  const errors = showErrors ? { ...clientErrors, ...serverErrors } : serverErrors;
  const dirty = saved && JSON.stringify(cleaned) !== JSON.stringify(saved);
  const set = (path, value) => { setSettings((s) => setIn(s, path, value)); setNotice(""); };

  const save = async () => {
    setShowErrors(true); setNotice("");
    if (Object.keys(clientErrors).length) { setNotice("Please fix the highlighted fields."); return; }
    setSaving(true);
    try {
      const d = await crmAutomationsApi.save(cleaned);
      const s = withCrmDefaults(d.settings); setSettings(s); setSaved(s); setMeta(d.meta); setServerErrors({}); setShowErrors(false);
      setNotice("Saved.");
    } catch (e) { setServerErrors(e.errors || {}); setNotice(e.message); }
    finally { setSaving(false); }
  };

  const chips = meta ? [
    { ok: meta.live, label: meta.live ? "Live sending ON" : "Live sending OFF (dry run only)", title: "Server switch CRM_AUTOMATIONS_LIVE" },
    { ok: meta.gmailConfigured, label: meta.gmailConfigured ? "Gmail connected" : "Gmail not set up" },
    { ok: meta.cronConfigured, label: meta.cronConfigured ? "Scheduler ready" : "Scheduler not set up" },
    { ok: meta.unsubscribeConfigured, label: meta.unsubscribeConfigured ? "Unsubscribe link ready" : "Unsubscribe link not set up" },
    { ok: meta.reviewUrlSet, label: meta.reviewUrlSet ? "Google review link set" : "Google review link missing" },
  ] : [];

  return (
    <div className="au-page">
      <div className="au-crumbs">⚙️ Settings › Automations</div>
      <div className="au-head">
        <div>
          <h1>Automations</h1>
          <p>Follow up enquiries, remind travellers before the trip, and ask for a Google review after it. Everything starts OFF.</p>
        </div>
      </div>
      {chips.length > 0 && <div className="au-chips">{chips.map((c) => <span key={c.label} title={c.title} className={`au-chip ${c.ok ? "ok" : "bad"}`}>{c.ok ? "✓" : "•"} {c.label}</span>)}</div>}
      {loadError && <div className="au-banner warn">Could not load saved settings ({loadError}). Showing defaults; saving needs the server.</div>}

      <nav className="au-tabs" role="tablist">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </nav>

      {tab === "automations" && <AutomationsTab s={settings} set={set} errors={errors} meta={meta} />}
      {tab === "preview" && <PreviewTab settings={cleaned} clientErrors={clientErrors} />}
      {tab === "queue" && <QueueTab />}
      {tab === "log" && <LogTab />}
      {tab === "optouts" && <OptOutsTab />}

      {tab === "automations" && (
        <div className="au-savebar">
          <span className="au-muted">{notice || (dirty ? "Unsaved changes" : meta?.updatedAt ? `Saved ${ist(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}` : "Not saved yet")}</span>
          <button type="button" className="au-btn" onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save automations"}</button>
        </div>
      )}
    </div>
  );
}
