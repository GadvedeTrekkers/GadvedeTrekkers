import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { clientKey } from "./paymentRegistrations.routes.js";
import { mcpEnabled, requireMcpToken } from "../mcp/auth.js";
import { createDataAccess } from "../mcp/dataAccess.js";
import { createMcpServer } from "../mcp/server.js";

/**
 * Read-only MCP server (Model Context Protocol, Streamable HTTP, stateless JSON mode). Mounted at /api/mcp.
 *   OFF (404) unless env MCP_ENABLED === "true".
 *   Auth: Authorization: Bearer <MCP_API_TOKEN> (constant-time compare). 401 otherwise. The token is never logged.
 *   Rate limit: MCP_RATE_LIMIT_PER_MIN per client IP (default 60).
 *   POST /api/mcp  JSON-RPC.  GET / DELETE -> 405 (no sessions, no server-push streams).
 */
export function createMcpRouter({ env = process.env, db, data } = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);
  let dataAccess = data || null;
  async function getData() {
    if (!dataAccess) dataAccess = createDataAccess(typeof getDb === "function" ? await getDb() : getDb, { env });
    return dataAccess;
  }

  const limit = () => {
    const n = Number(env.MCP_RATE_LIMIT_PER_MIN);
    return Number.isFinite(n) && n > 0 ? n : 60;
  };

  router.use((req, res, next) => (mcpEnabled(env) ? next() : res.status(404).json({ error: "Not found" })));
  router.use(simpleRateLimit({ windowMs: 60_000, limit, key: clientKey, message: { error: "Too many requests" } }));
  router.use(requireMcpToken({ env }));

  router.post("/", async (req, res) => {
    let server; let transport;
    try {
      server = createMcpServer({ data: await getData() });
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => { transport?.close().catch(() => {}); server?.close().catch(() => {}); });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request failed:", err?.message || err);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  });

  const notAllowed = (req, res) => res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
  router.get("/", notAllowed);
  router.delete("/", notAllowed);

  return router;
}

export default createMcpRouter;
