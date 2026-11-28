import React, { useEffect, useMemo, useState } from "react";
import { reportsApi } from "../../api/reports.api";
import { getCurrentAdminUser } from "../../data/permissionStorage";
import {
  barPct, canViewReportInsights, dayLabel, fmtCompactINR, fmtINR, fmtPct, monthLabel, niceMax, presetRange, PRESETS, rangeProblem, SOURCE_COLORS,
} from "./reportsView";
import "./reports.css";

/* Admin → Reports → Sales Insights. Read only: it only loads numbers (GET) and shows them.
   There is no export, download, edit or delete control here, and customers are shown masked. */

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`rp-kpi${tone ? ` rp-kpi--${tone}` : ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub ? <em>{sub}</em> : null}
    </div>
  );
}

function Section({ id, title, hint, wide, children }) {
  return (
    <section className={`rp-card${wide ? " rp-card--wide" : ""}`} aria-labelledby={`rp-${id}`} data-testid={`rp-section-${id}`}>
      <header className="rp-card-head">
        <h4 id={`rp-${id}`}>{title}</h4>
        {hint ? <p>{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ children = "No data for this period." }) {
  return <p className="rp-empty">{children}</p>;
}

/* Stacked columns: collected (green) + pending (amber) per month. Plain SVG, scales to its container. */
function MonthlyChart({ data }) {
  if (!data.length) return <Empty />;
  const W = 640, H = 230, padL = 46, padR = 8, padT = 12, padB = 30;
  const top = niceMax(Math.max(...data.map((d) => d.booked)));
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const slot = innerW / data.length;
  const bw = Math.min(46, slot * 0.62);
  const y = (v) => padT + innerH - (v / top) * innerH;
  const every = data.length > 9 ? Math.ceil(data.length / 9) : 1;
  const summary = data.map((d) => `${monthLabel(d.month)}: ${fmtINR(d.booked)} booked, ${fmtINR(d.collected)} collected`).join("; ");
  return (
    <svg className="rp-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Revenue per month. ${summary}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(top * t)} y2={y(top * t)} className="rp-grid" />
          <text x={padL - 6} y={y(top * t) + 3} textAnchor="end" className="rp-axis">{fmtCompactINR(top * t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + slot * i + (slot - bw) / 2;
        const hc = (d.collected / top) * innerH;
        const hp = (d.pending / top) * innerH;
        return (
          <g key={d.month}>
            <title>{`${monthLabel(d.month)} — booked ${fmtINR(d.booked)} (collected ${fmtINR(d.collected)}, pending ${fmtINR(d.pending)}) · ${d.bookings} bookings`}</title>
            {hp > 0 && <rect x={x} y={y(d.collected + d.pending)} width={bw} height={hp} rx="3" className="rp-bar-pending" />}
            {hc > 0 && <rect x={x} y={padT + innerH - hc} width={bw} height={hc} rx="3" className="rp-bar-collected" />}
            {i % every === 0 && <text x={x + bw / 2} y={H - 10} textAnchor="middle" className="rp-axis">{monthLabel(d.month)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function SplitBar({ collected, pending, max }) {
  const c = barPct(collected, max, 0);
  const p = barPct(pending, max, 0);
  return (
    <div className="rp-split" aria-hidden="true">
      <span className="rp-split-c" style={{ width: `${c}%` }} />
      <span className="rp-split-p" style={{ width: `${Math.min(p, 100 - c)}%` }} />
    </div>
  );
}

function RevenueSection({ revenue }) {
  const maxTrip = Math.max(0, ...revenue.byTrip.map((t) => t.booked));
  return (
    <Section wide id="revenue" title="Revenue per trip and per month" hint="Booked value split into money collected and money still pending. Cancelled and failed bookings are left out.">
      <div className="rp-legend"><i className="rp-dot rp-dot--c" /> Collected <i className="rp-dot rp-dot--p" /> Pending
        <span className="rp-legend-note">{revenue.totals.cancelled} cancelled · {revenue.totals.failed} failed payments not counted</span>
      </div>
      <MonthlyChart data={revenue.byMonth} />
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr><th>Trip</th><th className="rp-num">Bookings</th><th className="rp-num rp-hide-sm">Travellers</th><th className="rp-num">Booked</th><th className="rp-num">Collected</th><th className="rp-num">Pending</th><th className="rp-hide-sm">Split</th></tr>
          </thead>
          <tbody>
            {revenue.byTrip.length === 0 && <tr><td colSpan={7} className="rp-empty-cell"><Empty /></td></tr>}
            {revenue.byTrip.map((t) => (
              <tr key={t.tripId || "none"}>
                <td data-label="Trip"><span className="rp-strong">{t.name}</span>{t.type ? <span className="rp-chip">{t.type}</span> : null}</td>
                <td className="rp-num" data-label="Bookings">{t.bookings}</td>
                <td className="rp-num rp-hide-sm" data-label="Travellers">{t.pax}</td>
                <td className="rp-num" data-label="Booked">{fmtINR(t.booked)} <small className="rp-muted">{fmtPct(t.share)}</small></td>
                <td className="rp-num" data-label="Collected">{fmtINR(t.collected)}</td>
                <td className="rp-num" data-label="Pending">{fmtINR(t.pending)}</td>
                <td className="rp-hide-sm"><SplitBar collected={t.collected} pending={t.pending} max={maxTrip} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ConversionSection({ conversion }) {
  const o = conversion.overall;
  const maxEnq = Math.max(0, ...conversion.byTrip.map((t) => t.enquiries));
  return (
    <Section id="conversion" title="Enquiries that became bookings" hint="An enquiry counts as booked when it is marked Converted, linked to a booking, or the same mobile number or email booked afterwards.">
      <div className="rp-funnel">
        <div className="rp-funnel-row"><span>Enquiries</span><div className="rp-track"><span className="rp-fill rp-fill--soft" style={{ width: o.enquiries ? "100%" : "0%" }} /></div><b>{o.enquiries}</b></div>
        <div className="rp-funnel-row"><span>Booked</span><div className="rp-track"><span className="rp-fill" style={{ width: `${barPct(o.converted, o.enquiries, 0)}%` }} /></div><b>{o.converted}</b></div>
        <div className="rp-big" aria-label={`Conversion rate ${fmtPct(o.rate)}`}>{fmtPct(o.rate)}<small>conversion</small></div>
      </div>
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead><tr><th>Trip</th><th className="rp-num">Enquiries</th><th className="rp-num">Booked</th><th className="rp-num">Rate</th><th className="rp-hide-sm">Conversion</th></tr></thead>
          <tbody>
            {conversion.byTrip.length === 0 && <tr><td colSpan={5} className="rp-empty-cell"><Empty /></td></tr>}
            {conversion.byTrip.map((t) => (
              <tr key={t.tripId || "none"}>
                <td data-label="Trip" className="rp-strong">{t.name}</td>
                <td className="rp-num" data-label="Enquiries">{t.enquiries}</td>
                <td className="rp-num" data-label="Booked">{t.converted}</td>
                <td className="rp-num" data-label="Rate"><b>{fmtPct(t.rate)}</b></td>
                <td className="rp-hide-sm">
                  <div className="rp-track rp-track--sm"><span className="rp-fill rp-fill--soft" style={{ width: `${barPct(t.enquiries, maxEnq)}%` }}><span className="rp-fill" style={{ width: `${t.rate}%` }} /></span></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function SourcesSection({ sources, sourceColumn }) {
  const max = Math.max(0, ...sources.bySource.map((s) => s.enquiries));
  return (
    <Section id="sources" title="Where leads come from" hint="Enquiries by source, and how many of each booked.">
      <ul className="rp-sources">
        {sources.bySource.map((s) => (
          <li key={s.key} data-testid={`rp-source-${s.key}`}>
            <div className="rp-source-top">
              <span className="rp-strong"><i className="rp-dot" style={{ background: SOURCE_COLORS[s.key] }} /> {s.label}</span>
              <span className="rp-muted">{s.enquiries} enquiries · {s.converted} booked · <b>{fmtPct(s.rate)}</b></span>
            </div>
            <div className="rp-track">
              <span className="rp-fill rp-fill--soft" style={{ width: `${barPct(s.enquiries, max)}%`, background: `${SOURCE_COLORS[s.key]}33` }}>
                <span className="rp-fill" style={{ width: `${s.rate}%`, background: SOURCE_COLORS[s.key] }} />
              </span>
            </div>
            {s.bookedValue > 0 && <small className="rp-muted">Bookings from these enquiries: {fmtINR(s.bookedValue)}</small>}
          </li>
        ))}
      </ul>
      {sources.total === 0 && <Empty />}
      <p className="rp-note">
        {sources.bookingsWithoutEnquiry} booking{sources.bookingsWithoutEnquiry === 1 ? "" : "s"} in this period had no matching enquiry (walk-ins, repeat guests or direct bookings).
        {sources.unknownShare >= 20 && sources.total > 0 ? ` ${fmtPct(sources.unknownShare)} of enquiries have no source recorded, so the other shares may be understated.` : ""}
        {sourceColumn === false ? " Lead sources are not recorded yet (the Instagram/WhatsApp update has not been applied), so only enquiries with a tagged page link are placed." : ""}
        {" "}Google is counted only when the enquiry came from a tagged link (utm_source=google or a Google click id).
      </p>
    </Section>
  );
}

function RepeatSection({ repeat }) {
  return (
    <Section wide id="repeat" title="Repeat customers" hint="People with 2 or more bookings in this period, matched by mobile number (or email). Details are masked.">
      <div className="rp-mini-kpis">
        <Kpi label="Repeat customers" value={`${repeat.repeatCustomers} of ${repeat.uniqueCustomers}`} sub={`${fmtPct(repeat.repeatRate)} of customers`} />
        <Kpi label="Share of revenue" value={fmtPct(repeat.revenueShare)} sub={`${fmtINR(repeat.repeatBookedValue)} booked`} />
        <Kpi label="Bookings each" value={String(repeat.avgBookingsPerRepeat)} sub={`${repeat.repeatBookings} bookings in total`} />
      </div>
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead><tr><th>Customer</th><th>Contact</th><th className="rp-num">Bookings</th><th className="rp-num rp-hide-sm">Trips</th><th className="rp-num">Booked</th><th className="rp-num">Revenue share</th><th className="rp-hide-sm">First – last</th></tr></thead>
          <tbody>
            {repeat.top.length === 0 && <tr><td colSpan={7} className="rp-empty-cell"><Empty>No repeat customers in this period.</Empty></td></tr>}
            {repeat.top.map((c, i) => (
              <tr key={`${c.phone || c.email}-${i}`}>
                <td data-label="Customer" className="rp-strong">{c.name}</td>
                <td data-label="Contact" className="rp-muted">{c.phone || c.email || "—"}</td>
                <td className="rp-num" data-label="Bookings"><b>{c.bookings}</b></td>
                <td className="rp-num rp-hide-sm" data-label="Trips">{c.trips}</td>
                <td className="rp-num" data-label="Booked">{fmtINR(c.bookedValue)}</td>
                <td className="rp-num" data-label="Revenue share">{fmtPct(c.share)}</td>
                <td className="rp-hide-sm rp-muted">{dayLabel(c.firstBooking)} – {dayLabel(c.lastBooking)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Kpis({ k }) {
  return (
    <div className="rp-kpis" data-testid="rp-kpis">
      <Kpi tone="hero" label="Booked value" value={fmtCompactINR(k.bookedValue)} sub={`${k.bookings} bookings · ${k.travellers} travellers`} />
      <Kpi label="Collected" value={fmtCompactINR(k.collected)} sub={fmtINR(k.collected)} />
      <Kpi tone="warn" label="Pending" value={fmtCompactINR(k.pending)} sub="balance still to be paid" />
      <Kpi label="Average booking" value={fmtINR(k.avgBookingValue)} sub={k.topTrip ? `Top trip: ${k.topTrip.name}` : "No bookings yet"} />
      <Kpi label="Enquiries" value={String(k.enquiries)} sub={k.topSource ? `Most from ${k.topSource.label}` : "No enquiries yet"} />
      <Kpi tone="good" label="Enquiry → booking" value={fmtPct(k.conversionRate)} sub="conversion rate" />
      <Kpi label="Repeat customers" value={fmtPct(k.repeatRate)} sub={`${fmtPct(k.repeatRevenueShare)} of booked value`} />
    </div>
  );
}

export default function ReportsInsights() {
  const role = getCurrentAdminUser()?.role;
  const allowed = canViewReportInsights(role);
  const [preset, setPreset] = useState("12m");
  const [range, setRange] = useState(() => presetRange("12m"));
  const [trip, setTrip] = useState("");
  const [trips, setTrips] = useState([]);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key: "", data: null, error: null });

  const problem = rangeProblem(range);
  const key = `${range.from}|${range.to}|${trip}|${tick}`;

  useEffect(() => {
    if (!allowed) return undefined;
    let live = true;
    reportsApi.trips().then((t) => { if (live) setTrips(t || []); }).catch(() => {});
    return () => { live = false; };
  }, [allowed]);

  useEffect(() => {
    if (!allowed || problem) return undefined;
    const ctl = new AbortController();
    reportsApi.overview({ from: range.from, to: range.to, trip }, { signal: ctl.signal })
      .then((data) => setState({ key, data, error: null }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ key, data: null, error }); });
    return () => ctl.abort();
  }, [allowed, problem, range.from, range.to, trip, key]);

  const loading = !problem && state.key !== key;
  const pickPreset = (id) => { setPreset(id); setRange(presetRange(id)); };
  const setDate = (name, value) => { setPreset("custom"); setRange((r) => ({ ...r, [name]: value })); };
  const reset = () => { setPreset("12m"); setRange(presetRange("12m")); setTrip(""); };
  const tripName = useMemo(() => trips.find((t) => t.id === trip)?.name || "", [trips, trip]);

  if (!allowed) {
    return (
      <div className="rp-wrap"><div className="rp-card rp-locked" role="status">
        <h4>🔒 Sales insights are for Management and Admin</h4>
        <p>These reports show revenue figures, so they are limited to the Management, Admin and Super Admin roles.</p>
      </div></div>
    );
  }

  const d = state.data;
  return (
    <div className="rp-wrap" data-testid="reports-insights" aria-busy={loading}>
      <div className="rp-filters" role="group" aria-label="Report filters">
        <div className="rp-presets">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={`rp-pill${preset === p.id ? " rp-pill--on" : ""}`} aria-pressed={preset === p.id} onClick={() => pickPreset(p.id)}>{p.label}</button>
          ))}
        </div>
        <label className="rp-field">From
          <input type="date" value={range.from} max={range.to || undefined} onChange={(e) => setDate("from", e.target.value)} />
        </label>
        <label className="rp-field">To
          <input type="date" value={range.to} min={range.from || undefined} onChange={(e) => setDate("to", e.target.value)} />
        </label>
        <label className="rp-field rp-field--trip">Trip
          <select value={trip} onChange={(e) => setTrip(e.target.value)}>
            <option value="">All trips</option>
            {trips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <div className="rp-actions">
          <button type="button" className="rp-btn" onClick={() => setTick((n) => n + 1)} disabled={loading || Boolean(problem)}>🔄 Refresh</button>
          <button type="button" className="rp-btn rp-btn--ghost" onClick={reset}>Reset</button>
        </div>
      </div>
      {problem && <p className="rp-alert" role="alert">{problem}</p>}
      {state.error && !loading && (
        <p className="rp-alert" role="alert">
          {state.error.status === 403 ? "Your role cannot open these reports." : state.error.message}
        </p>
      )}
      <p className="rp-scope" aria-live="polite">
        {range.from || range.to ? `${range.from ? dayLabel(range.from) : "Start"} – ${range.to ? dayLabel(range.to) : "today"}` : "All time"}
        {tripName ? ` · ${tripName}` : " · All trips"}
        {loading ? " · loading…" : ""}
      </p>
      {d?.meta?.truncated && <p className="rp-alert" role="status">There are more than {d.meta.rowCap.toLocaleString("en-IN")} records, so the oldest ones are not included. Pick a shorter period for exact figures.</p>}

      {d && (
        <div className={loading ? "rp-dim" : undefined}>
          <Kpis k={d.kpis} />
          <div className="rp-grid-2">
            <RevenueSection revenue={d.revenue} />
            <ConversionSection conversion={d.conversion} />
            <SourcesSection sources={d.sources} sourceColumn={d.meta?.sourceColumn} />
            <RepeatSection repeat={d.repeat} />
          </div>
          <details className="rp-how">
            <summary>How these numbers are worked out</summary>
            <ul>
              <li>Dates are Indian dates. Revenue is counted on the booking date, enquiries on the date they came in.</li>
              <li>Booked value is the booking total. Collected is the total minus the balance still due. Bookings waiting for payment approval count fully as pending.</li>
              <li>Cancelled bookings and failed payments are left out. Refunds are not subtracted.</li>
              <li>Customers are matched by the last 10 digits of the mobile number, or the email when there is no number.</li>
              <li>Names, phone numbers and emails are always masked on this page.</li>
            </ul>
          </details>
        </div>
      )}
      {!d && loading && <p className="rp-empty">Loading reports…</p>}
    </div>
  );
}
