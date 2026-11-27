/* In-memory fake of the supabase-js subset used by paymentRegistrations.routes.js (table + storage). Not a test file. */
export function fakeRegistrationDb() {
  const tables = { payment_registrations: [], notifications: [], activity_logs: [] };
  const objects = new Map();
  let seq = 0;
  const from = (name) => {
    const filters = []; let ors = null; let lim = null; let rng = null; let op = "select"; let payload = null;
    const rows = () => (tables[name] ||= []).filter((r) => filters.every(([c, v]) => String(r[c]) === String(v)))
      .filter((r) => !ors || ors.some(([c, t]) => String(r[c] ?? "").toLowerCase().includes(t)));
    const run = () => {
      if (op === "insert") return { data: payload, error: null };
      if (op === "update") { rows().forEach((r) => Object.assign(r, payload)); return { data: null, error: null }; }
      let out = rows().slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const count = out.length;
      if (rng) out = out.slice(rng[0], rng[1] + 1);
      if (lim != null) out = out.slice(0, lim);
      return { data: out, error: null, count };
    };
    const q = {
      select: () => q, order: () => q,
      limit: (n) => { lim = n; return q; },
      range: (a, b) => { rng = [a, b]; return q; },
      eq: (c, v) => { filters.push([c, v]); return q; },
      or: (expr) => { ors = expr.split(",").map((p) => { const [c, , t] = p.split("."); return [c, t.replace(/%/g, "").toLowerCase()]; }); return q; },
      insert: (list) => {
        op = "insert";
        payload = list.map((x) => { const row = { id: `${name}-${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...x }; (tables[name] ||= []).push(row); return row; });
        return q;
      },
      update: (o) => { op = "update"; payload = o; return q; },
      single: async () => ({ data: run().data?.[0] ?? null, error: null }),
      maybeSingle: async () => ({ data: run().data?.[0] ?? null, error: null }),
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return q;
  };
  const storage = {
    from: (bucket) => ({
      upload: async (path, buf) => { if (objects.has(`${bucket}/${path}`)) return { error: { message: "exists" } }; objects.set(`${bucket}/${path}`, buf); return { data: { path }, error: null }; },
      createSignedUrl: async (path, secs) => ({ data: { signedUrl: `/__fake-storage/${bucket}/${path}?expires=${secs}` }, error: null }),
    }),
  };
  return { from, storage, tables, objects };
}
