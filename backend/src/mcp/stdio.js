#!/usr/bin/env node
/**
 * Local stdio entry for the read-only MCP server (for Claude Desktop / Cursor / local bots on the same machine).
 *   cd backend && MCP_ENABLED=true node src/mcp/stdio.js
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env (never committed). No bearer token over stdio:
 * only someone who can already run processes with those keys can use it.
 * stdout carries the MCP protocol, so all console.log output is redirected to stderr.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

console.log = (...args) => console.error(...args);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

if (String(process.env.MCP_ENABLED || "").toLowerCase() !== "true") {
  console.error("MCP server is OFF. Set MCP_ENABLED=true to start it.");
  process.exit(1);
}

const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
const { default: db } = await import("../config/supabaseAdminClient.js");
const { createDataAccess } = await import("./dataAccess.js");
const { createMcpServer } = await import("./server.js");

const server = createMcpServer({ data: createDataAccess(db) });
await server.connect(new StdioServerTransport());
console.error("Gadvede MCP server (read-only) running on stdio");
