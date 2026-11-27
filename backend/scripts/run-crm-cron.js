/**
 * Render Cron Job entry point for CRM automations (suggested schedule: hourly, "0 * * * *").
 *   Render → New → Cron Job → same repo, Root Directory: backend, Build: npm install,
 *   Command: node scripts/run-crm-cron.js, env: BACKEND_URL + CRON_SECRET (same value as on the web service).
 * Calls POST {BACKEND_URL}/api/crm/cron/run. Prints counts only, never the secret or any customer data.
 * The web service decides what happens: nothing is sent unless CRM_AUTOMATIONS_LIVE=true and a toggle is ON.
 */
/* global process */
const base = String(process.env.BACKEND_URL || "").replace(/\/$/, "");
const secret = process.env.CRON_SECRET || "";
if (!/^https?:\/\//.test(base) || secret.length < 24) {
  console.error("run-crm-cron: set BACKEND_URL and CRON_SECRET (24+ characters).");
  process.exit(1);
}
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 120_000); // Render free web services can take ~60 s to wake up
try {
  const res = await fetch(`${base}/api/crm/cron/run`, { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: ctrl.signal });
  const body = await res.json().catch(() => ({}));
  console.log(`run-crm-cron: HTTP ${res.status}`, JSON.stringify(body?.data ?? { error: body?.error }));
  process.exit(res.ok ? 0 : 1);
} catch (e) {
  console.error("run-crm-cron: request failed:", e?.name || "error");
  process.exit(1);
} finally { clearTimeout(timer); }
