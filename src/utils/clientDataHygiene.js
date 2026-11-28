/* ══════════════════════════════════════════════
   clientDataHygiene.js — Gadvede Trekkers
   Imported first from main.jsx so it runs before any storage module.

   Older builds seeded staff logins (with passwords), customer and booking
   lists into every visitor's localStorage. Nothing reads those keys any
   more, so remove them from browsers that still have them.
══════════════════════════════════════════════ */

export const LEGACY_SENSITIVE_KEYS = ["gt_employee_creds", "gt_customers", "gt_bookings"];

const ONBOARDING_KEY = "gt_employee_onboarding";

/* Demo/sample data for the admin panel and employee portal is only seeded
   for a signed-in admin/employee inside those areas, never for public visitors
   (login pages included). */
export function isStaffArea() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || "";
  const inStaffPages = path.startsWith("/admin/") || path.startsWith("/employee/");
  if (!inStaffPages) return false;
  try {
    const hasAdmin = Boolean(localStorage.getItem("gt_admin_token") || sessionStorage.getItem("gt_admin_token"));
    const hasEmployee = Boolean(sessionStorage.getItem("gt_emp"));
    return hasAdmin || hasEmployee;
  } catch {
    return false;
  }
}

/* Keep onboarding records an admin created (not the old seed logins), minus passwords. */
function migrateOnboardingRecords() {
  try {
    const raw = window.localStorage.getItem("gt_employee_creds");
    if (!raw) return;
    const legacy = JSON.parse(raw);
    if (!Array.isArray(legacy)) return;
    const real = legacy
      .filter((c) => c && c.employeeId && !String(c.credId || "").startsWith("CRED-SEED-"))
      .map((c) => { const rest = { ...c }; delete rest.password; return rest; });
    if (real.length === 0) return;
    const existing = JSON.parse(window.localStorage.getItem(ONBOARDING_KEY) || "[]");
    const ids = new Set(existing.map((c) => c.employeeId));
    window.localStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify([...existing, ...real.filter((c) => !ids.has(c.employeeId))])
    );
  } catch {
    /* ignore malformed legacy data */
  }
}

export function purgeLegacyClientData() {
  if (typeof window === "undefined" || !window.localStorage) return;
  migrateOnboardingRecords();
  LEGACY_SENSITIVE_KEYS.forEach((key) => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

purgeLegacyClientData();
