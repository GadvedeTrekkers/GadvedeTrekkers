/**
 * Refresh the long-lived Instagram token (IG_ACCESS_TOKEN). Tokens last 60 days; run this every ~50 days.
 *   cd backend && IG_ACCESS_TOKEN=… node scripts/refresh-instagram-token.js [--out ./ig-token.new]
 * (or run it in the Render Shell of gadvede-backend, where IG_ACCESS_TOKEN is already set).
 * The NEW token is written to the --out file (default ./ig-token.new, mode 600) and is never printed.
 * Paste it into Render → gadvede-backend → Environment → IG_ACCESS_TOKEN, set IG_TOKEN_EXPIRES_AT, then delete the file.
 * Only for Instagram Login tokens (IG_GRAPH_HOST unset / graph.instagram.com).
 */
/* global process */
import fs from "node:fs";
import path from "node:path";
import { refreshInstagramToken } from "../src/services/instagramFeed.js";

const i = process.argv.indexOf("--out");
const out = path.resolve(i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "./ig-token.new");
try {
  const { token, expiresInDays } = await refreshInstagramToken();
  fs.writeFileSync(out, `${token}\n`, { mode: 0o600 });
  const until = new Date(Date.now() + expiresInDays * 86_400_000).toISOString().slice(0, 10);
  console.log(`refresh-instagram-token: OK. New token written to ${out} (valid ~${expiresInDays} days, until about ${until}).`);
  console.log(`Set IG_ACCESS_TOKEN to the file's content and IG_TOKEN_EXPIRES_AT=${until} on Render, then delete the file.`);
} catch (e) {
  console.error(`refresh-instagram-token: failed (${e?.code || e?.name || "error"}).`);
  process.exit(1);
}
