/* ══════════════════════════════════════════════
   employeePortalStorage.js — Gadvede Trekkers
   Employee onboarding approval + portal session
   Approval: Akshay Kangude / Pratik Ubhe
   Passwords are never stored or checked in the browser: login goes to the
   backend (POST /api/auth/admin/login, accounts in the ADMIN_USERS env var).
══════════════════════════════════════════════ */
import { apiRequest } from "../api/backendClient";

const KEY = "gt_employee_onboarding";

function _uid() {
  return `CRED-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function _refCode(name, employeeId) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3);
  const suffix   = (employeeId || "").replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `REF-${initials}${suffix}`;
}

function _slugify(name) {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
}

export function getAllCredentials() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function _save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

/* Called from EmployeeOnboarding when admin clicks "Generate Portal Credentials" */
export function createEmployeeCredentials({ employeeId, fullName }) {
  const all = getAllCredentials();
  // Don't duplicate
  if (all.find(c => c.employeeId === employeeId)) return all.find(c => c.employeeId === employeeId);

  const username = _slugify(fullName);
  // The login password is set by the admin on the server (ADMIN_USERS), not here.

  const cred = {
    credId: _uid(),
    employeeId,
    fullName,
    username,
    referralCode: _refCode(fullName, employeeId),
    onboardingStatus: "PENDING",   // PENDING | APPROVED | REJECTED
    approvedBy: null,
    approvedByUsername: null,
    approvedAt: null,
    rejectedReason: "",
    createdAt: new Date().toISOString(),
  };
  _save([cred, ...all]);
  return cred;
}

export function getCredentialsByEmployeeId(employeeId) {
  return getAllCredentials().find(c => c.employeeId === employeeId) || null;
}

export function getCredentialsByUsername(username) {
  return getAllCredentials().find(c => c.username === username) || null;
}

/* Approve onboarding — only Akshay/Pratik */
export function approveOnboarding(employeeId) {
  try {
    const actor = JSON.parse(sessionStorage.getItem("gt_user")) || {};
    const allowed = ["akshay.kangude", "pratik.ubhe", "admin"];
    if (!allowed.includes(actor.username)) return { ok: false, error: "Not authorised" };

    const all = getAllCredentials().map(c =>
      c.employeeId === employeeId
        ? { ...c, onboardingStatus: "APPROVED", approvedBy: actor.name, approvedByUsername: actor.username, approvedAt: new Date().toISOString(), rejectedReason: "" }
        : c
    );
    _save(all);
    return { ok: true };
  } catch { return { ok: false, error: "Unknown error" }; }
}

/* Reject onboarding */
export function rejectOnboarding(employeeId, reason) {
  try {
    const actor = JSON.parse(sessionStorage.getItem("gt_user")) || {};
    const all = getAllCredentials().map(c =>
      c.employeeId === employeeId
        ? { ...c, onboardingStatus: "REJECTED", approvedBy: actor.name, approvedByUsername: actor.username, approvedAt: new Date().toISOString(), rejectedReason: reason || "" }
        : c
    );
    _save(all);
    return { ok: true };
  } catch { return { ok: false, error: "Unknown error" }; }
}

export function getPendingOnboardings() {
  return getAllCredentials().filter(c => c.onboardingStatus === "PENDING");
}

/* Employee login — verified by the backend; returns { ok, cred } or { ok: false, error } */
export async function employeeLogin(username, password) {
  let user;
  try {
    user = await apiRequest("/api/auth/admin/login", { method: "POST", body: { username, password } });
  } catch {
    return { ok: false, error: "Invalid username or password." };
  }
  if (!user?.username) return { ok: false, error: "Invalid username or password." };
  const local = getCredentialsByUsername(user.username);
  if (local?.onboardingStatus === "PENDING")  return { ok: false, error: "Your onboarding request is pending approval." };
  if (local?.onboardingStatus === "REJECTED") return { ok: false, error: `Your onboarding was rejected: ${local.rejectedReason || "Contact admin."}` };
  return {
    ok: true,
    cred: {
      employeeId:   local?.employeeId || `EMP-${user.username.toUpperCase()}`,
      username:     user.username,
      fullName:     user.name || local?.fullName || user.username,
      referralCode: local?.referralCode || "",
    },
  };
}

/* Session helpers */
export function setEmployeeSession(cred) {
  sessionStorage.setItem("gt_emp", JSON.stringify({
    employeeId: cred.employeeId,
    username:   cred.username,
    fullName:   cred.fullName,
    referralCode: cred.referralCode,
  }));
}

export function getEmployeeSession() {
  try { return JSON.parse(sessionStorage.getItem("gt_emp")) || null; }
  catch { return null; }
}

export function clearEmployeeSession() {
  sessionStorage.removeItem("gt_emp");
}
