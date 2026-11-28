/**
 * Admin → Settings → Integrations: is each Instagram / WhatsApp integration set up, and what is still missing.
 * Read only: every value is a Render env var on gadvede-backend (Settings-hub PROPOSAL: "Integrations & API Keys").
 * Secrets are never sent to the browser — the server returns "set" flags and at most the last 4 characters.
 * No edit, delete or export buttons.
 */
import { useCallback, useEffect, useState } from "react";
import { getIntegrationsStatus } from "../../../api/integrations.api";
import "./AutomationSettings.css";
import "./IntegrationSettings.css";

function State({ ok, warn, children }) {
  return <span className={`in-state ${ok ? "ok" : warn ? "warn" : "off"}`}>{children}</span>;
}
function Row({ label, env, children }) {
  return (
    <div className="in-row">
      <div className="in-row-label">{label}{env && <code>{env}</code>}</div>
      <div className="in-row-value">{children}</div>
    </div>
  );
}
const secret = (masked) => (masked ? <span className="au-mono">{masked}</span> : <State>Not set</State>);

export default function IntegrationSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await getIntegrationsStatus()); setError(""); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const ig = data?.instagramFeed; const hook = data?.metaWebhook; const crm = data?.crmLeads; const wa = data?.whatsappCloud;

  return (
    <div className="au-page">
      <div className="au-crumbs">⚙️ Settings › Integrations</div>
      <div className="au-head">
        <div>
          <h1>Instagram &amp; WhatsApp</h1>
          <p>What is connected and what still needs a key. Keys are set on Render (gadvede-backend → Environment) and are never shown here in full.</p>
        </div>
      </div>
      {error && <div className="au-banner warn">{error}</div>}
      {!data && !error && <div className="au-empty">Loading…</div>}

      {data && (
        <div className="in-grid">
          <section className="au-card">
            <header className="au-card-head"><div><h3>Instagram feed on the website</h3><p>Latest posts and reels of @gadvede_trekkers on the home page and trip pages. Hidden until it is set up.</p></div>
              <State ok={ig.configured}>{ig.configured ? "Showing" : "Not set up"}</State></header>
            <Row label="Instagram account id" env="IG_USER_ID">{ig.userIdSet ? <State ok>Set</State> : <State>Not set</State>}</Row>
            <Row label="Access token" env="IG_ACCESS_TOKEN">{secret(ig.token)}</Row>
            <Row label="API" env="IG_GRAPH_HOST">{ig.apiHost}</Row>
            <Row label="Token expires" env="IG_TOKEN_EXPIRES_AT">
              {ig.tokenExpiresAt
                ? <State ok={ig.tokenDaysLeft > 10} warn={ig.tokenDaysLeft <= 10}>{ig.tokenExpiresAt}{ig.tokenDaysLeft != null ? ` (${ig.tokenDaysLeft} days left)` : ""}</State>
                : <span className="au-muted">Not recorded. Tokens last 60 days: refresh with backend/scripts/refresh-instagram-token.js.</span>}
            </Row>
            <Row label="Refreshes from Instagram">Every {ig.cacheMinutes} minutes</Row>
          </section>

          <section className="au-card">
            <header className="au-card-head"><div><h3>Instagram DMs &amp; WhatsApp → Enquiries</h3><p>New Instagram DMs and WhatsApp messages become leads in Enquiries with an IG DM / WhatsApp badge. We never auto-reply and never touch comments (Logout Studio runs the Instagram automation).</p></div>
              <State ok={crm.enabled && hook.ready} warn={crm.enabled && !hook.ready}>{crm.enabled ? (hook.ready ? "On" : "On, webhook not ready") : "Off"}</State></header>
            <Row label="Create leads" env="META_LEADS_TO_CRM">{crm.enabled ? <State ok>On</State> : <State>Off</State>}</Row>
            <Row label="Webhook callback URL"><span className="au-mono in-url">{hook.callbackUrl}</span></Row>
            <Row label="App secret (signature check)" env="META_APP_SECRET">{secret(hook.appSecret)}</Row>
            <Row label="Verify token" env="META_VERIFY_TOKEN">{hook.verifyTokenSet ? <State ok>Set</State> : <State>Not set</State>}</Row>
            <Row label="Auto-reply">Never</Row>
          </section>

          <section className="au-card">
            <header className="au-card-head"><div><h3>WhatsApp Cloud API (automatic messages)</h3><p>Booking confirmed and payment verified send an approved template from the business number. Optional for the pre-trip reminder (Automations). Customers who opted out are skipped.</p></div>
              <State ok={wa.live} warn={wa.configured && !wa.live}>{wa.live ? "Live" : wa.configured ? "Dry run (nothing is sent)" : "Not set up"}</State></header>
            <Row label="Phone number id" env="WHATSAPP_PHONE_NUMBER_ID">{secret(wa.phoneNumberId)}</Row>
            <Row label="Access token" env="WHATSAPP_ACCESS_TOKEN">{secret(wa.token)}</Row>
            <Row label="Live sending" env="WHATSAPP_API_LIVE">{wa.live ? <State ok>On</State> : <State>Off</State>}</Row>
            {wa.templates.map((t) => (
              <Row key={t.id} label={t.id === "bookingConfirmation" ? "Confirmation template" : "Pre-trip reminder template"} env={t.envVar}>
                {t.name ? <span className="au-mono">{t.name}</span> : <span className="au-muted">Not set (suggested name: {t.suggestedName})</span>}
              </Row>
            ))}
            <Row label="Template language" env="WHATSAPP_TEMPLATE_LANG">{wa.language}</Row>
          </section>

          <section className="au-card">
            <header className="au-card-head"><div><h3>WhatsApp chat button</h3><p>One floating button on every public page (not in admin). On trip pages it fills in the trip, the chosen date and pickup point, and the page link.</p></div>
              <State ok>On</State></header>
            <Row label="Chat number">{data.whatsappButton.display}</Row>
            <Row label="Analytics event">whatsapp_click (placement, trip name, page) — no phone numbers or messages</Row>
          </section>
        </div>
      )}
    </div>
  );
}
