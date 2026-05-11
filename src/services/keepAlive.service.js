/**
 * Keep-Alive Service
 * 
 * Prevents Render free tier backend from going to sleep by pinging it every 10 minutes.
 * This ensures the backend stays warm and responds quickly to user requests.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
let intervalId = null;

/**
 * Ping the backend health endpoint to keep it awake
 */
async function pingBackend() {
  if (!API_BASE_URL) {
    console.warn("[KeepAlive] No API_BASE_URL configured, skipping ping");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("[KeepAlive] Backend ping successful");
    } else {
      console.warn(`[KeepAlive] Backend ping returned status ${response.status}`);
    }
  } catch (error) {
    console.error("[KeepAlive] Backend ping failed:", error.message);
  }
}

/**
 * Start the keep-alive service
 * Pings immediately and then every 10 minutes
 */
export function startKeepAlive() {
  if (intervalId) {
    console.warn("[KeepAlive] Service already running");
    return;
  }

  console.log("[KeepAlive] Starting service - will ping every 10 minutes");
  
  // Ping immediately on start
  pingBackend();
  
  // Then ping every 10 minutes
  intervalId = setInterval(pingBackend, PING_INTERVAL);
}

/**
 * Stop the keep-alive service
 */
export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[KeepAlive] Service stopped");
  }
}
