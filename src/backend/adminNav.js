/* Admin sidebar structure: top-level items plus collapsible groups.
   Visibility rules stay with each item (e.g. adminOnly) so a group with
   no visible children is omitted from the menu. */

export const NAV_ITEMS = [
  { path: "/admin/dashboard",    icon: "📊", label: "Dashboard" },
  { path: "/admin/add-new",      icon: "➕", label: "Add New" },
  { path: "/admin/blogs",        icon: "📝", label: "Blog & AI Writer" },
  { path: "/admin/treks",        icon: "🥾", label: "Treks" },
  { path: "/admin/tours",        icon: "🗺",  label: "Tours" },
  { path: "/admin/heritage",     icon: "🏛",  label: "Heritage Walks" },
  { path: "/admin/camping",      icon: "⛺",  label: "Camping" },
  { path: "/admin/rentals",      icon: "🏠",  label: "Rentals" },
  { path: "/admin/villas",       icon: "🏡",  label: "Villas on Rent" },
  { path: "/admin/industrial-visits", icon: "🎓", label: "Industrial Visits" },
  { path: "/admin/events",              icon: "📅",  label: "Events" },
  { path: "/admin/property-listings",   icon: "🏡",  label: "Property Listings" },
  { path: "/admin/campsite-listings",   icon: "⛺",  label: "Campsite Listings" },
  { path: "/admin/vendors",             icon: "🏪",  label: "Vendors" },
  { path: "/admin/bookings",     icon: "📋",  label: "Bookings" },
  { path: "/admin/enquiries",    icon: "📬",  label: "Enquiries" },
  { path: "/admin/payment-registrations", icon: "🧾", label: "Payment Registrations" },
  { path: "/admin/booking-form", icon: "🧾",  label: "Booking Desk" },
  { path: "/admin/transactions", icon: "💳",  label: "Transactions" },
  { path: "/admin/customers",    icon: "👤",  label: "Customers" },
  { path: "/admin/reports",      icon: "📈",  label: "Reports" },
  { path: "/admin/marketing",    icon: "📢",  label: "Marketing" },
  { path: "/admin/feedback",     icon: "⭐",  label: "Feedback" },
  { path: "/admin/earnings",     icon: "💰",  label: "Payments & Earnings" },
  { path: "/admin/employees",    icon: "👨‍💼", label: "Employees"  },
  { path: "/admin/training",     icon: "🎓",  label: "Training" },
  { path: "/admin/onboarding",   icon: "📋",  label: "Onboarding" },
  { path: "/admin/logs",         icon: "📋",  label: "Activity Logs" },
  { path: "/admin/docs",         icon: "📖",  label: "How It Works" },
  { path: "/admin/email-templates", icon: "✉️", label: "Email Templates" },
  { path: "/admin/profile-setup", icon: "🏢", label: "Profile Setup", adminOnly: true },
  { path: "/admin/automations",  icon: "🤖", label: "Automations", adminOnly: true },
  { path: "/admin/integrations", icon: "🔌", label: "Integrations", adminOnly: true },
];

/* Dashboard and Add New stay pinned at the top, outside any dropdown. */
export const TOP_LEVEL_PATHS = [
  "/admin/dashboard",
  "/admin/add-new",
];

export const NAV_GROUP_DEFS = [
  {
    id: "listings",
    label: "Listings",
    icon: "🗂",
    paths: [
      "/admin/treks",
      "/admin/tours",
      "/admin/heritage",
      "/admin/camping",
      "/admin/rentals",
      "/admin/villas",
      "/admin/industrial-visits",
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "📝",
    paths: [
      "/admin/blogs",
      "/admin/events",
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "🏪",
    paths: [
      "/admin/property-listings",
      "/admin/campsite-listings",
      "/admin/vendors",
    ],
  },
  {
    id: "crm",
    label: "Bookings & CRM",
    icon: "📋",
    paths: [
      "/admin/bookings",
      "/admin/enquiries",
      "/admin/payment-registrations",
      "/admin/booking-form",
      "/admin/customers",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "💳",
    paths: [
      "/admin/transactions",
      "/admin/earnings",
      "/admin/reports",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "📢",
    paths: [
      "/admin/marketing",
      "/admin/feedback",
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: "👨‍💼",
    paths: [
      "/admin/employees",
      "/admin/training",
      "/admin/onboarding",
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙️",
    paths: [
      "/admin/email-templates",
      "/admin/profile-setup",
      "/admin/automations",
      "/admin/integrations",
      "/admin/logs",
      "/admin/docs",
    ],
  },
];

export const OPEN_GROUPS_STORAGE_KEY = "gt_admin_nav_open_groups";

/* Profile Setup / Automations / Integrations are only listed for Super Admin
   or Admin; the backend enforces the same roles. */
export const canSeeAdminOnly = (u) =>
  u?.username === "admin" ||
  ["superadmin", "admin"].includes(String(u?.role || "").toLowerCase().replace(/[\s_-]/g, ""));

export function isItemVisible(item, user) {
  return !item?.adminOnly || canSeeAdminOnly(user);
}

export function navItemIsActive(itemPath, pathname) {
  if (!itemPath || !pathname) return false;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function buildNavSections(user, options = {}) {
  const items = options.items || NAV_ITEMS;
  const groups = options.groups || NAV_GROUP_DEFS;
  const topLevelPaths = options.topLevelPaths || TOP_LEVEL_PATHS;
  const byPath = new Map(items.map((item) => [item.path, item]));
  const used = new Set();
  const sections = [];

  for (const path of topLevelPaths) {
    const item = byPath.get(path);
    if (!item || !isItemVisible(item, user)) continue;
    used.add(path);
    sections.push({ type: "item", item });
  }

  for (const group of groups) {
    const children = (group.paths || [])
      .map((path) => byPath.get(path))
      .filter(Boolean)
      .filter((item) => isItemVisible(item, user));
    children.forEach((item) => used.add(item.path));
    if (!children.length) continue;
    sections.push({
      type: "group",
      id: group.id,
      label: group.label,
      icon: group.icon,
      items: children,
    });
  }

  for (const item of items) {
    if (used.has(item.path) || !isItemVisible(item, user)) continue;
    sections.push({ type: "item", item });
  }

  return sections;
}

export function groupIdsContainingPath(pathname, sections) {
  return (sections || [])
    .filter((section) =>
      section.type === "group" &&
      (section.items || []).some((item) => navItemIsActive(item.path, pathname)),
    )
    .map((section) => section.id);
}

export function readOpenGroupIds(storage) {
  if (!storage || typeof storage.getItem !== "function") return [];
  try {
    const raw = storage.getItem(OPEN_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string" && id);
  } catch {
    return [];
  }
}

export function writeOpenGroupIds(ids, storage) {
  if (!storage || typeof storage.setItem !== "function") return;
  const unique = [...new Set((ids || []).filter((id) => typeof id === "string" && id))];
  storage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(unique));
}

export function mergeOpenGroups(savedIds, autoExpandIds) {
  return [...new Set([...(savedIds || []), ...(autoExpandIds || [])])];
}

export function toggleGroupId(openIds, id) {
  const current = openIds || [];
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}
