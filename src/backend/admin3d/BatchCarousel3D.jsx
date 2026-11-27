/* Upcoming batches as a CSS-3D carousel (real 3D transforms, no WebGL needed).
   Cards sit on a ring (rotateY + translateZ); the ring turns to bring a batch to the front.
   Auto-advances every few seconds unless the user prefers reduced motion, paused it,
   or is hovering / focused inside it. Prev/next buttons, dots and arrow keys work too. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMediaQuery, useReducedMotion } from "./env3d";

const inr = (n) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");
const fmtDate = (day) => {
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
const when = (days) => (days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`);
const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Cover({ src, name }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <div className="adm3d-batch-cover adm3d-batch-cover--empty" aria-hidden="true">{initials(name)}</div>;
  return <img className="adm3d-batch-cover" src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />;
}

export default function BatchCarousel3D({ batches = [] }) {
  const reduced = useReducedMotion();
  const compact = useMediaQuery("(max-width: 640px)");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const rootRef = useRef(null);
  const n = batches.length;
  const cardW = compact ? 200 : 240;
  const ring = n >= 3;
  const step = 360 / Math.max(n, 1);
  const radius = ring ? Math.round(cardW / 2 / Math.tan(Math.PI / n)) + (compact ? 18 : 36) : 0;
  const active = n ? ((index % n) + n) % n : 0;

  useEffect(() => {
    if (!ring || reduced || paused || hold) return undefined;
    const t = setInterval(() => setIndex((i) => i + 1), 4500);
    return () => clearInterval(t);
  }, [ring, reduced, paused, hold]);

  if (!n) {
    return (
      <section className="adm3d-panel adm-glass" aria-labelledby="adm3d-batches-title">
        <h5 id="adm3d-batches-title" className="adm3d-panel-title">Upcoming batches</h5>
        <p className="adm3d-chart-empty">No upcoming batches. Add dates to a trek or tour to see them here.</p>
      </section>
    );
  }

  const go = (delta) => setIndex((i) => i + delta);
  const onKey = (e) => {
    if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
  };
  const cur = batches[active];

  return (
    <section
      ref={rootRef}
      className="adm3d-panel adm-glass"
      aria-labelledby="adm3d-batches-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => { if (!rootRef.current?.contains(e.relatedTarget)) setHold(false); }}
      onKeyDown={onKey}
    >
      <div className="adm3d-panel-head">
        <div>
          <h5 id="adm3d-batches-title" className="adm3d-panel-title">Upcoming batches</h5>
          <p className="adm3d-panel-sub">
            {n} upcoming · {batches.reduce((s, b) => s + b.seats, 0)} seats booked · {inr(batches.reduce((s, b) => s + b.total, 0))} total
          </p>
        </div>
        <div className="adm3d-controls">
          <button type="button" className="btn btn-sm adm3d-nav" onClick={() => go(-1)} aria-label="Previous batch">‹</button>
          <button type="button" className="btn btn-sm adm3d-nav" onClick={() => go(1)} aria-label="Next batch">›</button>
          {ring && !reduced && (
            <button type="button" className="btn btn-sm adm3d-pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Play" : "Pause"}
            </button>
          )}
        </div>
      </div>

      <div className={`adm3d-carousel ${ring ? "" : "adm3d-carousel--flat"}`} style={{ "--card-w": `${cardW}px` }}>
        <ul
          className="adm3d-ring"
          style={ring ? { transform: `translateZ(${-radius}px) rotateY(${-index * step}deg)` } : undefined}
        >
          {batches.map((b, i) => {
            const offset = Math.min((i - active + n) % n, (active - i + n) % n);
            const front = i === active;
            return (
              <li
                key={b.key}
                className={`adm3d-batch ${front ? "is-front" : offset === 1 ? "is-near" : "is-back"}`}
                style={ring ? { transform: `rotateY(${i * step}deg) translateZ(${radius}px)` } : undefined}
                aria-hidden={ring && !front ? "true" : undefined}
              >
                <Link to="/admin/bookings" className="adm3d-batch-card" tabIndex={ring && !front ? -1 : 0}>
                  <Cover src={b.cover} name={b.name} />
                  <span className={`adm3d-batch-when ${b.days <= 3 ? "is-soon" : ""}`}>{when(b.days)}</span>
                  <div className="adm3d-batch-body">
                    <div className="adm3d-batch-name" title={b.name}>{b.name}</div>
                    <div className="adm3d-batch-date">{fmtDate(b.date)}</div>
                    <div className="adm3d-batch-stats">
                      <span><strong>{b.seats}</strong> seat{b.seats === 1 ? "" : "s"} booked</span>
                      <span><strong>{inr(b.total)}</strong> total</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {ring && (
        <div className="adm3d-dots" role="group" aria-label="Choose batch">
          {batches.map((b, i) => (
            <button
              key={b.key}
              type="button"
              className={i === active ? "is-on" : ""}
              aria-label={`${b.name}, ${fmtDate(b.date)}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => setIndex((cur0) => cur0 + (((i - active + n) % n) <= n / 2 ? (i - active + n) % n : -((active - i + n) % n)))}
            />
          ))}
        </div>
      )}
      <p className="visually-hidden" aria-live={ring && !reduced && !paused && !hold ? "off" : "polite"}>
        {`${cur.name}, ${fmtDate(cur.date)}, ${cur.seats} seats booked, ${inr(cur.total)} total`}
      </p>
    </section>
  );
}
