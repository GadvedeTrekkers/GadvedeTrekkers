import { useCallback, useEffect, useMemo, useState } from "react";
import { paymentRegistrationsApi } from "../api/paymentRegistrations.api";
import { waSendUrl } from "../config/whatsappSetting";

/**
 * Admin → Payment Registrations (t81u). Customers who paid by bank transfer / UPI submit /register; staff check the
 * UTR against the bank statement, then mark Verified or Rejected. Status changes are audit-logged by the backend.
 * There is intentionally NO delete and NO export here.
 */
const STATUS = {
  pending_verification: { label: "Pending verification", color: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
  verified: { label: "Verified", color: "#047857", bg: "#ecfdf5", border: "#6ee7b7" },
  rejected: { label: "Rejected", color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5" },
};
const TABS = [["", "All"], ["pending_verification", "Pending"], ["verified", "Verified"], ["rejected", "Rejected"]];
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const when = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "");
const day = (iso) => (iso ? new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

const s = {
  filters: { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", margin: "0 0 14px" },
  input: { width: "100%", minHeight: 42, border: "1px solid #d1d5db", borderRadius: 10, padding: "8px 10px", fontSize: 14, background: "#fff" },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 12px" },
  tab: (on) => ({ border: `1px solid ${on ? "#0c6e44" : "#d1d5db"}`, background: on ? "#0c6e44" : "#fff", color: on ? "#fff" : "#334155", borderRadius: 999, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" },
  badge: (st) => ({ display: "inline-block", fontSize: 12, fontWeight: 800, color: STATUS[st]?.color, background: STATUS[st]?.bg, border: `1px solid ${STATUS[st]?.border}`, borderRadius: 999, padding: "2px 10px" }),
  meta: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 16px", margin: "10px 0", fontSize: 13, color: "#334155" },
  k: { color: "#64748b", fontWeight: 600, marginRight: 4 },
  btns: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: (bg, fg = "#fff", border = bg) => ({ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none" }),
  warn: { fontSize: 12, fontWeight: 800, color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 999, padding: "1px 8px", marginLeft: 6 },
  modalBack: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 3000, display: "grid", placeItems: "center", padding: 16 },
  modal: { background: "#fff", borderRadius: 16, padding: 16, width: "min(560px, 100%)", maxHeight: "90vh", overflow: "auto" },
};

function Detail({ r }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, fontSize: 13, color: "#334155", display: "grid", gap: 6, marginBottom: 10 }}>
      <div><span style={s.k}>Email:</span>{r.email} · <span style={s.k}>WhatsApp:</span>+91 {r.whatsapp}</div>
      <div><span style={s.k}>Age / gender:</span>{r.age} / {r.gender} · <span style={s.k}>City:</span>{r.city}</div>
      <div><span style={s.k}>Emergency:</span>{r.emergencyName} (+91 {r.emergencyPhone})</div>
      {r.medicalConditions ? <div><span style={s.k}>Medical:</span>{r.medicalConditions}</div> : null}
      {r.participants.length ? (
        <div>
          <span style={s.k}>Other participants:</span>
          <ol style={{ margin: "4px 0 0 18px", padding: 0 }}>
            {r.participants.map((p, i) => <li key={i}>{p.name} · {p.age} · {p.gender}{p.mobile ? ` · +91 ${p.mobile}` : ""}</li>)}
          </ol>
        </div>
      ) : null}
      {r.notes ? <div><span style={s.k}>Customer notes:</span>{r.notes}</div> : null}
      {r.adminNote ? <div><span style={s.k}>Admin note:</span>{r.adminNote}</div> : null}
      {r.verifiedBy ? <div><span style={s.k}>{r.status === "rejected" ? "Rejected" : "Verified"} by:</span>{r.verifiedBy} · {when(r.verifiedAt)}</div> : null}
      <div><span style={s.k}>Submitted:</span>{when(r.createdAt)}</div>
    </div>
  );
}

export default function ManagePaymentRegistrations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ status: "pending_verification", event: "", date: "", search: "" });
  const [open, setOpen] = useState({});
  const [shot, setShot] = useState(null); // { reference, url } | { reference, loading } | { error }
  const [action, setAction] = useState(null); // { row, status }
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    paymentRegistrationsApi.list({ event: filters.event, date: filters.date, search: filters.search.trim(), limit: 500 })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Could not load registrations"))
      .finally(() => setLoading(false));
  }, [filters.event, filters.date, filters.search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { paymentRegistrationsApi.events().then((l) => setEvents(Array.isArray(l) ? l : [])).catch(() => {}); }, []);

  const eventOptions = useMemo(() => {
    const map = new Map(events.map((e) => [e.slug, e.name]));
    rows.forEach((r) => { if (!map.has(r.eventSlug)) map.set(r.eventSlug, r.eventName); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [events, rows]);
  const counts = useMemo(() => rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {}), [rows]);
  const visible = filters.status ? rows.filter((r) => r.status === filters.status) : rows;
  const setF = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  async function viewScreenshot(r) {
    setShot({ reference: r.reference, loading: true });
    try {
      const { url } = await paymentRegistrationsApi.screenshotUrl(r.id);
      setShot({ reference: r.reference, url, utr: r.utr, amount: r.amountPaid });
    } catch (e) {
      setShot({ reference: r.reference, error: e.message });
    }
  }

  async function confirmAction() {
    if (!action) return;
    if (action.status === "rejected" && note.trim().length < 3) return;
    setSaving(true);
    try {
      const updated = await paymentRegistrationsApi.setStatus(action.row.id, action.status, note.trim());
      setRows((list) => list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      setAction(null);
      setNote("");
    } catch (e) {
      alert(e.message || "Could not update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">🧾 Payment Registrations</h3>
        <span className="adm-count-badge">{counts.pending_verification || 0} pending</span>
      </div>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 12px" }}>
        Customers who paid directly by bank transfer / UPI fill <a href="/register" target="_blank" rel="noreferrer">/register</a>. Match the UTR and amount with the bank statement, then mark Verified or Rejected.
      </p>

      <div style={s.tabs}>
        {TABS.map(([key, label]) => (
          <button key={key || "all"} type="button" style={s.tab(filters.status === key)} onClick={() => setFilters((f) => ({ ...f, status: key }))}>
            {label} ({key ? counts[key] || 0 : rows.length})
          </button>
        ))}
      </div>
      <div style={s.filters}>
        <select style={s.input} value={filters.event} onChange={setF("event")} aria-label="Filter by event">
          <option value="">All events</option>
          {eventOptions.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <input style={s.input} type="date" value={filters.date} onChange={setF("date")} aria-label="Filter by trip date" />
        <input style={s.input} type="search" value={filters.search} onChange={setF("search")} placeholder="Search name, mobile, UTR, reference" />
        <button type="button" style={s.btn("#fff", "#0c6e44", "#0c6e44")} onClick={load}>↻ Refresh</button>
      </div>

      {error ? <div style={{ ...s.card, borderColor: "#fca5a5", color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
      {loading ? <div className="adm-empty"><p className="adm-empty-text">Loading…</p></div> : null}
      {!loading && !error && !visible.length ? (
        <div className="adm-empty"><div className="adm-empty-icon">🧾</div><p className="adm-empty-text">No registrations for these filters.</p></div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {!loading && visible.map((r) => {
          const mismatch = r.amountPaid !== r.totalAmount;
          return (
            <div key={r.id} style={s.card} data-testid="preg-admin-row">
              <div style={s.row}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{r.fullName} <span style={{ color: "#64748b", fontWeight: 600 }}>· +91 {r.mobile}</span></div>
                  <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, color: "#475569" }}>{r.reference}</div>
                </div>
                <span style={s.badge(r.status)}>{STATUS[r.status]?.label || r.status}</span>
              </div>
              <div style={s.meta}>
                <div><span style={s.k}>Event:</span>{r.eventName}</div>
                <div><span style={s.k}>Date:</span>{day(r.batchDate)}{r.dateWasTyped ? <span style={s.warn}>typed</span> : null}</div>
                <div><span style={s.k}>Package:</span>{r.priceOptionLabel || r.priceOption}</div>
                <div><span style={s.k}>Pickup:</span>{r.pickupPoint}</div>
                <div><span style={s.k}>People:</span>{r.participantsCount} × {inr(r.pricePerPerson)} = <strong>{inr(r.totalAmount)}</strong></div>
                <div><span style={s.k}>Paid:</span><strong>{inr(r.amountPaid)}</strong>{mismatch ? <span style={s.warn}>{r.amountPaid < r.totalAmount ? `balance ${inr(r.totalAmount - r.amountPaid)}` : "more than total"}</span> : null}</div>
                <div><span style={s.k}>Mode:</span>{r.paymentMode} on {day(r.paymentDate)}</div>
                <div><span style={s.k}>UTR:</span><strong style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>{r.utr}</strong></div>
              </div>
              {open[r.id] ? <Detail r={r} /> : null}
              <div style={s.btns}>
                <button type="button" style={s.btn("#fff", "#334155", "#cbd5e1")} onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}>{open[r.id] ? "Hide details" : "Details"}</button>
                {r.hasScreenshot ? <button type="button" style={s.btn("#fff", "#1d4ed8", "#93c5fd")} onClick={() => viewScreenshot(r)}>🖼 Screenshot</button> : <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>No screenshot</span>}
                <a style={s.btn("#25d366")} href={waSendUrl(`Hi ${r.fullName}, this is Gadvede Trekkers about your payment registration ${r.reference} for ${r.eventName}.`, `91${r.whatsapp || r.mobile}`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                {r.status !== "verified" ? <button type="button" style={s.btn("#047857")} onClick={() => { setAction({ row: r, status: "verified" }); setNote(""); }}>✓ Mark Verified</button> : null}
                {r.status !== "rejected" ? <button type="button" style={s.btn("#fff", "#b91c1c", "#fca5a5")} onClick={() => { setAction({ row: r, status: "rejected" }); setNote(""); }}>✕ Mark Rejected</button> : null}
                {r.status !== "pending_verification" ? <button type="button" style={s.btn("#fff", "#b45309", "#fcd34d")} onClick={() => { setAction({ row: r, status: "pending_verification" }); setNote(r.adminNote || ""); }}>↺ Back to pending</button> : null}
              </div>
            </div>
          );
        })}
      </div>

      {shot ? (
        <div style={s.modalBack} onClick={() => setShot(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...s.row, marginBottom: 10 }}>
              <strong>Screenshot · {shot.reference}</strong>
              <button type="button" style={s.btn("#fff", "#334155", "#cbd5e1")} onClick={() => setShot(null)}>Close</button>
            </div>
            {shot.loading ? <p>Loading…</p> : null}
            {shot.error ? <p style={{ color: "#b91c1c" }}>{shot.error}</p> : null}
            {shot.url ? (
              <>
                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px" }}>Check UTR <strong>{shot.utr}</strong> and amount <strong>{inr(shot.amount)}</strong>. Link expires in 5 minutes.</p>
                <img src={shot.url} alt={`Payment screenshot ${shot.reference}`} style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0" }} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {action ? (
        <div style={s.modalBack} onClick={() => !saving && setAction(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ margin: "0 0 6px", fontWeight: 800 }}>{action.status === "verified" ? "Mark as Verified" : action.status === "rejected" ? "Mark as Rejected" : "Move back to Pending"}</h4>
            <p style={{ fontSize: 13, color: "#475569" }}>{action.row.reference} · {action.row.fullName} · {inr(action.row.amountPaid)} · UTR {action.row.utr}</p>
            <textarea style={{ ...s.input, minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
              placeholder={action.status === "rejected" ? "Reason (required), e.g. UTR not found in bank statement" : "Note (optional), e.g. matched in HDFC statement 27 Nov"} />
            {action.status === "rejected" && note.trim().length < 3 ? <small style={{ color: "#b91c1c" }}>Add a short reason.</small> : null}
            <div style={{ ...s.btns, justifyContent: "flex-end", marginTop: 12 }}>
              <button type="button" style={s.btn("#fff", "#334155", "#cbd5e1")} onClick={() => setAction(null)} disabled={saving}>Cancel</button>
              <button type="button" style={s.btn(action.status === "rejected" ? "#b91c1c" : action.status === "verified" ? "#047857" : "#b45309")} onClick={confirmAction} disabled={saving || (action.status === "rejected" && note.trim().length < 3)}>
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
