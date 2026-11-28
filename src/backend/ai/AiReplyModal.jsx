import { useEffect, useMemo, useRef, useState } from "react";
import { aiApi } from "../../api/ai.api";
import { waSendUrl } from "../../config/whatsappSetting";
import { checkDraft, REPLY_CHANNELS } from "../../../shared/aiDraftGuard.js";
import { channelForEnquiry, phone10 } from "./aiChannels";
import "./ai.css";

/**
 * "Draft reply with AI" — Instagram DMs, WhatsApp and website enquiries (Gemini, server-side).
 * DRAFT ONLY: the text comes back here, staff edit it, then COPY it or open WhatsApp / email themselves.
 * Nothing is ever sent automatically and there is no send call anywhere in this flow.
 */
let tripCache = null;
function StatusBanner({ status, error }) {
  if (error) return <div className="ai-banner bad" role="alert">{error}</div>;
  if (!status) return <div className="ai-banner">Checking AI status…</div>;
  if (!status.enabled) return <div className="ai-banner bad" role="status"><strong>AI is switched off.</strong> The owner can turn it on with <code>AI_ENABLED=true</code> on the backend. You can still write the reply yourself.</div>;
  if (!status.keyConfigured) return <div className="ai-banner bad" role="status"><strong>No Gemini key yet.</strong> The owner needs to add a free key from aistudio.google.com/apikey.</div>;
  return (
    <div className="ai-banner ok" role="status">
      ✨ Google Gemini · {status.model} · {status.usedToday}/{status.dailyLimit} drafts used today
    </div>
  );
}

function DraftCard({ draft, index, channel, guard, phone, email, subject, onChange }) {
  const [copied, setCopied] = useState(false);
  const warnings = useMemo(() => checkDraft(draft.text, { ...guard, channel }), [draft.text, guard, channel]);
  const okToOpen = () => !warnings.length || window.confirm(`This draft has ${warnings.length} thing(s) to check:\n\n• ${warnings.map((w) => w.message).join("\n• ")}\n\nOpen it anyway?`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(draft.text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy the reply:", draft.text); }
  };
  const openWa = () => { if (okToOpen()) window.open(waSendUrl(draft.text, `91${phone}`), "_blank", "noopener,noreferrer"); };
  const openMail = () => {
    if (!okToOpen()) return;
    const sub = encodeURIComponent(subject || "Your enquiry with Gadvede Trekkers");
    window.open(`mailto:${email}?subject=${sub}&body=${encodeURIComponent(draft.text)}`, "_self");
  };
  const openIg = async () => { await copy(); window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer"); };
  return (
    <article className="ai-draft" aria-label={`Draft ${index + 1}`}>
      <header>
        <span className="ai-draft-label">{draft.label}</span>
        <span className="ai-draft-badge">DRAFT · not sent</span>
      </header>
      <textarea value={draft.text} rows={Math.min(14, Math.max(6, Math.ceil(draft.text.length / 60)))} onChange={(e) => onChange(e.target.value)} aria-label={`Edit draft ${index + 1}`} />
      <div className="ai-draft-meta">{draft.text.length} characters</div>
      {warnings.length > 0 ? (
        <ul className="ai-warnings" aria-label="Check before sending">
          {warnings.map((w) => <li key={w.message}>⚠️ {w.message}</li>)}
        </ul>
      ) : (
        <div className="ai-checked">✓ Prices, dates and numbers match the trip data</div>
      )}
      <div className="ai-actions">
        <button type="button" className="ai-btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
        {(channel === "whatsapp" || channel === "website") && <button type="button" className="ai-btn wa" onClick={openWa} disabled={!phone} title={phone ? "Opens WhatsApp with this text — you press send" : "No valid phone number on this enquiry"}>Open in WhatsApp</button>}
        {channel === "instagram" && <button type="button" className="ai-btn ig" onClick={openIg}>Copy &amp; open Instagram</button>}
        {(channel === "email" || channel === "website") && <button type="button" className="ai-btn" onClick={openMail} disabled={!email} title={email ? "Opens your email app with this text" : "No email on this enquiry"}>Open email</button>}
      </div>
    </article>
  );
}

export default function AiReplyModal({ enquiry = null, defaultChannel, defaultVariants, onClose }) {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [trips, setTrips] = useState(tripCache || []);
  const [form, setForm] = useState(() => {
    const ch = defaultChannel || (enquiry ? channelForEnquiry(enquiry) : "instagram");
    return {
      channel: ch,
      customerMessage: enquiry?.message || "",
      customerName: enquiry?.name && enquiry.name !== "Unknown" ? enquiry.name : "",
      tripSlug: "",
      preferredDate: enquiry?.preferredDate || enquiry?.date || "",
      groupSize: String(enquiry?.groupSize || enquiry?.pax || ""),
      staffNote: "",
      variants: defaultVariants || (ch === "website" ? 3 : 1),
      phone: phone10(enquiry?.phone || enquiry?.contact),
      email: enquiry?.email || "",
    };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const firstField = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    let live = true;
    aiApi.status().then((s) => live && setStatus(s)).catch((e) => live && setStatusError(e.message));
    if (!tripCache) aiApi.trips().then((t) => { tripCache = t || []; if (live) setTrips(tripCache); }).catch(() => {});
    const onKey = (e) => { if (e.key === "Escape") closeRef.current?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstField.current?.focus();
    return () => { live = false; window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);

  const canGenerate = status?.enabled && status?.keyConfigured && !busy && (form.customerMessage.trim() || form.tripSlug || enquiry?.eventName);

  const generate = async () => {
    setBusy(true); setError("");
    try {
      const data = await aiApi.replyDraft({
        channel: form.channel, customerMessage: form.customerMessage, customerName: form.customerName,
        eventName: enquiry?.eventName || "", tripSlug: form.tripSlug, preferredDate: form.preferredDate,
        groupSize: form.groupSize, staffNote: form.staffNote, variants: form.variants, enquiryId: enquiry?.id || "",
      });
      setResult(data);
      aiApi.status().then(setStatus).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const editDraft = (i, text) => setResult((r) => ({ ...r, drafts: r.drafts.map((d, j) => (j === i ? { ...d, text } : d)) }));
  const title = form.channel === "website" ? "AI reply suggestions" : "Draft reply with AI";

  return (
    <div className="ai-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <header className="ai-modal-head">
          <div>
            <h2 id="ai-modal-title">✨ {title}</h2>
            <p>{enquiry ? <>For <strong>{enquiry.name || "customer"}</strong>{enquiry.eventName ? <> · {enquiry.eventName}</> : null}</> : "Paste an Instagram DM or WhatsApp message and pick the trip."}</p>
          </div>
          <button type="button" className="ai-close" aria-label="Close" onClick={onClose}>✕</button>
        </header>

        <StatusBanner status={status} error={statusError} />

        <div className="ai-body">
          <section className="ai-form" aria-label="What to reply to">
            <div className="ai-grid">
              <label className="ai-field">
                <span>Channel</span>
                <select ref={firstField} value={form.channel} onChange={(e) => set("channel", e.target.value)}>
                  {Object.entries(REPLY_CHANNELS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                </select>
              </label>
              <label className="ai-field">
                <span>Trip (prices &amp; dates come from here)</span>
                <select value={form.tripSlug} onChange={(e) => set("tripSlug", e.target.value)}>
                  <option value="">{enquiry?.eventName ? `Auto: match “${enquiry.eventName.slice(0, 40)}”` : "No trip — ask which trip"}</option>
                  {trips.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                </select>
              </label>
              <label className="ai-field wide">
                <span>Customer's message</span>
                <textarea rows={4} value={form.customerMessage} maxLength={2500} placeholder="e.g. Hi, Harishchandragad trek details for 2 people this weekend? Pickup from Wakad?" onChange={(e) => set("customerMessage", e.target.value)} />
                <small>Phone numbers and emails are removed before the text is sent to Google.</small>
              </label>
              <label className="ai-field"><span>First name</span><input value={form.customerName} maxLength={80} onChange={(e) => set("customerName", e.target.value)} /></label>
              <label className="ai-field"><span>Preferred date</span><input value={form.preferredDate} maxLength={60} placeholder="e.g. 5 Dec / this weekend" onChange={(e) => set("preferredDate", e.target.value)} /></label>
              <label className="ai-field"><span>People</span><input value={form.groupSize} maxLength={20} inputMode="numeric" onChange={(e) => set("groupSize", e.target.value)} /></label>
              <label className="ai-field"><span>Options</span>
                <select value={form.variants} onChange={(e) => set("variants", Number(e.target.value))}>
                  <option value={1}>1 reply</option><option value={2}>2 options</option><option value={3}>3 options</option>
                </select>
              </label>
              {(form.channel === "whatsapp" || form.channel === "website") && (
                <label className="ai-field"><span>Customer WhatsApp</span><input value={form.phone} maxLength={14} inputMode="tel" placeholder="10-digit mobile" onChange={(e) => set("phone", phone10(e.target.value) || e.target.value.replace(/\D/g, "").slice(0, 10))} /></label>
              )}
              {(form.channel === "email" || form.channel === "website") && (
                <label className="ai-field"><span>Customer email</span><input type="email" value={form.email} maxLength={120} onChange={(e) => set("email", e.target.value)} /></label>
              )}
              <label className="ai-field wide">
                <span>Note for the AI (optional)</span>
                <input value={form.staffNote} maxLength={400} placeholder="e.g. Mention Kasara pickup too · keep it in Hinglish" onChange={(e) => set("staffNote", e.target.value)} />
              </label>
            </div>
            <div className="ai-generate">
              <button type="button" className="ai-btn primary" onClick={generate} disabled={!canGenerate}>
                {busy ? "Writing…" : result ? "↻ Write again" : `✨ ${title}`}
              </button>
              {error && <span className="ai-error" role="alert">{error}</span>}
            </div>
          </section>

          {result && (
            <section className="ai-results" aria-label="Drafts">
              {result.trip ? (
                <div className="ai-facts">
                  <strong>Used trip data: <a href={result.trip.url} target="_blank" rel="noopener noreferrer">{result.trip.name}</a></strong>
                  <span>{result.factsUsed.prices.length ? result.factsUsed.prices.map((p) => `${p.label} ₹${Number(p.price).toLocaleString("en-IN")}`).join(" · ") : "No price in admin"}</span>
                  <span>{result.factsUsed.upcomingDates.length ? `Dates: ${result.factsUsed.upcomingDates.slice(0, 4).join(" · ")}` : "No upcoming dates in admin"}</span>
                </div>
              ) : (
                <div className="ai-facts warn">No trip matched, so the AI was told not to quote any price or date.</div>
              )}
              {result.subject && <div className="ai-subject"><span>Subject:</span> {result.subject}</div>}
              <div className="ai-draft-list">
                {result.drafts.map((d, i) => (
                  <DraftCard key={i} draft={d} index={i} channel={form.channel} guard={result.guard} phone={form.phone} email={form.email} subject={result.subject} onChange={(t) => editDraft(i, t)} />
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="ai-modal-foot">
          🔒 AI drafts only. Read and edit before sending — nothing is sent automatically. Check every price, date and pickup point.
        </footer>
      </div>
    </div>
  );
}
