import jwt from "jsonwebtoken";

/**
 * Parse the ADMIN_USERS env var.
 * Expected format (set in Railway / .env):
 *   ADMIN_USERS=[{"username":"admin","password":"<set-in-render-env>","name":"Admin","role":"Super Admin"},...]
 */
function getAdminUsers() {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    console.error("ADMIN_USERS env var is not valid JSON");
    return [];
  }
}

/**
 * POST /api/auth/admin/login
 * Body: { username, password }
 * Returns: { token, name, role, username }
 */
export async function adminLogin(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  const users = getAdminUsers();

  if (users.length === 0) {
    console.error("ADMIN_USERS is empty or not configured — cannot authenticate");
    return res.status(500).json({ success: false, error: "Admin users not configured" });
  }

  const user = users.find(
    (u) => u.username === username.trim() && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid username or password" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, error: "JWT_SECRET is not configured" });
  }

  const token = jwt.sign(
    { username: user.username, name: user.name, role: user.role },
    secret,
    { expiresIn: "8h" }
  );

  return res.json({
    success: true,
    data: {
      token,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
}
