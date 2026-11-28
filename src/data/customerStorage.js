/* ─────────────────────────────────────────────────────────────
   Customer Storage Service
   Handles create / find / list operations for customers.
   Deduplicates on phone (primary) or email (fallback).
───────────────────────────────────────────────────────────── */

import { apiRequest } from "../api/backendClient";
import { isAdminAuthenticated } from "./authStorage";

/* Customer PII is never written to localStorage. Records live in memory for
   this page session only; the admin panel loads the real list from the
   backend (GET /api/customers, admin JWT) via hydrateCustomers(). */
let _customers = [];

/* ── raw helpers ── */
export function getAllCustomers() {
  return _customers.slice();
}

function _save(customers) {
  _customers = Array.isArray(customers) ? customers.slice() : [];
}

export function hydrateCustomers(list) {
  _save(list);
}

/* Customer writes to the backend happen only for a signed-in staff member acting
   in the admin panel or employee portal (the endpoint is staff-only). The public
   website never calls POST /api/customers/upsert: public enquiries create the
   customer on the server (POST /api/enquiries), and nothing here runs on page load. */
export function syncCustomer(customer) {
  if (!isAdminAuthenticated()) return Promise.resolve(false);
  return apiRequest("/api/customers/upsert", {
    method: "POST",
    body: customer,
    admin: true,
  })
    .then(() => true)
    .catch((error) => {
      console.warn("Customer sync failed", error?.message || error);
      return false;
    });
}

function normalisePhone(value = "") {
  return String(value).replace(/\D/g, "").slice(-10);
}

function normaliseEmail(value = "") {
  return String(value).trim().toLowerCase();
}

/* ── find or create ──────────────────────────────────────────
   Returns existing customer if phone or email matches,
   otherwise creates a new one. Never duplicates.
─────────────────────────────────────────────────────────── */
export function findOrCreateCustomer({ name, phone, email = "" }, { syncRemote = true } = {}) {
  const all = getAllCustomers();
  const phoneKey = normalisePhone(phone);
  const emailKey = normaliseEmail(email);

  // 1) match by phone
  let found = phoneKey ? all.find((c) => normalisePhone(c.phone) === phoneKey) : null;
  // 2) fallback: match by email
  if (!found && emailKey) found = all.find((c) => c.email && normaliseEmail(c.email) === emailKey);

  if (found) {
    const updated = {
      ...found,
      name: found.name || name || "Unknown",
      phone: found.phone || phoneKey || "",
      email: found.email || emailKey || "",
    };
    if (JSON.stringify(updated) !== JSON.stringify(found)) {
      _save(all.map((customer) => (customer.id === found.id ? updated : customer)));
    }
    return updated;
  }

  const customer = {
    id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: name || "Unknown",
    phone: phoneKey || "",
    email: emailKey || "",
    createdAt: new Date().toISOString(),
    enquiries: [],
    bookings: [],
    tags: [],
    enquiryCount: 0,
    bookingCount: 0,
  };

  _save([customer, ...all]);
  if (syncRemote) syncCustomer(customer);
  return customer;
}

function dedupeById(items = [], idKey = "id") {
  const map = new Map();
  items.forEach((item) => {
    const key = item?.[idKey];
    if (!key) return;
    map.set(key, item);
  });
  return Array.from(map.values());
}

export function updateCustomerRecord(id, updates) {
  const customers = getAllCustomers();
  let nextCustomer = null;
  const next = customers.map((customer) => {
    if (customer.id !== id) return customer;
    nextCustomer = { ...customer, ...updates };
    return nextCustomer;
  });
  if (nextCustomer) _save(next);
  if (nextCustomer) syncCustomer(nextCustomer);
  return nextCustomer;
}

export function upsertCustomerActivity({
  name,
  phone,
  email = "",
  enquiry,
  booking,
  syncRemote = true,
}) {
  const customer = findOrCreateCustomer({ name, phone, email }, { syncRemote });
  const customers = getAllCustomers();

  const next = customers.map((item) => {
    if (item.id !== customer.id) return item;

    const nextCustomer = {
      ...item,
      name: name || item.name,
      email: email || item.email,
      lastContactAt: new Date().toISOString(),
      enquiries: Array.isArray(item.enquiries) ? [...item.enquiries] : [],
      bookings: Array.isArray(item.bookings) ? [...item.bookings] : [],
      tags: Array.isArray(item.tags) ? [...item.tags] : [],
    };

    if (enquiry) {
      nextCustomer.enquiries = dedupeById(
        [
          ...nextCustomer.enquiries,
          {
            id: enquiry.id,
            eventName: enquiry.eventName || enquiry.tour || "",
            category: enquiry.category || "",
            status: enquiry.status || "NEW",
            tags: enquiry.tags || [],
            createdAt: enquiry.createdAt || new Date().toISOString(),
          },
        ],
        "id"
      );
      nextCustomer.enquiryCount = nextCustomer.enquiries.length;
      nextCustomer.latestEnquiryStatus = enquiry.status || nextCustomer.latestEnquiryStatus || "NEW";
      nextCustomer.latestEnquiryEvent = enquiry.eventName || enquiry.tour || nextCustomer.latestEnquiryEvent || "";
      nextCustomer.tags = Array.from(
        new Set([...(nextCustomer.tags || []), ...((enquiry.tags || []).filter(Boolean))])
      );
    }

    if (booking) {
      nextCustomer.bookings = dedupeById(
        [
          ...nextCustomer.bookings,
          {
            id: booking.bookingId || booking.enhancedBookingId,
            eventName: booking.eventName || booking.trekName || booking.tourName || "",
            status: booking.bookingStatus || "CONFIRMED",
            travelDate: booking.travelDate || booking.nextDate || "",
            createdAt: booking.savedAt || new Date().toISOString(),
          },
        ],
        "id"
      );
      nextCustomer.bookingCount = nextCustomer.bookings.length;
      nextCustomer.latestBookedEvent = booking.eventName || booking.trekName || booking.tourName || "";
      nextCustomer.latestBookingStatus = booking.bookingStatus || "CONFIRMED";
    }

    return nextCustomer;
  });

  _save(next);
  const updatedCustomer = next.find((item) => item.id === customer.id) || customer;
  if (syncRemote) syncCustomer(updatedCustomer);
  return updatedCustomer;
}

/* ── look-ups ── */
export function getCustomerById(id) {
  return getAllCustomers().find((c) => c.id === id) || null;
}

export function getCustomerByPhone(phone) {
  const phoneKey = normalisePhone(phone);
  return getAllCustomers().find((c) => normalisePhone(c.phone) === phoneKey) || null;
}

/* ── search ── */
export function searchCustomers(query = "") {
  if (!query.trim()) return getAllCustomers();
  const q = query.trim().toLowerCase();
  return getAllCustomers().filter(
    (c) =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
  );
}
