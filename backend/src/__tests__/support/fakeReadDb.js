/* Chainable read-only fake of supabase-js used by the MCP tests. Records every call. Not a test file. */
export function fakeReadDb(tables = {}) {
  const calls = [];
  const from = (name) => {
    const log = { table: name, ops: [] };
    calls.push(log);
    const filters = []; let range = null; let orderBy = null; let lim = null; let wantCount = false;
    const rec = (op, ...args) => log.ops.push([op, ...args]);
    const run = () => {
      let rows = (tables[name] || []).filter((r) => filters.every((f) => f(r)));
      const count = rows.length;
      if (orderBy) {
        const [c, asc] = orderBy;
        rows = [...rows].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : String(a[c]) > String(b[c]) ? 1 : 0) * (asc ? 1 : -1));
      }
      if (range) rows = rows.slice(range[0], range[1] + 1);
      if (lim != null) rows = rows.slice(0, lim);
      return { data: rows, error: null, count: wantCount ? count : null };
    };
    const q = {
      select: (cols, opts) => { rec("select", cols, opts); wantCount = Boolean(opts?.count); return q; },
      eq: (c, v) => { rec("eq", c, v); filters.push((r) => String(r[c]) === String(v)); return q; },
      gte: (c, v) => { rec("gte", c, v); filters.push((r) => r[c] != null && String(r[c]) >= String(v)); return q; },
      lte: (c, v) => { rec("lte", c, v); filters.push((r) => r[c] != null && String(r[c]) <= String(v)); return q; },
      in: (c, vs) => { rec("in", c, vs); filters.push((r) => vs.map(String).includes(String(r[c]))); return q; },
      ilike: (c, pat) => {
        rec("ilike", c, pat);
        const needle = pat.replace(/%/g, "").toLowerCase();
        filters.push((r) => String(r[c] || "").toLowerCase().includes(needle)); return q;
      },
      order: (c, o) => { rec("order", c, o); if (!orderBy) orderBy = [c, o?.ascending !== false]; return q; },
      range: (a, b) => { rec("range", a, b); range = [a, b]; return q; },
      limit: (n) => { rec("limit", n); lim = n; return q; },
      maybeSingle: async () => { rec("maybeSingle"); const r = run(); return { data: r.data[0] ?? null, error: null }; },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    for (const w of ["insert", "update", "upsert", "delete", "rpc"]) q[w] = () => { throw new Error(`write ${w} attempted on ${name}`); };
    return q;
  };
  return { from, calls, tables };
}
