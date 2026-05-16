import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import productsRoutes   from "./routes/products.routes.js";
import listingsRoutes   from "./routes/listings.routes.js";
import bookingsRoutes   from "./routes/bookings.routes.js";
import customersRoutes  from "./routes/customers.routes.js";
import paymentsRoutes   from "./routes/payments.routes.js";
import enquiriesRoutes  from "./routes/enquiries.routes.js";
import leadsRoutes      from "./routes/leads.routes.js";
import authRoutes           from "./routes/auth.routes.js";
import notifyRoutes         from "./routes/notifications.routes.js";
import employeesRoutes      from "./routes/employees.routes.js";
import vendorsRoutes        from "./routes/vendors.routes.js";
import trekPaymentsRoutes   from "./routes/trekPayments.routes.js";
import adminToolsRoutes     from "./routes/admin-tools.routes.js";
import supabasePublic   from "./config/supabasePublicClient.js";
import supabaseAdmin    from "./config/supabaseAdminClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production domains are always allowed so a stale CORS_ORIGIN env var on the
// server never silently blocks the live frontend.  Additional origins (e.g.
// local dev) are appended via the CORS_ORIGIN environment variable.
const PRODUCTION_ORIGINS = [
  "https://gadvede.com",
  "https://www.gadvede.com",
  "https://gadvedetrekkersfrontend.onrender.com",
  "https://gadvede-frontend.onrender.com",
];

const _envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...PRODUCTION_ORIGINS, ..._envOrigins]));

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gadvede Trekkers — API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a1628; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #111f35; border: 1px solid #1e3a5f; border-radius: 20px; padding: 2.5rem; max-width: 600px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.4); }
    .logo { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #0d9488, #065f46); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .logo-text h1 { font-size: 1.2rem; font-weight: 700; color: #fff; }
    .logo-text p { font-size: 0.8rem; color: #64748b; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 2rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .section-title { font-size: 0.7rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
    .endpoints { display: flex; flex-direction: column; gap: 8px; margin-bottom: 2rem; }
    .endpoint { display: flex; align-items: center; gap: 10px; background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 10px; padding: 10px 14px; }
    .method { font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; min-width: 40px; text-align: center; }
    .get { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .post { background: rgba(16,185,129,0.2); color: #34d399; }
    .path { font-size: 0.85rem; color: #94a3b8; font-family: monospace; }
    .desc { font-size: 0.75rem; color: #475569; margin-left: auto; }
    .footer { font-size: 0.75rem; color: #334155; text-align: center; border-top: 1px solid #1e3a5f; padding-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">🏔️</div>
      <div class="logo-text">
        <h1>Gadvede Trekkers</h1>
        <p>Backend API Server</p>
      </div>
    </div>
    <div class="status-badge"><div class="dot"></div> All systems operational</div>
    <div class="section-title">Available Endpoints</div>
    <div class="endpoints">
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/health</span><span class="desc">Health check</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/products</span><span class="desc">Product listings</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/api/auth/admin/login</span><span class="desc">Admin login</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/bookings</span><span class="desc">Bookings (auth)</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/customers</span><span class="desc">Customers (auth)</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/enquiries</span><span class="desc">Enquiries (auth)</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/payments</span><span class="desc">Payments (auth)</span></div>
    </div>
    <div class="footer">Gadvede Trekkers &copy; ${new Date().getFullYear()} &mdash; API v1.0</div>
  </div>
</body>
</html>`);
});

app.use("/api/auth",       authRoutes);
app.use("/api/products",   productsRoutes);
app.use("/api/listings",   listingsRoutes);
app.use("/api/bookings",   bookingsRoutes);
app.use("/api/customers",  customersRoutes);
app.use("/api/payments",   paymentsRoutes);
app.use("/api/enquiries",  enquiriesRoutes);
app.use("/api/leads",      leadsRoutes);
app.use("/api/notify",        notifyRoutes);
app.use("/api/employees",     employeesRoutes);
app.use("/api/vendors",       vendorsRoutes);
app.use("/api/trek-payments", trekPaymentsRoutes);
app.use("/api/admin-tools",   adminToolsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.get("/api/health/db", async (req, res) => {
  const [publicCheck, adminCheck] = await Promise.all([
    supabasePublic.from("products").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
  ]);

  const payload = {
    public: {
      ok: !publicCheck.error,
      table: "products",
      count: publicCheck.count ?? 0,
      error: publicCheck.error?.message || null,
    },
    admin: {
      ok: !adminCheck.error,
      table: "products",
      count: adminCheck.count ?? 0,
      error: adminCheck.error?.message || null,
    },
  };

  if (publicCheck.error || adminCheck.error) {
    return res.status(500).json({ success: false, data: payload });
  }

  return res.json({ success: true, data: payload });
});

app.get("/api/health/db/tables", async (req, res) => {
  const tableChecks = await Promise.all([
    supabasePublic.from("products").select("id", { count: "exact", head: true }),
    supabasePublic.from("product_batches").select("id", { count: "exact", head: true }),
    supabasePublic.from("product_departure_plans").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("customers").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("payments").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("payment_refunds").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("listing_submissions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("enquiries").select("id", { count: "exact", head: true }),
  ]);

  const [
    productsCheck,
    productBatchesCheck,
    departurePlansCheck,
    bookingsCheck,
    customersCheck,
    paymentsCheck,
    refundsCheck,
    listingsCheck,
    enquiriesCheck,
  ] = tableChecks;

  const payload = {
    products: {
      ok: !productsCheck.error,
      count: productsCheck.count ?? 0,
      access: "public",
      error: productsCheck.error?.message || null,
    },
    product_batches: {
      ok: !productBatchesCheck.error,
      count: productBatchesCheck.count ?? 0,
      access: "public",
      error: productBatchesCheck.error?.message || null,
    },
    product_departure_plans: {
      ok: !departurePlansCheck.error,
      count: departurePlansCheck.count ?? 0,
      access: "public",
      error: departurePlansCheck.error?.message || null,
    },
    bookings: {
      ok: !bookingsCheck.error,
      count: bookingsCheck.count ?? 0,
      access: "admin",
      error: bookingsCheck.error?.message || null,
    },
    customers: {
      ok: !customersCheck.error,
      count: customersCheck.count ?? 0,
      access: "admin",
      error: customersCheck.error?.message || null,
    },
    payments: {
      ok: !paymentsCheck.error,
      count: paymentsCheck.count ?? 0,
      access: "admin",
      error: paymentsCheck.error?.message || null,
    },
    payment_refunds: {
      ok: !refundsCheck.error,
      count: refundsCheck.count ?? 0,
      access: "admin",
      error: refundsCheck.error?.message || null,
    },
    listing_submissions: {
      ok: !listingsCheck.error,
      count: listingsCheck.count ?? 0,
      access: "admin",
      error: listingsCheck.error?.message || null,
    },
    enquiries: {
      ok: !enquiriesCheck.error,
      count: enquiriesCheck.count ?? 0,
      access: "admin",
      error: enquiriesCheck.error?.message || null,
    },
  };

  if (tableChecks.some((check) => check.error)) {
    return res.status(500).json({ success: false, data: payload });
  }

  return res.json({ success: true, data: payload });
});

// ═══════════════════════════════════════════════════════════════
// Serve Admin Panel (Static Files)
// ═══════════════════════════════════════════════════════════════

const adminDistPath = path.join(__dirname, "../admin-dist");

// Serve static files from admin-dist
app.use(express.static(adminDistPath));

// Serve admin panel for all non-API routes
app.get("*", (req, res) => {
  // Don't serve admin panel for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  // Serve admin panel index.html
  res.sendFile(path.join(adminDistPath, "index.html"));
});

export default app;
