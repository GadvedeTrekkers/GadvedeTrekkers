import { getAllBookings } from "./bookingStorage";
import { upsertCustomerActivity } from "./customerStorage";
import { createAlert, recordEmailAlertAttempt } from "./notificationStorage";
import { getAllCredentials } from "./employeePortalStorage";
import { apiRequest } from "../api/backendClient";
import { isStaffArea } from "../utils/clientDataHygiene";

function _syncEnquiry(entry) {
  apiRequest("/api/enquiries", { method: "POST", body: entry })
    .catch((err) => console.warn("Enquiry sync failed", err.message));
}

function _syncEnquiryUpdate(id, updates) {
  apiRequest(`/api/enquiries/${id}`, { method: "PATCH", body: updates, admin: true })
    .catch((err) => console.warn("Enquiry update sync failed", err.message));
}

const KEY = "gt_enquiries";

export const ENQUIRY_STATUS = {
  NEW_LEAD: "NEW_LEAD",
  CONTACTED: "CONTACTED",
  QUOTED: "QUOTED",
  CONVERTED: "CONVERTED",
  LOST: "LOST",
};

export const ENQUIRY_TAGS = ["High Intent"];

export function getEnquiries(options = {}) {
  const includeArchived =
    typeof options === "boolean" ? options : Boolean(options.includeArchived);
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]");
    return includeArchived ? items : items.filter((item) => !item.archivedAt);
  } catch {
    return [];
  }
}

function saveAllEnquiries(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function normalisePhone(value = "") {
  return String(value).replace(/\D/g, "").slice(-10);
}

function normaliseEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normaliseEventName(value = "") {
  return String(value).trim().toLowerCase();
}

function deriveLocation(enquiry = {}) {
  if (enquiry.location) return enquiry.location;
  const value = enquiry.eventName || enquiry.tour || "";
  return value.split("–")[0].split("|")[0].trim() || "Unknown";
}

function derivePageKey(pageUrl = "") {
  if (!pageUrl) return "Direct";
  try {
    const url = new URL(pageUrl, window.location.origin);
    return url.pathname || "Direct";
  } catch {
    return pageUrl;
  }
}

function enrichEnquiryWithBooking(enquiry, bookings = getAllBookings()) {
  const phone = normalisePhone(enquiry.contact || enquiry.phone || "");
  const email = normaliseEmail(enquiry.email || "");
  const eventName = normaliseEventName(enquiry.eventName || enquiry.tour || "");
  const matchingBooking = bookings.find((booking) => {
    const bookingPhone = normalisePhone(booking.contactNumber || booking.whatsappNumber || "");
    const bookingEmail = normaliseEmail(booking.email || "");
    const bookingEvent = normaliseEventName(
      booking.eventName || booking.trekName || booking.tourName || ""
    );
    const matchesContact =
      (phone && bookingPhone === phone) || (email && bookingEmail === email);
    const matchesEvent = !eventName || !bookingEvent || bookingEvent === eventName;
    return matchesContact && matchesEvent;
  });

  if (!matchingBooking) {
    return {
      ...enquiry,
      location: deriveLocation(enquiry),
      pageKey: derivePageKey(enquiry.pageUrl),
      bookedEventName: "",
      bookedBookingId: "",
      customerId: enquiry.customerId || "",
    };
  }

  return {
    ...enquiry,
    location: deriveLocation(enquiry),
    pageKey: derivePageKey(enquiry.pageUrl),
    status: ENQUIRY_STATUS.CONVERTED,
    convertedAt: enquiry.convertedAt || matchingBooking.savedAt || new Date().toISOString(),
    bookedEventName:
      matchingBooking.trekName ||
      matchingBooking.tourName ||
      matchingBooking.eventName ||
      "",
    bookedBookingId:
      matchingBooking.enhancedBookingId ||
      matchingBooking.bookingId ||
      "",
    customerId: enquiry.customerId || matchingBooking.customerId || "",
  };
}

export function saveEnquiry(enquiry) {
  const entry = enrichEnquiryWithBooking({
    ...enquiry,
    id: `ENQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    eventName: enquiry.eventName || enquiry.tour || "",
    phone: enquiry.phone || enquiry.contact || "",
    createdAt: new Date().toISOString(),
    viewedAt: "",
    firstResponseAt: "",
    convertedAt: "",
    status: ENQUIRY_STATUS.NEW_LEAD,
    tags: [],
    assignedSalesEmployeeId: "",
    assignedSalesName: "",
    assignedSalesUsername: "",
    archivedAt: "",
  });

  const list = [entry, ...getEnquiries()];
  saveAllEnquiries(list);

  const customer = upsertCustomerActivity({
    name: entry.name,
    phone: entry.phone,
    email: entry.email || "",
    enquiry: entry,
  });

  const nextEntry = { ...entry, customerId: customer.id };
  saveAllEnquiries([nextEntry, ...list.slice(1)]);
  _syncEnquiry(nextEntry);

  createAlert({
    type: "ENQUIRY",
    title: "New Enquiry Received",
    message: `${nextEntry.name} enquired for ${nextEntry.eventName || "an event"}`,
    meta: {
      enquiryId: nextEntry.id,
      phone: nextEntry.phone,
      eventName: nextEntry.eventName,
    },
  });

  recordEmailAlertAttempt({
    kind: "Enquiry",
    enquiryId: nextEntry.id,
    customerName: nextEntry.name,
    eventName: nextEntry.eventName,
    phone: nextEntry.phone,
  });

  return nextEntry;
}

export function updateEnquiry(id, updates) {
  let updatedEntry = null;
  const next = getEnquiries(true).map((enquiry) => {
    if (enquiry.id !== id) return enquiry;
    const nextEntry = { ...enquiry, ...updates };
    const movingToResponseStage =
      enquiry.status === ENQUIRY_STATUS.NEW_LEAD &&
      nextEntry.status &&
      nextEntry.status !== ENQUIRY_STATUS.NEW_LEAD;
    const movingToConverted =
      nextEntry.status === ENQUIRY_STATUS.CONVERTED && !enquiry.convertedAt;
    updatedEntry = enrichEnquiryWithBooking({
      ...nextEntry,
      firstResponseAt:
        nextEntry.firstResponseAt ||
        (movingToResponseStage ? new Date().toISOString() : enquiry.firstResponseAt || ""),
      convertedAt:
        nextEntry.convertedAt ||
        (movingToConverted ? new Date().toISOString() : enquiry.convertedAt || ""),
    });
    return updatedEntry;
  });
  saveAllEnquiries(next);

  if (updatedEntry) {
    upsertCustomerActivity({
      name: updatedEntry.name,
      phone: updatedEntry.phone || updatedEntry.contact,
      email: updatedEntry.email || "",
      enquiry: updatedEntry,
    });
    _syncEnquiryUpdate(id, updates);
  }

  return updatedEntry;
}

export function setEnquiryStatus(id, status) {
  return updateEnquiry(id, { status });
}

export function markEnquiryViewed(id) {
  const enquiry = getEnquiries(true).find((item) => item.id === id);
  if (!enquiry) return null;

  return updateEnquiry(id, {
    viewedAt: new Date().toISOString(),
  });
}

export function setEnquiryTags(id, tags = []) {
  return updateEnquiry(id, {
    tags: Array.from(new Set(tags.filter(Boolean))),
  });
}

export function setEnquiryAssignment(id, assignee = {}) {
  return updateEnquiry(id, {
    assignedSalesEmployeeId: assignee.employeeId || "",
    assignedSalesName: assignee.fullName || assignee.name || "",
    assignedSalesUsername: assignee.username || "",
  });
}

export function getAssignableSalesPeople() {
  return getAllCredentials()
    .filter((cred) => cred.onboardingStatus === "APPROVED")
    .map((cred) => ({
      employeeId: cred.employeeId,
      username: cred.username,
      fullName: cred.fullName,
    }));
}

export function getEnquiryInsights(items = getEnquiries()) {
  const total = items.length;
  const converted = items.filter((item) => item.status === ENQUIRY_STATUS.CONVERTED).length;

  const byLocation = new Map();
  const byPage = new Map();
  const responseTimes = [];

  items.forEach((item) => {
    const location = deriveLocation(item);
    byLocation.set(location, (byLocation.get(location) || 0) + 1);

    const pageKey = derivePageKey(item.pageUrl);
    const pageEntry = byPage.get(pageKey) || { total: 0, converted: 0 };
    pageEntry.total += 1;
    if (item.status === ENQUIRY_STATUS.CONVERTED) pageEntry.converted += 1;
    byPage.set(pageKey, pageEntry);

    if (item.firstResponseAt && item.createdAt) {
      const diff = new Date(item.firstResponseAt).getTime() - new Date(item.createdAt).getTime();
      if (diff >= 0) responseTimes.push(diff);
    }
  });

  const topLocation =
    Array.from(byLocation.entries()).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  const bestPage =
    Array.from(byPage.entries())
      .map(([page, values]) => ({
        page,
        rate: values.total ? (values.converted / values.total) * 100 : 0,
        total: values.total,
      }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total)[0] || { page: "None", rate: 0, total: 0 };

  const avgResponseMs = responseTimes.length
    ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
    : 0;

  return {
    topLocation: { label: topLocation[0], count: topLocation[1] },
    bestPage,
    avgResponseMs,
    conversionRate: total ? (converted / total) * 100 : 0,
    total,
    converted,
  };
}

export function archiveEnquiry(id) {
  return updateEnquiry(id, {
    archivedAt: new Date().toISOString(),
  });
}

export function syncEnquiriesWithBookings() {
  const bookings = getAllBookings();
  const next = getEnquiries(true).map((enquiry) => enrichEnquiryWithBooking(enquiry, bookings));
  saveAllEnquiries(next);

  next.forEach((enquiry) => {
    upsertCustomerActivity({
      name: enquiry.name,
      phone: enquiry.phone || enquiry.contact,
      email: enquiry.email || "",
      enquiry,
      booking: enquiry.bookedEventName
        ? {
            bookingId: enquiry.bookedBookingId,
            eventName: enquiry.bookedEventName,
            bookingStatus: "CONFIRMED",
            savedAt: enquiry.convertedAt || new Date().toISOString(),
          }
        : undefined,
      syncRemote: false, // derived reconciliation, not a new customer action
    });
  });

  return next;
}

const SEED_ENQUIRIES = [
  {
    id: "ENQ-SEED-001",
    name: "Arjun Sharma",
    phone: "9823456701",
    email: "arjun.sharma@gmail.com",
    eventName: "Harishchandragad Trek",
    category: "Trek",
    pax: "2",
    date: "2026-04-05",
    createdAt: "2026-03-20T09:15:00.000Z",
    viewedAt: "",
    status: ENQUIRY_STATUS.NEW_LEAD,
    tags: ["High Intent"],
    pageUrl: "/corporate",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: "Pratik Ubhe",
    assignedSalesUsername: "pratik.ubhe",
  },
  {
    id: "ENQ-SEED-002",
    name: "Priya Patil",
    phone: "9834567802",
    email: "priya.patil@yahoo.com",
    eventName: "Kalsubai Trek",
    category: "Trek",
    pax: "4",
    date: "2026-04-12",
    createdAt: "2026-03-18T13:40:00.000Z",
    viewedAt: "2026-03-18T15:05:00.000Z",
    firstResponseAt: "2026-03-18T15:05:00.000Z",
    status: ENQUIRY_STATUS.CONTACTED,
    tags: [],
    pageUrl: "/industrial-visits",
  },
  {
    id: "ENQ-SEED-003",
    name: "Rohit Desai",
    phone: "9845678903",
    email: "rohit.desai@gmail.com",
    eventName: "Rajmachi Trek",
    category: "Trek",
    pax: "6",
    date: "2026-04-18",
    createdAt: "2026-03-15T11:00:00.000Z",
    viewedAt: "2026-03-15T11:20:00.000Z",
    firstResponseAt: "2026-03-15T11:20:00.000Z",
    status: ENQUIRY_STATUS.QUOTED,
    tags: ["High Intent"],
    pageUrl: "/treks",
  },
  {
    id: "ENQ-SEED-004",
    name: "Sneha Joshi",
    phone: "9856789004",
    email: "sneha.joshi@outlook.com",
    eventName: "Malvan Tarkarli with Scuba Diving and Watersports",
    category: "Tour",
    pax: "3",
    date: "2026-04-10",
    createdAt: "2026-03-16T08:10:00.000Z",
    viewedAt: "2026-03-16T09:00:00.000Z",
    firstResponseAt: "2026-03-16T09:00:00.000Z",
    status: ENQUIRY_STATUS.CONVERTED,
    convertedAt: "2026-03-18T09:00:00.000Z",
    tags: [],
    pageUrl: "/tours/malvan-tarkarli-with-scuba-diving-and-watersports",
  },
  {
    id: "ENQ-SEED-005",
    name: "Vikram Kulkarni",
    phone: "9867890105",
    email: "vikram.kulkarni@gmail.com",
    eventName: "Goa Backpacking",
    category: "Tour",
    pax: "5",
    date: "2026-04-22",
    createdAt: "2026-03-19T18:30:00.000Z",
    viewedAt: "",
    status: ENQUIRY_STATUS.NEW_LEAD,
    tags: [],
    pageUrl: "/tours/goa-backpacking",
  },
  {
    id: "ENQ-SEED-006",
    name: "Neha Mehta",
    phone: "9878901206",
    email: "neha.mehta@gmail.com",
    eventName: "Pawna Lake Camping 2026",
    category: "Camping",
    pax: "8",
    date: "2026-04-06",
    createdAt: "2026-03-17T16:25:00.000Z",
    viewedAt: "2026-03-17T17:00:00.000Z",
    firstResponseAt: "2026-03-17T17:00:00.000Z",
    status: ENQUIRY_STATUS.LOST,
    tags: [],
    pageUrl: "/camping",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: "Pratik Ubhe",
    assignedSalesUsername: "pratik.ubhe",
  },
  {
    id: "ENQ-SEED-007",
    name: "Sneha Joshi",
    phone: "9123456780",
    email: "sneha.joshi@gmail.com",
    eventName: "Bhimashankar Trek",
    category: "Trek",
    pax: "2",
    date: "2026-04-20",
    createdAt: "2026-03-21T10:30:00.000Z",
    viewedAt: "2026-03-21T11:00:00.000Z",
    firstResponseAt: "2026-03-21T11:00:00.000Z",
    status: ENQUIRY_STATUS.NEW_LEAD,
    tags: ["High Intent"],
    pageUrl: "/treks/bhimashankar-trek",
  },
];

// Demo enquiries exist only in local dev builds. `import.meta.env.DEV` is a build-time
// constant, so Vite drops SEED_ENQUIRIES (names, emails, phones) from production bundles.
if (import.meta.env.DEV) (function seedEnquiriesIfEmpty() {
  if (!isStaffArea()) return; // demo data only inside admin/employee pages
  try {
    const existing = getEnquiries(true);
    const existingIds = new Set(existing.map((item) => item.id));
    const merged = [
      ...existing,
      ...SEED_ENQUIRIES.filter((item) => !existingIds.has(item.id)).map((item) =>
        enrichEnquiryWithBooking(item)
      ),
    ];
    saveAllEnquiries(merged);
    syncEnquiriesWithBookings();
  } catch {
    /* ignore seed failures */
  }
})();
