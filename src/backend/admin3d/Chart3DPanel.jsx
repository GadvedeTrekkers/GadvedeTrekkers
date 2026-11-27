/* Dashboard hero: 3D bookings & revenue chart.
   - three.js is code-split: React.lazy() only fetches it here, and only if WebGL works.
   - No WebGL / GPU error / context lost → the CSS 3D bar chart (Bars3D), same data.
   - prefers-reduced-motion → static frame; anyone can also pause the motion. */
import { Component, Suspense, lazy, useCallback, useMemo, useState } from "react";
import { hasWebGL, useReducedMotion } from "./env3d";
import { seriesByMonth, seriesByTrip, isLive, amountOf } from "./dashboardData";
import Bars3D from "./Bars3D";

const BookingsChart3D = lazy(() => import("./BookingsChart3D"));

class SceneBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { this.props.onError?.(err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const inr = (n) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");
const inrShort = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(v >= 1000000 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return inr(v);
};
const count = (n) => String(n);

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="adm3d-seg" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" className={value === key ? "is-on" : ""} aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export default function Chart3DPanel({ bookings = [] }) {
  const reducedMotion = useReducedMotion();
  const [webgl] = useState(() => hasWebGL());
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [metric, setMetric] = useState("bookings");
  const [group, setGroup] = useState("month");
  const onError = useCallback(() => setFailed(true), []);
  const use3D = webgl && !failed;

  const data = useMemo(
    () => (group === "month" ? seriesByMonth(bookings, metric) : seriesByTrip(bookings, metric)),
    [bookings, metric, group]
  );
  const format = metric === "revenue" ? inrShort : count;
  const live = bookings.filter(isLive);
  const totalValue = data.reduce((s, d) => s + d.value, 0);
  const title = `${metric === "revenue" ? "Revenue" : "Bookings"} ${group === "month" ? "· last 6 months" : "by trip"}`;

  return (
    <section className="adm3d-panel adm-glass" aria-labelledby="adm3d-chart-title">
      <div className="adm3d-panel-head">
        <div>
          <h5 id="adm3d-chart-title" className="adm3d-panel-title">{title}</h5>
          <p className="adm3d-panel-sub">
            {metric === "revenue" ? inr(totalValue) : `${totalValue} booking${totalValue === 1 ? "" : "s"}`} shown
            {" · "}{live.length} active bookings · {inr(live.reduce((s, b) => s + amountOf(b), 0))} total
          </p>
        </div>
        <div className="adm3d-controls">
          <Segmented label="Metric" value={metric} onChange={setMetric} options={[["bookings", "Bookings"], ["revenue", "Revenue"]]} />
          <Segmented label="Group by" value={group} onChange={setGroup} options={[["month", "By month"], ["trip", "By trip"]]} />
          {use3D && !reducedMotion && (
            <button type="button" className="btn btn-sm adm3d-pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Play motion" : "Pause motion"}
            </button>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="adm3d-chart-empty">No bookings in this view yet.</p>
      ) : use3D ? (
        <>
          <div className="adm3d-scene">
            <SceneBoundary fallback={<Bars3D bare title={title} data={data} format={format} />} onError={onError}>
              <Suspense fallback={<div className="adm3d-loading">Loading 3D chart…</div>}>
                <BookingsChart3D data={data} format={format} reducedMotion={reducedMotion} paused={paused} onError={onError} />
              </Suspense>
            </SceneBoundary>
          </div>
          <table className="visually-hidden">
            <caption>{title}</caption>
            <tbody>{data.map((d) => <tr key={d.key}><th scope="row">{d.label}</th><td>{format(d.value)}</td></tr>)}</tbody>
          </table>
        </>
      ) : (
        <Bars3D bare title={title} data={data} format={format} />
      )}
    </section>
  );
}
