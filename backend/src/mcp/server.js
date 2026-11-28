/**
 * Gadvede Trekkers MCP server — READ-ONLY tools over the existing Supabase data.
 * No create / update / delete tools and no bulk export (every list is paginated, max 50 per page).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  BOOKING_STATUSES, ENQUIRY_STATUSES, MAX_PAGE_SIZE, PAYMENT_STATUSES, TRIP_TYPES,
} from "./dataAccess.js";

export const SERVER_NAME = "gadvede-trekkers";
export const SERVER_VERSION = "1.0.0";

export const TOOL_NAMES = Object.freeze([
  "list_trips", "get_trip", "list_batches", "list_bookings", "get_booking",
  "list_enquiries", "booking_summary", "list_reviews",
]);

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional();
const page = {
  limit: z.number().int().min(1).optional().describe(`Page size (default 20, capped at ${MAX_PAGE_SIZE})`),
  offset: z.number().int().min(0).optional().describe("Rows to skip, for the next page"),
};
const tripRef = z.string().min(1).max(120);

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function fail(message) {
  return { isError: true, content: [{ type: "text", text: message }] };
}
function safe(fn) {
  return async (args) => {
    try { return await fn(args || {}); } catch (err) { return fail(String(err?.message || "Request failed").slice(0, 300)); }
  };
}

export function createMcpServer({ data }) {
  if (!data) throw new Error("createMcpServer needs a data access object");
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: "Read-only access to Gadvede Trekkers trips, batches, bookings, enquiries and reviews. Customer phone/email are masked unless the server owner enabled full PII. Lists are paginated (max 50)." },
  );

  server.registerTool("list_trips", {
    title: "List trips",
    description: "List treks, camping, tours, villas and other trips with price, status and the next 3 upcoming dates (seats left).",
    inputSchema: {
      type: z.enum(TRIP_TYPES).optional().describe("Filter by type"),
      activeOnly: z.boolean().optional().describe("Only trips shown on the website (default true)"),
      ...page,
    },
    annotations: READ_ONLY,
  }, safe((a) => data.listTrips({ ...a, activeOnly: a.activeOnly !== false }).then(ok)));

  server.registerTool("get_trip", {
    title: "Get trip",
    description: "One trip by slug (e.g. kalsubai-trek) or id, with all upcoming batches and seats left.",
    inputSchema: { trip: tripRef.describe("Trip slug or id") },
    annotations: READ_ONLY,
  }, safe(async (a) => { const t = await data.getTrip(a); return t ? ok(t) : fail("Trip not found"); }));

  server.registerTool("list_batches", {
    title: "List batches",
    description: "Upcoming departure batches with seats total, booked and left. Defaults to today onwards.",
    inputSchema: {
      trip: tripRef.optional().describe("Trip slug or id"),
      from: date.describe("From date YYYY-MM-DD (default today)"),
      to: date.describe("To date YYYY-MM-DD"),
      openOnly: z.boolean().optional().describe("Only batches that are open and have seats"),
      ...page,
    },
    annotations: READ_ONLY,
  }, safe((a) => data.listBatches(a).then(ok)));

  server.registerTool("list_bookings", {
    title: "List bookings",
    description: "Bookings, newest first, filtered by trip, date range, booking status and payment status. Paginated, max 50 per page. Customer contact details are masked by default.",
    inputSchema: {
      trip: tripRef.optional().describe("Trip slug or id"),
      from: date.describe("From date YYYY-MM-DD"),
      to: date.describe("To date YYYY-MM-DD"),
      dateField: z.enum(["travel", "booked"]).optional().describe("Apply the date range to the travel date (default) or the booking date"),
      status: z.enum(BOOKING_STATUSES).optional(),
      paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
      ...page,
    },
    annotations: READ_ONLY,
  }, safe((a) => data.listBookings(a).then(ok)));

  server.registerTool("get_booking", {
    title: "Get booking",
    description: "One booking by booking code (GT-…) or legacy id (GTK-…), with amounts, batch and travelers. PII masked by default.",
    inputSchema: { bookingCode: z.string().min(3).max(60) },
    annotations: READ_ONLY,
  }, safe(async (a) => { const b = await data.getBooking(a); return b ? ok(b) : fail("Booking not found"); }));

  server.registerTool("list_enquiries", {
    title: "List enquiries / leads",
    description: "CRM enquiries and leads, newest first, filtered by status, date range and trip name. Paginated, max 50. PII masked by default.",
    inputSchema: {
      status: z.enum(ENQUIRY_STATUSES).optional(),
      from: date.describe("Created on/after YYYY-MM-DD"),
      to: date.describe("Created on/before YYYY-MM-DD"),
      trip: z.string().max(100).optional().describe("Part of the trip / event name"),
      ...page,
    },
    annotations: READ_ONLY,
  }, safe((a) => data.listEnquiries(a).then(ok)));

  server.registerTool("booking_summary", {
    title: "Booking summary",
    description: "Counts, travelers and revenue (booked, collected, outstanding) by trip and by month, plus status breakdowns. Aggregates only, no customer data.",
    inputSchema: {
      from: date, to: date,
      dateField: z.enum(["travel", "booked"]).optional().describe("Group/filter by travel date (default) or booking date"),
      trip: tripRef.optional().describe("Limit to one trip (slug or id)"),
    },
    annotations: READ_ONLY,
  }, safe((a) => data.bookingSummary(a).then(ok)));

  server.registerTool("list_reviews", {
    title: "List reviews",
    description: "Customer reviews / feedback with rating and comment, newest first. Paginated, max 50.",
    inputSchema: {
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      minRating: z.number().int().min(1).max(5).optional(),
      trip: z.string().max(100).optional().describe("Part of the trip name"),
      ...page,
    },
    annotations: READ_ONLY,
  }, safe((a) => data.listReviews(a).then(ok)));

  return server;
}
