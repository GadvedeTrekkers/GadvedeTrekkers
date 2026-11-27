import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

/**
 * Google Search Console: when VITE_GSC_VERIFICATION is set at build time, write
 * <meta name="google-site-verification" content="..."> into the static index.html
 * (Google reads the raw HTML, so this cannot be added from React at runtime).
 * Accepts either the bare token or the whole meta tag copied from Search Console.
 */
function googleSiteVerification(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const raw = String(env.VITE_GSC_VERIFICATION || '').trim()
  const token = (raw.match(/content=["']([^"']+)["']/)?.[1] || raw).trim()
  return {
    name: 'google-site-verification',
    transformIndexHtml(html) {
      if (!token || !/^[A-Za-z0-9_-]{10,100}$/.test(token)) return html
      return html.replace(
        '<meta name="robots"',
        `<meta name="google-site-verification" content="${token}" />\n    <meta name="robots"`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), googleSiteVerification(mode)],
  server: {
    // Ensure all routes fall back to index.html so React Router handles them
    // This fixes copied links (e.g. /employee/direct-booking) when opened in a new tab
    historyApiFallback: true,
  },
  preview: {
    // Same fallback for `vite preview`
    historyApiFallback: true,
  },

  // ── Vitest ────────────────────────────────────────────────────────────────
  // Only run unit/integration tests that live inside src/.
  // The tests/ directory belongs to Playwright — Vitest must never touch it,
  // otherwise Playwright's `test.describe()` is called outside the Playwright
  // runner and throws "did not expect test.describe() to be called here".
  test: {
    include:     ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude:     ['tests/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
}))
