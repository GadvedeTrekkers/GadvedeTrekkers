import test from "node:test";
import assert from "node:assert/strict";
import {
  NAV_ITEMS,
  NAV_GROUP_DEFS,
  TOP_LEVEL_PATHS,
  OPEN_GROUPS_STORAGE_KEY,
  canSeeAdminOnly,
  isItemVisible,
  navItemIsActive,
  buildNavSections,
  groupIdsContainingPath,
  readOpenGroupIds,
  writeOpenGroupIds,
  mergeOpenGroups,
  toggleGroupId,
} from "./adminNav.js";

const ADMIN = { username: "admin", role: "Super Admin", name: "Admin" };
const STAFF = { username: "rohit.panhalkar", role: "Staff", name: "Rohit" };

const allPaths = (sections) =>
  sections.flatMap((section) =>
    section.type === "item" ? [section.item.path] : section.items.map((item) => item.path),
  );

const groupById = (sections, id) => sections.find((section) => section.type === "group" && section.id === id);

test("every NAV_ITEMS path is assigned exactly once in the default grouping", () => {
  const sections = buildNavSections(ADMIN);
  const paths = allPaths(sections);
  assert.deepEqual([...new Set(paths)].sort(), paths.slice().sort());
  assert.deepEqual(paths.slice().sort(), NAV_ITEMS.map((item) => item.path).sort());
  assert.equal(paths.length, NAV_ITEMS.length);
});

test("Dashboard and Add New stay top-level and Listings holds Pratik's seven types", () => {
  const sections = buildNavSections(ADMIN);
  assert.equal(sections[0].type, "item");
  assert.equal(sections[0].item.path, "/admin/dashboard");
  assert.equal(sections[1].type, "item");
  assert.equal(sections[1].item.path, "/admin/add-new");
  assert.deepEqual(TOP_LEVEL_PATHS, ["/admin/dashboard", "/admin/add-new"]);

  const listings = groupById(sections, "listings");
  assert.ok(listings);
  assert.equal(listings.label, "Listings");
  assert.deepEqual(
    listings.items.map((item) => item.label),
    ["Treks", "Tours", "Heritage Walks", "Camping", "Rentals", "Villas on Rent", "Industrial Visits"],
  );
});

test("remaining groups use the agreed labels and member paths", () => {
  const sections = buildNavSections(ADMIN);
  const expected = {
    content: ["Blog & AI Writer", "Events"],
    marketplace: ["Property Listings", "Campsite Listings", "Vendors"],
    crm: ["Bookings", "Enquiries", "Payment Registrations", "Booking Desk", "Customers"],
    finance: ["Transactions", "Payments & Earnings", "Reports"],
    marketing: ["Marketing", "Feedback"],
    team: ["Employees", "Training", "Onboarding"],
    settings: ["Email Templates", "Profile Setup", "Automations", "Integrations", "Activity Logs", "How It Works"],
  };
  for (const [id, labels] of Object.entries(expected)) {
    const group = groupById(sections, id);
    assert.ok(group, `missing group ${id}`);
    assert.deepEqual(group.items.map((item) => item.label), labels);
  }
  assert.deepEqual(
    sections.filter((section) => section.type === "group").map((section) => section.id),
    Object.keys(expected).length ? ["listings", ...Object.keys(expected)] : [],
  );
});

test("group order is Listings, Content, Marketplace, Bookings & CRM, Finance, Marketing, Team, Settings", () => {
  const sections = buildNavSections(ADMIN);
  assert.deepEqual(
    sections.filter((section) => section.type === "group").map((section) => section.id),
    ["listings", "content", "marketplace", "crm", "finance", "marketing", "team", "settings"],
  );
});

test("canSeeAdminOnly accepts Super Admin / Admin spellings and the admin username", () => {
  assert.equal(canSeeAdminOnly({ username: "admin", role: "staff" }), true);
  assert.equal(canSeeAdminOnly({ username: "pratik", role: "Super Admin" }), true);
  assert.equal(canSeeAdminOnly({ username: "pratik", role: "super-admin" }), true);
  assert.equal(canSeeAdminOnly({ username: "pratik", role: "Admin" }), true);
  assert.equal(canSeeAdminOnly(STAFF), false);
  assert.equal(canSeeAdminOnly(null), false);
  assert.equal(canSeeAdminOnly(undefined), false);
});

test("staff do not see admin-only Settings items, but the Settings group stays if other children remain", () => {
  const sections = buildNavSections(STAFF);
  const settings = groupById(sections, "settings");
  assert.ok(settings);
  assert.deepEqual(
    settings.items.map((item) => item.label),
    ["Email Templates", "Activity Logs", "How It Works"],
  );
  const paths = allPaths(sections);
  assert.equal(paths.includes("/admin/profile-setup"), false);
  assert.equal(paths.includes("/admin/automations"), false);
  assert.equal(paths.includes("/admin/integrations"), false);
  assert.equal(paths.includes("/admin/treks"), true);
});

test("a group with no visible children is omitted", () => {
  const items = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/secret", icon: "🔒", label: "Secret", adminOnly: true },
  ];
  const groups = [{ id: "secret", label: "Secret", icon: "🔒", paths: ["/admin/secret"] }];
  const sections = buildNavSections(STAFF, { items, groups, topLevelPaths: ["/admin/dashboard"] });
  assert.equal(sections.some((section) => section.id === "secret"), false);
  assert.deepEqual(allPaths(sections), ["/admin/dashboard"]);
});

test("isItemVisible hides adminOnly items from staff and shows them to admin", () => {
  const item = { path: "/admin/automations", adminOnly: true, label: "Automations" };
  assert.equal(isItemVisible(item, ADMIN), true);
  assert.equal(isItemVisible(item, STAFF), false);
  assert.equal(isItemVisible({ path: "/admin/treks", label: "Treks" }, STAFF), true);
});

test("ungrouped leftover visible items are appended after the defined groups", () => {
  const items = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/extra", icon: "✨", label: "Extra" },
    { path: "/admin/hidden", icon: "🔒", label: "Hidden", adminOnly: true },
  ];
  const sections = buildNavSections(STAFF, {
    items,
    groups: [],
    topLevelPaths: ["/admin/dashboard"],
  });
  assert.equal(sections.at(-1).type, "item");
  assert.equal(sections.at(-1).item.path, "/admin/extra");
  assert.equal(allPaths(sections).includes("/admin/hidden"), false);
});

test("navItemIsActive matches the item path and its sub-routes only", () => {
  assert.equal(navItemIsActive("/admin/treks", "/admin/treks"), true);
  assert.equal(navItemIsActive("/admin/treks", "/admin/treks/kalsubai"), true);
  assert.equal(navItemIsActive("/admin/bookings", "/admin/booking-form"), false);
  assert.equal(navItemIsActive("/admin/treks", "/admin/tours"), false);
  assert.equal(navItemIsActive("", "/admin/treks"), false);
});

test("groupIdsContainingPath returns the group that owns the active route", () => {
  const sections = buildNavSections(ADMIN);
  assert.deepEqual(groupIdsContainingPath("/admin/treks", sections), ["listings"]);
  assert.deepEqual(groupIdsContainingPath("/admin/villas/new", sections), ["listings"]);
  assert.deepEqual(groupIdsContainingPath("/admin/enquiries", sections), ["crm"]);
  assert.deepEqual(groupIdsContainingPath("/admin/dashboard", sections), []);
  assert.deepEqual(groupIdsContainingPath("/admin/missing", sections), []);
});

test("readOpenGroupIds and writeOpenGroupIds persist a unique string list", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
  };

  assert.deepEqual(readOpenGroupIds(storage), []);
  writeOpenGroupIds(["listings", "crm", "listings", "", 2], storage);
  assert.equal(store.get(OPEN_GROUPS_STORAGE_KEY), JSON.stringify(["listings", "crm"]));
  assert.deepEqual(readOpenGroupIds(storage), ["listings", "crm"]);
});

test("readOpenGroupIds returns [] for missing, corrupt or non-array values", () => {
  const make = (value) => ({ getItem: () => value });
  assert.deepEqual(readOpenGroupIds(make(null)), []);
  assert.deepEqual(readOpenGroupIds(make("not-json")), []);
  assert.deepEqual(readOpenGroupIds(make('{"listings":true}')), []);
  assert.deepEqual(readOpenGroupIds(undefined), []);
});

test("mergeOpenGroups unions saved open state with the active-route groups", () => {
  assert.deepEqual(mergeOpenGroups(["content"], ["listings"]), ["content", "listings"]);
  assert.deepEqual(mergeOpenGroups(["listings"], ["listings"]), ["listings"]);
  assert.deepEqual(mergeOpenGroups([], ["crm"]), ["crm"]);
});

test("toggleGroupId opens a closed group and closes an open one", () => {
  assert.deepEqual(toggleGroupId([], "listings"), ["listings"]);
  assert.deepEqual(toggleGroupId(["listings", "crm"], "listings"), ["crm"]);
});

test("NAV_GROUP_DEFS paths all exist on NAV_ITEMS", () => {
  const itemPaths = new Set(NAV_ITEMS.map((item) => item.path));
  for (const group of NAV_GROUP_DEFS) {
    for (const path of group.paths) {
      assert.ok(itemPaths.has(path), `${group.id} points at missing path ${path}`);
    }
  }
});
