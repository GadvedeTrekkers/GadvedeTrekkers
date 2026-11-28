/* In-memory fake of the supabase-js subset used by the CRM automations code. Not a test file.
 * Unique indexes (like the real migration 020) make a duplicate insert fail with code 23505. */
export function fakeCrmDb(tables = {}, { unique = { crm_message_log: "idempotency_key", crm_opt_outs: "contact" }, failInsert = {} } = {}) {
  let seq = 0;
  const writes = [];
  const from = (name) => {
    const filters = []; let op = "select"; let payload = null; let lim = null; let rng = null; let opts = null;
    const t = () => (tables[name] ||= []);
    const match = (r) => filters.every((f) => f(r));
    const run = () => {
      if (op === "insert") {
        if (failInsert[name]) return { data: null, error: failInsert[name] };
        const key = unique[name];
        for (const x of payload) if (key && t().some((r) => r[key] === x[key])) return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
        const out = payload.map((x) => { const row = { id: `${name}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...x }; t().push(row); return row; });
        writes.push({ op, table: name, rows: out });
        return { data: out, error: null };
      }
      if (op === "upsert") {
        const key = opts?.onConflict;
        const out = [];
        for (const x of payload) {
          const hit = key && t().find((r) => r[key] === x[key]);
          if (hit) { if (!opts?.ignoreDuplicates) { Object.assign(hit, x); out.push(hit); } continue; }
          const row = { id: `${name}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...x }; t().push(row); out.push(row);
        }
        writes.push({ op, table: name, rows: out });
        return { data: out, error: null };
      }
      if (op === "update") { const hit = t().filter(match); hit.forEach((r) => Object.assign(r, payload)); writes.push({ op, table: name, rows: hit }); return { data: null, error: null }; }
      let out = t().filter(match).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const count = out.length;
      if (rng) out = out.slice(rng[0], rng[1] + 1);
      if (lim != null) out = out.slice(0, lim);
      return { data: out, error: null, count };
    };
    const q = {
      select: () => q, order: () => q,
      limit: (n) => { lim = n; return q; },
      range: (a, b) => { rng = [a, b]; return q; },
      eq: (c, v) => { filters.push((r) => String(r[c]) === String(v)); return q; },
      in: (c, list) => { const set = new Set(list.map(String)); filters.push((r) => set.has(String(r[c]))); return q; },
      is: (c, v) => { filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return q; },
      gte: (c, v) => { filters.push((r) => r[c] != null && String(r[c]) >= String(v)); return q; },
      lte: (c, v) => { filters.push((r) => r[c] != null && String(r[c]) <= String(v)); return q; },
      insert: (list) => { op = "insert"; payload = list; return q; },
      upsert: (list, o) => { op = "upsert"; payload = list; opts = o; return q; },
      update: (o) => { op = "update"; payload = o; return q; },
      single: async () => { const r = run(); return { data: r.data?.[0] ?? null, error: r.error }; },
      maybeSingle: async () => { const r = run(); return { data: r.data?.[0] ?? null, error: r.error }; },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return q;
  };
  return { from, tables, writes };
}
