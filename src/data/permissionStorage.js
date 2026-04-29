import { getStoredAdminUser } from "./authStorage";

const PERMISSIONS_KEY = "gt_mgmt_permissions";

export const ALL_PERMISSIONS = {
  vendor_payments:  { label: "Vendor Payments", icon: "💳", desc: "Make payments to vendors through the system" },
  trek_allocation:  { label: "Trek Allocation", icon: "🧗", desc: "Assign trek leaders to events and treks" },
  manage_bookings:  { label: "Manage Bookings", icon: "📋", desc: "Approve, reject, and modify bookings" },
  manage_employees: { label: "Manage Employees", icon: "👥", desc: "Add, edit, and remove employee records" },
  manage_treks:     { label: "Manage Treks", icon: "🏔", desc: "Add and edit trek and tour listings" },
  view_reports:     { label: "View Reports", icon: "📊", desc: "Access reports, analytics, and earnings" },
  marketing:        { label: "Marketing", icon: "📣", desc: "Manage marketing and promotions" },
};

const DEFAULT_PERMISSIONS = {
  "pratik.ubhe": ["vendor_payments", "trek_allocation", "manage_bookings", "manage_treks", "view_reports", "manage_employees"],
  "rohit.panhalkar": ["vendor_payments", "manage_bookings", "view_reports"],
  "akshay.kangude": ["trek_allocation", "manage_treks", "view_reports"],
};

function loadPermissions() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePermissions(data) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data));
}

export function getUserPermissions(username) {
  if (!username || username === "admin") return Object.keys(ALL_PERMISSIONS);
  const stored = loadPermissions();
  return stored[username] !== undefined ? stored[username] : (DEFAULT_PERMISSIONS[username] || []);
}

export function setUserPermissions(username, permissions) {
  const data = loadPermissions();
  data[username] = permissions;
  savePermissions(data);
}

export function togglePermission(username, permission) {
  const perms = getUserPermissions(username);
  const updated = perms.includes(permission)
    ? perms.filter((item) => item !== permission)
    : [...perms, permission];
  setUserPermissions(username, updated);
  return updated;
}

export function currentUserHasPermission(permission) {
  try {
    const user = getStoredAdminUser();
    if (!user || user.username === "admin") return true;
    return getUserPermissions(user.username).includes(permission);
  } catch {
    return true;
  }
}

export function getCurrentAdminUser() {
  return getStoredAdminUser();
}
