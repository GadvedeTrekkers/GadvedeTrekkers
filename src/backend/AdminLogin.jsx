import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/backendClient";
import { persistAdminSession } from "../data/authStorage";

const BG = "/TrekImages/PuneTrek.png";
const LOGO = "/gadvedelogo.png";

const s = {
  root: {
    position: "fixed", inset: 0, width: "100vw", height: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, fontFamily: "'Outfit', system-ui, sans-serif", overflow: "hidden",
  },
  bgWrap: { position: "absolute", inset: 0, zIndex: 0 },
  bgImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  bgO1: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" },
  bgO2: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)",
  },
  card: { position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 1rem" },

  // Splash
  splash: { textAlign: "center" },
  logoRing: {
    width: 120, height: 120, margin: "0 auto 1.5rem", borderRadius: "50%",
    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
    border: "2px solid rgba(255,255,255,0.2)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", padding: 14,
  },
  logoImg: { width: "100%", objectFit: "contain", display: "block" },
  splashH1: {
    fontSize: "clamp(1.8rem,5vw,2.6rem)", fontWeight: 800, color: "#fff",
    margin: "0 0 0.4rem", letterSpacing: "-0.02em",
    textShadow: "0 2px 16px rgba(0,0,0,0.6)",
  },
  splashP: { color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", margin: "0 0 1.5rem" },
  dots: { display: "flex", justifyContent: "center", gap: 6, marginBottom: "2rem" },
  dot: (active) => ({
    width: 24, height: 4, borderRadius: 2,
    background: active ? "#4ade80" : "rgba(255,255,255,0.2)",
  }),
  signInBtn: {
    width: "100%", padding: "1rem",
    background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
    fontSize: "1rem", fontWeight: 700, borderRadius: 14,
    cursor: "pointer", fontFamily: "inherit", display: "block",
  },
  authNote: { color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", marginTop: "0.75rem" },

  // Form card
  formCard: {
    background: "rgba(8,14,20,0.85)", backdropFilter: "blur(28px)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 28,
    padding: "2.25rem 2rem", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
  },
  formHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" },
  formHeaderImg: { width: 36, height: 36, objectFit: "contain" },
  formHeaderName: { color: "#fff", fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.2, display: "block" },
  formHeaderSub: { color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block" },
  formH2: {
    fontSize: "1.9rem", fontWeight: 800, color: "#fff",
    margin: "0 0 1.5rem", letterSpacing: "-0.02em",
  },
  field: { marginBottom: "1.1rem" },
  label: {
    display: "block", fontSize: "0.68rem", fontWeight: 700,
    color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
    letterSpacing: "0.16em", marginBottom: "0.5rem",
  },
  inputWrap: { position: "relative" },
  input: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12, padding: "0.9rem 1.1rem",
    color: "#fff", fontSize: "0.95rem", fontFamily: "inherit",
    outline: "none",
  },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    color: "rgba(255,255,255,0.35)", padding: 0, lineHeight: 0,
  },
  errorBox: {
    background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)",
    borderRadius: 10, padding: "0.65rem 0.9rem",
    fontSize: "0.83rem", color: "#fca5a5", marginBottom: "1rem",
  },
  submitBtn: (disabled) => ({
    width: "100%", padding: "1rem", border: "none", borderRadius: 14,
    fontSize: "1rem", fontWeight: 700, fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "rgba(224,242,241,0.25)" : "#e0f2f1",
    color: disabled ? "rgba(10,20,18,0.4)" : "#0a140e",
    display: "block",
  }),
  formFooter: {
    display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1.5rem",
  },
  backBtn: {
    background: "none", border: "none", color: "#fff",
    fontWeight: 700, cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit",
  },
  websiteLink: { color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: "0.82rem" },
  footerNote: {
    position: "absolute", bottom: "1.25rem", left: 0, right: 0,
    textAlign: "center", zIndex: 1,
    color: "rgba(255,255,255,0.22)", fontSize: "0.7rem",
  },
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [view, setView]         = useState("splash");
  const [form, setForm]         = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/admin/login", {
        method: "POST",
        body: { username: form.username.trim(), password: form.password.trim() },
      });
      persistAdminSession(data);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !form.username || !form.password;

  return (
    <div style={s.root}>
      {/* Background */}
      <div style={s.bgWrap}>
        <img src={BG} alt="" style={s.bgImg} />
        <div style={s.bgO1} />
        <div style={s.bgO2} />
      </div>

      {/* Content card */}
      <div style={s.card}>
        {view === "splash" ? (
          <div style={s.splash}>
            <div style={s.logoRing}>
              <img src={LOGO} alt="Gadvede Trekkers" style={s.logoImg} />
            </div>
            <h1 style={s.splashH1}>Gadvede Trekkers</h1>
            <p style={s.splashP}>Admin Panel</p>
            <div style={s.dots}>
              <div style={s.dot(false)} />
              <div style={s.dot(true)} />
              <div style={s.dot(false)} />
            </div>
            <button style={s.signInBtn} onClick={() => setView("signin")}>
              Sign In
            </button>
            <p style={s.authNote}>Authorised personnel only</p>
          </div>
        ) : (
          <div style={s.formCard}>
            {/* Header */}
            <div style={s.formHeader}>
              <img src={LOGO} alt="" style={s.formHeaderImg} />
              <div>
                <span style={s.formHeaderName}>Gadvede Trekkers</span>
                <span style={s.formHeaderSub}>Admin Panel</span>
              </div>
            </div>

            <h2 style={s.formH2}>Sign in</h2>

            <form onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div style={s.field}>
                <label style={s.label}>Username</label>
                <div style={s.inputWrap}>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="admin"
                    value={form.username}
                    autoFocus
                    autoComplete="username"
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <input
                    style={{ ...s.input, paddingRight: "3rem" }}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPass((v) => !v)}>
                    {showPass ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div style={s.errorBox}>⚠️ {error}</div>}

              <button type="submit" style={s.submitBtn(isDisabled)} disabled={isDisabled}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <div style={s.formFooter}>
              <button style={s.backBtn} onClick={() => { setView("splash"); setError(""); }}>
                ← Back
              </button>
              <a href="/" style={s.websiteLink}>← Website</a>
            </div>
          </div>
        )}
      </div>

      <p style={s.footerNote}>Gadvede Trekkers — Admin Panel</p>
    </div>
  );
}
