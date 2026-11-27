import express from "express";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { createInstagramFeed } from "../services/instagramFeed.js";

/**
 * Public social endpoints for the website. Mounted at /api/social.
 *   GET /instagram/feed   latest @gadvede_trekkers posts + reels, cached ~1 hour on the server.
 *                         → { success, data: { configured, items: [{ permalink, image, type, caption, timestamp }], profileUrl } }
 *                         Not configured or Instagram down with nothing cached → items: [] (the site hides the section).
 * No tokens, ids or personal data are ever returned.
 */
export default function createSocialRouter({ getFeed, log = (m) => console.log(m) } = {}) {
  const router = express.Router();
  const feed = getFeed ?? createInstagramFeed({ log });
  const limiter = simpleRateLimit({ windowMs: 60_000, limit: 120 });

  router.get("/instagram/feed", limiter, async (req, res) => {
    try {
      const data = await feed();
      res.set("Cache-Control", data.items.length ? "public, max-age=900" : "public, max-age=120");
      return res.json({ success: true, data: { configured: data.configured, items: data.items, profileUrl: data.profileUrl } });
    } catch {
      return res.json({ success: true, data: { configured: false, items: [] } });
    }
  });

  return router;
}
