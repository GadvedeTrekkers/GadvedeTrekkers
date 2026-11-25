/* In-memory fake of the supabase-js chain subset used by the settings + Meta webhook routes. Not a test file. */
/** In-memory fake of the supabase-js chain subset the app uses. Rows are live objects (updates mutate them). */
export function fakeDb(tables = {}) {
  const inserted = [];
  let seq = 0;
  const from = (name) => {
    const filters = [];
    const rows = () => (tables[name] ||= []).filter(r => filters.every(([c, v]) => String(r[c]) === String(v)));
    const q = {
      select: () => q, order: () => q, limit: () => q,
      eq: (c, v) => { filters.push([c, v]); return q; },
      update: (o) => { q._upd = o; return q; },
      insert: (r) => {
        const out = r.map(x => { const row = { id: `${name}-${++seq}`, ...x }; (tables[name] ||= []).push(row); inserted.push({ table: name, row }); return row; });
        q._ins = out; return q;
      },
      upsert: (r, opts) => {
        const key = opts?.onConflict;
        q._ups = r.map(x => {
          const hit = key && (tables[name] ||= []).find(t => t[key] === x[key]);
          if (hit && opts?.ignoreDuplicates) return null;
          if (hit) return Object.assign(hit, x);
          const row = { id: `${name}-${++seq}`, ...x }; tables[name].push(row); inserted.push({ table: name, row }); return row;
        }).filter(Boolean);
        return q;
      },
      maybeSingle: async () => { const r = rows()[0] ?? null; if (r && q._upd) Object.assign(r, q._upd); return { data: r, error: null }; },
      single: async () => ({ data: q._ins?.[0] ?? null, error: null }),
      then: (res) => {
        if (q._upd) { rows().forEach(r => Object.assign(r, q._upd)); return res({ data: null, error: null }); }
        if (q._ins) return res({ data: q._ins, error: null });
        return res({ data: q._ups ?? rows(), error: null });
      },
    };
    return q;
  };
  return { from, inserted, tables };
}

/** Start an express app on an ephemeral port; returns { url, close }. (No supertest dependency.) */
export async function listen(app) {
  const server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}
