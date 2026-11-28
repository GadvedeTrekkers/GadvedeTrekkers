/**
 * Confirmation email for /register payment registrations (Pratik, t83u):
 * "Once form is filled by customer they should receive confirmation email from Gadvede Trekkers".
 *
 * Reuses the existing mailer in emailService.js (nodemailer, Gmail, env GMAIL_USER + GMAIL_APP_PASSWORD).
 * Sender: "Gadvede Trekkers" <GMAIL_USER>. Recipient: ONLY the email the customer typed (validated server-side).
 * Optional admin notice to ADMIN_NOTIFY_EMAIL (comma-separated; unset = off).
 * Everything the customer typed is HTML-escaped. Callers must not await this in the request path.
 * Profile Setup (t84u): when a business profile is passed, the display name is its company name and Reply-To is its
 * booking-confirmation email (falls back to the public support email, then to no Reply-To = old behaviour).
 * The sending account stays GMAIL_USER.
 */
import { createTransporter } from "./emailService.js";
import { emailRouting } from "./businessProfile.js";

export const SENDER_NAME = "Gadvede Trekkers";
export const WHATSAPP_DISPLAY = "+91 98561 12727";
export const WHATSAPP_LINK = "https://wa.me/919856112727";
export const SITE_URL = "https://www.gadvede.com/";
const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const oneLine = (v, max = 150) => String(v ?? "").replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
function day(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function isConfigured(env = process.env) {
  return Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
}

/** row = the saved payment_registrations row (snake_case) incl. reference. */
export function buildRegistrationEmail(row) {
  const total = Number(row.total_amount || 0);
  const paid = Number(row.amount_paid || 0);
  const balance = Math.max(0, total - paid);
  const dateText = row.date_was_typed ? `${day(row.batch_date)} (date you entered)` : (row.batch_label || day(row.batch_date));
  const participants = [{ name: row.full_name, age: row.age, gender: row.gender }, ...(Array.isArray(row.participants) ? row.participants : [])];
  const firstName = oneLine(row.full_name, 100).split(" ")[0] || "there";

  const rows = [
    ["Reference number", row.reference],
    ["Event", row.event_name],
    ["Package", row.price_option_label || row.price_option],
    ["Date", dateText],
    ["Pickup point", row.pickup_point],
    ["Participants", `${row.participants_count} × ${inr(row.price_per_person)}`],
    ["Total amount", inr(total)],
    ["Amount paid", `${inr(paid)} (${row.payment_mode}${row.payment_date ? `, ${day(row.payment_date)}` : ""})`],
    ["Balance", balance ? inr(balance) : "₹0 — fully paid"],
    ["UTR / reference", row.utr],
    ["Status", "Pending verification – we'll confirm shortly"],
  ];

  const subject = oneLine(`Payment details received – ${row.reference} – ${row.event_name}`, 200);

  const tr = (k, v, strong = false) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e7f1ec;color:#5b7268;font-size:14px;width:38%;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e7f1ec;color:#103528;font-size:14px;font-weight:${strong ? 800 : 600};vertical-align:top;word-break:break-word;">${escapeHtml(v)}</td>
        </tr>`;

  const participantList = participants
    .map((p, i) => `<li style="margin:2px 0;">${escapeHtml(oneLine(p.name, 100))}${p.age ? `, ${escapeHtml(p.age)}` : ""}${p.gender ? `, ${escapeHtml(p.gender)}` : ""}${i === 0 ? " (you)" : ""}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef8f3;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">We received your payment details. Reference ${escapeHtml(row.reference)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef8f3;padding:16px 8px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dcefe5;">
        <tr><td style="background:#0a6a47;background-image:linear-gradient(135deg,#09532f,#1a9b65);padding:26px 22px;text-align:center;">
          <div style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:.3px;">Gadvede Trekkers</div>
          <div style="color:#c9f2dc;font-size:14px;margin-top:6px;">Payment details received</div>
        </td></tr>
        <tr><td style="padding:24px 22px 8px;">
          <p style="margin:0 0 10px;color:#103528;font-size:17px;font-weight:700;">Hi ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 16px;color:#3b5248;font-size:15px;line-height:1.55;">Thank you! We have received your payment details for <strong>${escapeHtml(row.event_name)}</strong>. Our team will check the payment with our bank and confirm your seat on WhatsApp.</p>
          <div style="text-align:center;margin:0 0 18px;padding:14px;border:1px dashed #1a9b65;border-radius:12px;background:#f0faf5;">
            <div style="color:#5b7268;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Your reference number</div>
            <div style="color:#0a6a47;font-size:24px;font-weight:800;font-family:'Courier New',monospace;margin-top:4px;">${escapeHtml(row.reference)}</div>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dcefe5;border-radius:12px;border-collapse:separate;overflow:hidden;">${rows.map(([k, v], i) => tr(k, v, i === 0 || k === "Total amount" || k === "Balance")).join("")}
          </table>
          <p style="margin:16px 0 4px;color:#5b7268;font-size:13px;font-weight:700;">Participants</p>
          <ol style="margin:0 0 16px 18px;padding:0;color:#103528;font-size:14px;">${participantList}</ol>
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;color:#92400e;font-size:14px;line-height:1.5;margin:0 0 18px;">
            <strong>Status: Pending verification – we'll confirm shortly.</strong><br>
            Please keep this email and your payment screenshot until your seat is confirmed.
          </div>
          <p style="margin:0 0 14px;color:#3b5248;font-size:14px;line-height:1.55;">Questions? WhatsApp or call us on <a href="${WHATSAPP_LINK}" style="color:#0a6a47;font-weight:700;">${WHATSAPP_DISPLAY}</a> and mention your reference number.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;"><tr>
            <td style="padding:4px;"><a href="${WHATSAPP_LINK}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">WhatsApp ${WHATSAPP_DISPLAY}</a></td>
            <td style="padding:4px;"><a href="${SITE_URL}" style="display:inline-block;background:#0a6a47;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Visit gadvede.com</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#f6fbf8;border-top:1px solid #e7f1ec;padding:14px 22px;text-align:center;color:#7b8f86;font-size:12px;line-height:1.5;">
          Gadvede Trekkers · Pune, Maharashtra · <a href="${SITE_URL}" style="color:#0a6a47;">www.gadvede.com</a><br>
          You received this email because you submitted a payment registration on our website.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${oneLine(firstName)},`,
    "",
    `Thank you! We have received your payment details for ${oneLine(row.event_name)}.`,
    "Our team will check the payment with our bank and confirm your seat on WhatsApp.",
    "",
    ...rows.map(([k, v]) => `${k}: ${oneLine(v, 300)}`),
    "",
    "Participants:",
    ...participants.map((p, i) => `  ${i + 1}. ${oneLine(p.name, 100)}${p.age ? `, ${p.age}` : ""}${p.gender ? `, ${p.gender}` : ""}`),
    "",
    "Please keep this email and your payment screenshot until your seat is confirmed.",
    `Questions? WhatsApp or call ${WHATSAPP_DISPLAY} (${WHATSAPP_LINK}) and mention your reference number.`,
    "",
    "Gadvede Trekkers",
    SITE_URL,
  ].join("\n");

  return { subject, html, text };
}

export function buildAdminNotice(row) {
  const subject = oneLine(`New payment registration ${row.reference} – ${row.event_name} – ${inr(row.amount_paid)}`, 200);
  const lines = [
    `Reference: ${row.reference}`,
    `Name: ${oneLine(row.full_name)} · +91 ${row.mobile}`,
    `Event: ${oneLine(row.event_name)} · ${oneLine(row.price_option_label || row.price_option)}`,
    `Date: ${oneLine(row.batch_label || row.batch_date)}${row.date_was_typed ? " (typed by customer)" : ""}`,
    `Pickup: ${oneLine(row.pickup_point)}`,
    `People: ${row.participants_count} × ${inr(row.price_per_person)} = ${inr(row.total_amount)}`,
    `Paid: ${inr(row.amount_paid)} via ${row.payment_mode} on ${row.payment_date} · UTR ${row.utr}`,
    "",
    "Verify in Admin → Payment Registrations: https://gadvede-backend.onrender.com/admin/payment-registrations",
  ];
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;">${lines.map((l) => (l ? `<div style="margin:3px 0;">${escapeHtml(l)}</div>` : "<br>")).join("")}</div>`;
  return { subject, html, text: lines.join("\n") };
}

export function adminNotifyRecipients(env = process.env) {
  return String(env.ADMIN_NOTIFY_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => EMAIL_RE.test(e));
}

/**
 * Sends the customer confirmation (+ optional admin notice). Never throws.
 * Returns { customer: "sent"|"skipped"|"failed", admin: "sent"|"off"|"skipped"|"failed" }.
 * Logs only the reference and an error code — no names, emails or phone numbers.
 */
export async function sendRegistrationEmails(row, { env = process.env, transporter, log = console.warn, profile = null } = {}) {
  const out = { customer: "skipped", admin: adminNotifyRecipients(env).length ? "skipped" : "off" };
  const ref = oneLine(row?.reference, 40);
  if (!isConfigured(env)) {
    log(`payment-registration email skipped (${ref}): mailer not configured`);
    return out;
  }
  let tx;
  try { tx = transporter || createTransporter(); } catch (e) {
    log(`payment-registration email failed (${ref}): transport ${e?.code || "error"}`);
    out.customer = "failed";
    if (out.admin !== "off") out.admin = "failed";
    return out;
  }
  const routing = emailRouting(profile, { fallbackName: SENDER_NAME });
  const from = { name: profile ? routing.senderName : SENDER_NAME, address: env.GMAIL_USER };
  const replyTo = profile ? routing.replyTo.bookingConfirmation : null;

  const to = String(row?.email || "").trim();
  if (EMAIL_RE.test(to)) {
    try {
      const mail = buildRegistrationEmail(row);
      await tx.sendMail({ from, to, ...(replyTo ? { replyTo } : {}), subject: mail.subject, html: mail.html, text: mail.text });
      out.customer = "sent";
    } catch (e) {
      out.customer = "failed";
      log(`payment-registration email failed (${ref}): ${e?.code || e?.responseCode || "send error"}`);
    }
  }

  const admins = adminNotifyRecipients(env);
  if (admins.length) {
    try {
      const notice = buildAdminNotice(row);
      await tx.sendMail({ from, to: admins, subject: notice.subject, html: notice.html, text: notice.text });
      out.admin = "sent";
    } catch (e) {
      out.admin = "failed";
      log(`payment-registration admin notice failed (${ref}): ${e?.code || e?.responseCode || "send error"}`);
    }
  }
  return out;
}
