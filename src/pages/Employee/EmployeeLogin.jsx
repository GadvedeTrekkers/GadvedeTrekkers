import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { employeeLogin, setEmployeeSession } from "../../data/employeePortalStorage";

const BG_IMAGE   = "/employee-login-team-gadvede.jpeg";
const LOGO_IMAGE = "/gadvedelogo.png";

/* ── Animated slide wrapper ────────────────────────────────── */
function Slide({ visible, children }) {
  return (
    <div style={{
      transition: "opacity 0.3s, transform 0.3s",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(40px)",
      pointerEvents: visible ? "auto" : "none",
      position: visible ? "relative" : "absolute",
      width: "100%",
    }}>
      {children}
    </div>
  );
}

/* ── Eye icon ──────────────────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
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
  );
}

/* ── Glass input ───────────────────────────────────────────── */
function GlassInput({ label, type, placeholder, value, onChange, autoComplete, rightSlot }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{
        display: "block", fontSize: "0.7rem", fontWeight: 700,
        color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
        letterSpacing: "0.18em", marginBottom: "0.6rem", marginLeft: 4,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "1rem 1.25rem",
            paddingRight: rightSlot ? "3.2rem" : "1.25rem",
            color: "#fff", fontSize: "0.95rem", outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
          onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        {rightSlot && (
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Splash view ───────────────────────────────────────────── */
function SplashView({ onSignIn }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "3rem" }}>
        {/* Gadvede logo */}
        <div style={{
          width: 140, height: 140, margin: "0 auto 2rem",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          border: "2.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          padding: 12,
        }}>
          <img
            src={LOGO_IMAGE}
            alt="Gadvede Trekkers"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <h1 style={{
          fontSize: "clamp(2rem, 6vw, 2.8rem)", fontWeight: 800,
          color: "#fff", margin: "0 0 0.6rem", letterSpacing: "-0.02em",
          lineHeight: 1.1,
          textShadow: "0 2px 16px rgba(0,0,0,0.6)",
        }}>
          Gadvede Trekkers
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", margin: 0 }}>
          Staff & Leader Portal
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "1.25rem" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 24, height: 4, borderRadius: 2,
              background: i === 1 ? "#4ade80" : "rgba(255,255,255,0.2)",
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <button
          onClick={onSignIn}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "#fff", padding: "1.1rem",
            borderRadius: 14, fontSize: "1rem", fontWeight: 700,
            cursor: "pointer", transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        >
          Sign In
        </button>
        <p style={{
          color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", margin: 0,
        }}>
          Access is by admin invite only
        </p>
      </div>
    </div>
  );
}

/* ── Sign-in form ──────────────────────────────────────────── */
function SignInView({ onBack }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass]  = useState(false);
  const [error,    setError]     = useState("");
  const [loading,  setLoading]   = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const result = employeeLogin(username.trim(), password.trim());
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      setEmployeeSession(result.cred);
      const params = new URLSearchParams(location.search);
      navigate(params.get("next") || "/employee/dashboard");
    }, 400);
  };

  return (
    <div style={{
      background: "rgba(8,20,18,0.82)",
      backdropFilter: "blur(28px)",
      WebkitBackdropFilter: "blur(28px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "2.5rem",
      padding: "2.5rem",
      boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
    }}>
      {/* Logo small */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <img src={LOGO_IMAGE} alt="" style={{ width: 38, height: 38, objectFit: "contain" }} />
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
            Gadvede Trekkers
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
            Employee Portal
          </div>
        </div>
      </div>

      <h2 style={{
        fontSize: "2rem", fontWeight: 800,
        color: "#fff", margin: "0 0 1.75rem", letterSpacing: "-0.02em",
      }}>
        Sign in
      </h2>

      <form onSubmit={handleLogin} noValidate>
        <GlassInput
          label="Username"
          type="text"
          placeholder="e.g. rahul.patil"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <GlassInput
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", padding: 0, lineHeight: 0,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              <EyeIcon open={showPass} />
            </button>
          }
        />

        {error && (
          <div style={{
            background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)",
            borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.85rem",
            color: "#fca5a5", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          style={{
            width: "100%",
            background: loading || !username || !password ? "rgba(224,242,241,0.35)" : "#e0f2f1",
            color: loading || !username || !password ? "rgba(10,26,22,0.4)" : "#0a1a16",
            border: "none", borderRadius: 14,
            padding: "1.05rem", fontSize: "1rem", fontWeight: 700,
            cursor: loading || !username || !password ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </form>

      <p style={{
        textAlign: "center", color: "rgba(255,255,255,0.28)",
        fontSize: "0.82rem", margin: "1.75rem 0 0",
        display: "flex", justifyContent: "center", gap: "1.5rem",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "#fff",
          fontWeight: 700, cursor: "pointer", padding: 0, fontSize: "0.82rem",
        }}>
          ← Back
        </button>
        <a href="/" style={{ color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>
          ← Website
        </a>
      </p>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export default function EmployeeLogin() {
  const [view, setView] = useState("splash");

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", overflow: "hidden",
    }}>
      {/* Rajgad background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src={BG_IMAGE}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            transform: "scale(1.03)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(3,10,8,0.42)",
          backdropFilter: "blur(0.5px)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(5,22,17,0.44) 0%, rgba(0,0,0,0.1) 38%, rgba(0,0,0,0.72) 100%)",
        }} />
      </div>

      {/* Card */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <Slide visible={view === "splash"}>
          <SplashView onSignIn={() => setView("signin")} />
        </Slide>
        <Slide visible={view === "signin"}>
          <SignInView onBack={() => setView("splash")} />
        </Slide>
      </div>

      <p style={{
        position: "absolute", bottom: "1.25rem", left: 0, right: 0,
        textAlign: "center", zIndex: 1,
        color: "rgba(255,255,255,0.22)", fontSize: "0.72rem", margin: 0,
      }}>
        Gadvede Trekkers — Internal Staff Portal
      </p>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,20,18,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}
