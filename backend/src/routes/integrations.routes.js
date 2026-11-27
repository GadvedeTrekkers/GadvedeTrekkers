import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import { isProfileAdmin } from "./settings.routes.js";
import { instagramConfig, maskSecret, metaConfig, whatsappConfig } from "../config/meta.js";
import { WHATSAPP_TEMPLATES } from "../../../shared/whatsappTemplates.js";

/**
 * Admin → Settings → Integrations: read-only status of the Instagram + WhatsApp integrations.
 * Mounted at /api/settings/integrations.   GET /status  (admin JWT, Super Admin or Admin)
 * Every value comes from Render env vars. Secrets are NEVER returned: only "set" flags and at most the last 4 characters.
 * There is no write route here (changing a key = changing the env var on Render), no delete and no export.
 */
export function integrationsStatus(env = process.env) {
  const meta = metaConfig(env);
  const ig = instagramConfig(env);
  const wa = whatsappConfig(env);
  const backend = String(env.BACKEND_URL || "https://gadvede-backend.onrender.com").replace(/\/$/, "");
  const days = ig.tokenExpiresAt && Number.isFinite(Date.parse(ig.tokenExpiresAt))
    ? Math.floor((Date.parse(ig.tokenExpiresAt) - Date.now()) / 86_400_000) : null;
  return {
    instagramFeed: {
      configured: ig.configured,
      userIdSet: Boolean(ig.userId),
      token: maskSecret(ig.token),
      apiHost: ig.host,
      tokenExpiresAt: ig.tokenExpiresAt || "",
      tokenDaysLeft: days,
      cacheMinutes: Math.round(ig.cacheSeconds / 60),
    },
    metaWebhook: {
      callbackUrl: `${backend}/api/v1/webhooks/meta`,
      appSecret: maskSecret(meta.appSecret),
      verifyTokenSet: Boolean(meta.verifyToken),
      ready: Boolean(meta.appSecret && meta.verifyToken),
      graphVersion: meta.graphVersion,
    },
    crmLeads: {
      enabled: meta.leadsToCrm,
      sources: ["instagram_dm", "whatsapp"],
      autoReply: false,
    },
    whatsappCloud: {
      configured: wa.configured,
      live: wa.live,
      phoneNumberId: maskSecret(wa.phoneNumberId),
      token: maskSecret(wa.token),
      language: wa.language,
      templates: Object.entries(WHATSAPP_TEMPLATES).map(([id, t]) => ({
        id, envVar: t.envVar, suggestedName: t.suggestedName, name: wa.templates[id] || "",
      })),
    },
    whatsappButton: { number: "919856112727", display: "+91 98561 12727" },
  };
}

export default function createIntegrationsRouter({ env = process.env } = {}) {
  const router = express.Router();
  router.get("/status", requireAdminJWT, (req, res) => {
    if (!(isProfileAdmin(req.admin) || req.admin?.username === "admin")) {
      return res.status(403).json({ success: false, error: "Only Super Admin or Admin can view integrations" });
    }
    return res.json({ success: true, data: integrationsStatus(env) });
  });
  return router;
}
