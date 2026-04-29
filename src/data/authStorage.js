const ADMIN_FLAG_KEY = "gt_admin";
const ADMIN_TOKEN_KEY = "gt_admin_token";
const ADMIN_USER_KEY = "gt_user";

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readString(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

export function isAdminAuthenticated() {
  return readString(ADMIN_FLAG_KEY) === "true" && Boolean(getAdminToken());
}

export function getAdminToken() {
  return readString(ADMIN_TOKEN_KEY);
}

export function getStoredAdminUser() {
  return (
    readJson(localStorage, ADMIN_USER_KEY) ||
    readJson(sessionStorage, ADMIN_USER_KEY) ||
    { name: "Admin", username: "admin", role: "Super Admin" }
  );
}

export function persistAdminSession(user) {
  const serialisedUser = JSON.stringify({
    name: user.name,
    role: user.role,
    username: user.username,
  });

  localStorage.setItem(ADMIN_FLAG_KEY, "true");
  localStorage.setItem(ADMIN_TOKEN_KEY, user.token);
  localStorage.setItem(ADMIN_USER_KEY, serialisedUser);

  sessionStorage.setItem(ADMIN_FLAG_KEY, "true");
  sessionStorage.setItem(ADMIN_TOKEN_KEY, user.token);
  sessionStorage.setItem(ADMIN_USER_KEY, serialisedUser);
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_FLAG_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);

  sessionStorage.removeItem(ADMIN_FLAG_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
}
