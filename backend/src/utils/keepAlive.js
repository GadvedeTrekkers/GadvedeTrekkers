/**
 * Keep-Alive Ping Service
 * Prevents the backend from going to sleep on free hosting services (e.g., Render)
 * by periodically pinging the health endpoint.
 */

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:10000";

let pingIntervalId = null;

/**
 * Ping the server's health endpoint
 */
async function pingServer() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`[Keep-Alive] ✓ Ping successful at ${new Date().toISOString()}`);
    } else {
      console.warn(`[Keep-Alive] ⚠ Ping returned non-success response`);
    }
  } catch (error) {
    console.error(`[Keep-Alive] ✗ Ping failed:`, error.message);
  }
}

/**
 * Start the keep-alive service
 */
export function startKeepAlive() {
  // Only enable keep-alive in production
  if (process.env.NODE_ENV !== "production") {
    console.log("[Keep-Alive] Disabled in development mode");
    return;
  }

  if (!process.env.BACKEND_URL) {
    console.warn("[Keep-Alive] BACKEND_URL not set, keep-alive disabled");
    return;
  }

  console.log(`[Keep-Alive] Starting service (interval: ${PING_INTERVAL / 1000 / 60} minutes)`);
  console.log(`[Keep-Alive] Target URL: ${BACKEND_URL}/api/health`);

  // Initial ping after 1 minute
  setTimeout(pingServer, 60 * 1000);

  // Set up recurring pings
  pingIntervalId = setInterval(pingServer, PING_INTERVAL);
}

/**
 * Stop the keep-alive service
 */
export function stopKeepAlive() {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
    console.log("[Keep-Alive] Service stopped");
  }
}

// Handle graceful shutdown
process.on("SIGTERM", stopKeepAlive);
process.on("SIGINT", stopKeepAlive);
