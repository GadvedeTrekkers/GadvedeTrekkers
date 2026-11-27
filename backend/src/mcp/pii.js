/**
 * PII masking for the read-only MCP server.
 * Default: masked. Full values only when env MCP_ALLOW_PII === "true".
 *   phone  "9876543210"          -> "******3210"   (last 4 digits only)
 *   email  "rahul.s@gmail.com"   -> "r***@gmail.com" (first character + domain)
 *   name   "Rahul Sharma"        -> "Rahul S."     (first name + last initial)
 */
export function piiAllowed(env = process.env) {
  return String(env?.MCP_ALLOW_PII || "").trim().toLowerCase() === "true";
}

export function maskPhone(value) {
  if (value === null || value === undefined || value === "") return value ?? null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "****";
  const last4 = digits.slice(-4);
  return `${"*".repeat(Math.max(4, digits.length - 4))}${last4}`;
}

export function maskEmail(value) {
  if (value === null || value === undefined || value === "") return value ?? null;
  const s = String(value).trim();
  const at = s.lastIndexOf("@");
  if (at < 1) return "***";
  return `${s[0]}***@${s.slice(at + 1)}`;
}

export function maskLastName(value) {
  if (value === null || value === undefined || value === "") return value ?? null;
  const s = String(value).trim();
  return s ? `${s[0]}.` : s;
}

export function maskFullName(value) {
  if (value === null || value === undefined || value === "") return value ?? null;
  const parts = String(value).trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Returns a masker bound to the PII setting. All helpers are identity when PII is allowed. */
export function createMasker(env = process.env) {
  const allow = piiAllowed(env);
  const id = (v) => v ?? null;
  return {
    allow,
    phone: allow ? id : maskPhone,
    email: allow ? id : maskEmail,
    lastName: allow ? id : maskLastName,
    fullName: allow ? id : maskFullName,
    /** Free-text secret-ish fields (payment refs, screenshot URLs): dropped unless PII is allowed. */
    sensitive: allow ? id : (v) => (v ? "[hidden]" : null),
  };
}
