/* 3D-styled bar chart made only with CSS (works without WebGL, costs ~0 KB of JS).
   Each bar is an isometric prism: front face + lit top + shaded side. Screen readers
   get a real table instead of the drawing. */
export default function Bars3D({ title, data = [], format = (v) => v, emptyText = "No data yet", bare = false }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <figure className={bare ? "adm3d-chart adm3d-chart--bare" : "adm3d-chart adm-glass"} data-tilt={bare ? undefined : true}>
      <figcaption className={bare ? "visually-hidden" : "adm3d-chart-title"}>{title}</figcaption>
      {data.length === 0 ? (
        <p className="adm3d-chart-empty">{emptyText}</p>
      ) : (
        <>
          <div className="adm3d-bars" aria-hidden="true">
            {data.map((d, i) => (
              <div key={d.key || d.label} className="adm3d-bar-col">
                <span className="adm3d-bar-value">{format(d.value)}</span>
                <div
                  className="adm3d-bar"
                  style={{ "--h": (Number(d.value) || 0) / max, "--c": d.color || "#198754", "--i": i }}
                />
                <span className="adm3d-bar-label" title={d.label}>{d.label}</span>
              </div>
            ))}
          </div>
          <table className="visually-hidden">
            <caption>{title}</caption>
            <tbody>
              {data.map((d) => <tr key={d.key || d.label}><th scope="row">{d.label}</th><td>{format(d.value)}</td></tr>)}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
