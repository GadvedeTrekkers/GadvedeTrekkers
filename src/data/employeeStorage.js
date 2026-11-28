/* ══════════════════════════════════════════════════
   employeeStorage.js  —  Gadvede Trekkers
   Handles: Employees · Assignments · Expenses · Availability
══════════════════════════════════════════════════ */
import { isStaffArea } from "../utils/clientDataHygiene";

const EMPLOYEES_KEY   = "gt_employees";
const ASSIGNMENTS_KEY = "gt_assignments";
const EXPENSES_KEY    = "gt_expenses";
const AVAILABILITY_KEY = "gt_availability";

function _uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/* ─────────────────────────────────────────────────
   EMPLOYEES
───────────────────────────────────────────────── */
export function getAllEmployees() {
  try { return JSON.parse(localStorage.getItem(EMPLOYEES_KEY)) || []; }
  catch { return []; }
}
function _saveEmployees(arr) { localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(arr)); }

export function saveEmployee(emp) {
  const all = getAllEmployees();
  if (emp.employeeId) {
    _saveEmployees(all.map(e => e.employeeId === emp.employeeId
      ? { ...e, ...emp, updatedAt: new Date().toISOString() } : e));
    return emp;
  }
  const n = {
    ...emp,
    employeeId: _uid("EMP"),
    status: emp.status || "active",
    performanceRating: 0,
    eventsHandled: 0,
    createdAt: new Date().toISOString(),
  };
  _saveEmployees([n, ...all]);
  return n;
}

export function deleteEmployee(id) {
  _saveEmployees(getAllEmployees().filter(e => e.employeeId !== id));
}

export function queryEmployees({ search, role, status, expertise } = {}) {
  let list = getAllEmployees();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e =>
      e.fullName?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.contactNumber?.includes(q) ||
      e.employeeId?.toLowerCase().includes(q)
    );
  }
  if (role)      list = list.filter(e => e.role      === role);
  if (status)    list = list.filter(e => e.status    === status);
  if (expertise) list = list.filter(e => e.expertise === expertise);
  return list;
}

/* ─────────────────────────────────────────────────
   ASSIGNMENTS
───────────────────────────────────────────────── */
export function getAllAssignments() {
  try { return JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY)) || []; }
  catch { return []; }
}
function _saveAssignments(arr) { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(arr)); }

export function saveAssignment(asgn) {
  const all = getAllAssignments();
  if (asgn.assignmentId) {
    _saveAssignments(all.map(a => a.assignmentId === asgn.assignmentId ? { ...a, ...asgn, updatedAt: new Date().toISOString() } : a));
    return asgn;
  }
  const n = {
    ...asgn,
    whatsappGroupLink: asgn.whatsappGroupLink || "",
    assignmentId: _uid("ASGN"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  _saveAssignments([n, ...all]);
  /* bump eventsHandled for assigned employees */
  _saveEmployees(getAllEmployees().map(e =>
    (asgn.employeeIds || []).includes(e.employeeId)
      ? { ...e, eventsHandled: (e.eventsHandled || 0) + 1 }
      : e
  ));
  return n;
}

export function deleteAssignment(id) {
  _saveAssignments(getAllAssignments().filter(a => a.assignmentId !== id));
}

/* ─────────────────────────────────────────────────
   EXPENSES
───────────────────────────────────────────────── */
export function getAllExpenses() {
  try { return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || []; }
  catch { return []; }
}
function _saveExpenses(arr) { localStorage.setItem(EXPENSES_KEY, JSON.stringify(arr)); }

export function submitExpense(exp) {
  const all = getAllExpenses();
  if (exp.expenseId) {
    _saveExpenses(all.map(e => e.expenseId === exp.expenseId
      ? { ...e, ...exp, updatedAt: new Date().toISOString() } : e));
    return exp;
  }
  const n = {
    ...exp,
    expenseId: _uid("EXP"),
    status: "Submitted",
    paymentStatus: "",
    reviewNote: "",
    submittedAt: new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  _saveExpenses([n, ...all]);
  return n;
}

export function updateExpenseStatus(expenseId, status, paymentStatus, reviewNote) {
  const all = getAllExpenses();
  _saveExpenses(all.map(e =>
    e.expenseId === expenseId
      ? { ...e, status, paymentStatus: paymentStatus ?? e.paymentStatus, reviewNote: reviewNote ?? e.reviewNote, updatedAt: new Date().toISOString() }
      : e
  ));
  return getAllExpenses().find(e => e.expenseId === expenseId);
}

export function deleteExpense(id) {
  _saveExpenses(getAllExpenses().filter(e => e.expenseId !== id));
}

export function queryExpenses({ employeeId, status, expenseType, search } = {}) {
  let list = getAllExpenses();
  if (employeeId)  list = list.filter(e => e.employeeId  === employeeId);
  if (status)      list = list.filter(e => e.status      === status);
  if (expenseType) list = list.filter(e => e.expenseType === expenseType);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e =>
      e.employeeName?.toLowerCase().includes(q) ||
      e.eventName?.toLowerCase().includes(q) ||
      e.expenseId?.toLowerCase().includes(q)
    );
  }
  return list;
}

/* ─────────────────────────────────────────────────
   AVAILABILITY
───────────────────────────────────────────────── */
export function getAvailabilityMap() {
  try { return JSON.parse(localStorage.getItem(AVAILABILITY_KEY)) || {}; }
  catch { return {}; }
}
export function setEmployeeAvailability(employeeId, blockedDates, notes) {
  const map = getAvailabilityMap();
  map[employeeId] = { blockedDates: blockedDates || [], notes: notes || "", updatedAt: new Date().toISOString() };
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(map));
}
export function getEmployeeAvailability(employeeId) {
  return getAvailabilityMap()[employeeId] || { blockedDates: [], notes: "" };
}

/* ─────────────────────────────────────────────────
   SEED DATA  (auto-seeded on first load)
───────────────────────────────────────────────── */
const SEED_EMPLOYEES = [
  /* ── Management / Admin users ── */
  {
    employeeId: "EMP-ADMIN-PRATIK",
    fullName: "Pratik Ubhe",
    contactNumber: "9856112727",
    email: "pratik.ubhe@gadvede.com",
    address: "Pune, Maharashtra",
    skills: ["Sales", "Lead Management", "Business Development", "CRM", "Customer Success"],
    certifications: [],
    experience: { years: 7, description: "Co-founder and Sales Head. Manages all inbound leads, corporate deals, and customer relationships." },
    expertise: "Sales",
    linkedin: "",
    instagram: "",
    role: "Sales Manager",
    status: "active",
    performanceRating: 4.9,
    eventsHandled: 120,
    createdAt: "2020-01-01T10:00:00.000Z",
  },
  {
    employeeId: "EMP-ADMIN-ROHIT",
    fullName: "Rohit Panhalkar",
    contactNumber: "9876500001",
    email: "rohit.panhalkar@gadvede.com",
    address: "Pune, Maharashtra",
    skills: ["Operations", "Trek Leadership", "Vendor Management", "Route Planning"],
    certifications: [{ name: "Mountaineering Basic", details: "NIM Certified 2019" }],
    experience: { years: 8, description: "Operations Head. Plans all trek routes and manages vendor partnerships." },
    expertise: "Trek Leader",
    linkedin: "",
    instagram: "",
    role: "Operations Head",
    status: "active",
    performanceRating: 4.8,
    eventsHandled: 200,
    createdAt: "2019-06-01T10:00:00.000Z",
  },
  {
    employeeId: "EMP-ADMIN-AKSHAY",
    fullName: "Akshay Kangude",
    contactNumber: "9876500002",
    email: "akshay.kangude@gadvede.com",
    address: "Pune, Maharashtra",
    skills: ["Digital Marketing", "SEO", "Content", "Social Media", "Analytics"],
    certifications: [],
    experience: { years: 5, description: "Marketing and Tech Head. Manages the website, bookings platform, and digital campaigns." },
    expertise: "Coordinator",
    linkedin: "",
    instagram: "",
    role: "Marketing Head",
    status: "active",
    performanceRating: 4.7,
    eventsHandled: 60,
    createdAt: "2021-03-01T10:00:00.000Z",
  },
  {
    employeeId: "EMP-SEED-001",
    fullName: "Rahul Patil",
    contactNumber: "9876543210",
    email: "rahul.patil@gadvede.com",
    address: "Pune, Maharashtra",
    skills: ["Trek Leadership", "First Aid", "Navigation", "Rock Climbing"],
    certifications: [{ name: "Wilderness First Responder", details: "WFR Certified 2024" }],
    experience: { years: 5, description: "Led 80+ treks across Sahyadri and Himalayan ranges" },
    expertise: "Trek Leader",
    linkedin: "https://linkedin.com/in/rahulpatil",
    instagram: "",
    role: "Trek Leader",
    status: "active",
    performanceRating: 4.8,
    eventsHandled: 84,
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    employeeId: "EMP-SEED-002",
    fullName: "Priya Deshmukh",
    contactNumber: "9765432109",
    email: "priya.deshmukh@gadvede.com",
    address: "Nashik, Maharashtra",
    skills: ["Coordination", "Customer Service", "Documentation", "Event Planning"],
    certifications: [],
    experience: { years: 3, description: "Managed 50+ group bookings and college IV events" },
    expertise: "Coordinator",
    linkedin: "",
    instagram: "https://instagram.com/priya_treks",
    role: "Coordinator",
    status: "active",
    performanceRating: 4.5,
    eventsHandled: 52,
    createdAt: "2024-03-10T10:00:00.000Z",
  },
  {
    employeeId: "EMP-SEED-003",
    fullName: "Amit Shinde",
    contactNumber: "9654321098",
    email: "amit.shinde@gadvede.com",
    address: "Mumbai, Maharashtra",
    skills: ["Photography", "First Aid", "Trek Support", "Camp Setup"],
    certifications: [{ name: "Mountain Rescue", details: "MR Level 2 — 2023" }],
    experience: { years: 4, description: "Support roles in 60+ treks, expert camp setup" },
    expertise: "Guide",
    linkedin: "",
    instagram: "",
    role: "Support Staff",
    status: "active",
    performanceRating: 4.3,
    eventsHandled: 61,
    createdAt: "2024-02-20T10:00:00.000Z",
  },
  {
    employeeId: "EMP-SEED-004",
    fullName: "Sneha Kulkarni",
    contactNumber: "9543210987",
    email: "sneha.kulkarni@gadvede.com",
    address: "Kolhapur, Maharashtra",
    skills: ["Yoga", "Fitness Training", "Trek Leadership", "Nutrition"],
    certifications: [{ name: "Yoga Instructor", details: "200hr YTT Certified" }],
    experience: { years: 6, description: "Leads fitness treks and wellness camps" },
    expertise: "Instructor",
    linkedin: "https://linkedin.com/in/snehakulkarni",
    instagram: "https://instagram.com/sneha_wellness",
    role: "Trek Leader",
    status: "active",
    performanceRating: 4.9,
    eventsHandled: 72,
    createdAt: "2023-11-05T10:00:00.000Z",
  },
  {
    employeeId: "EMP-SEED-005",
    fullName: "Vikram Jadhav",
    contactNumber: "9432109876",
    email: "vikram.jadhav@gadvede.com",
    address: "Aurangabad, Maharashtra",
    skills: ["Logistics", "Vehicle Management", "Budget Tracking"],
    certifications: [],
    experience: { years: 2, description: "Handles logistics and vendor coordination for events" },
    expertise: "Coordinator",
    linkedin: "",
    instagram: "",
    role: "Coordinator",
    status: "inactive",
    performanceRating: 3.8,
    eventsHandled: 18,
    createdAt: "2025-01-10T10:00:00.000Z",
  },
];

const SEED_EXPENSES = [
  {
    expenseId: "EXP-SEED-001",
    employeeId: "EMP-SEED-001",
    employeeName: "Rahul Patil",
    eventName: "Rajgad Fort Trek",
    expenseType: "Travel",
    amount: 1200,
    description: "Bus fare Pune to Rajgad base village",
    status: "Approved",
    paymentStatus: "Paid",
    reviewNote: "",
    submittedAt: "2026-02-10T10:00:00.000Z",
    updatedAt:   "2026-02-12T10:00:00.000Z",
  },
  {
    expenseId: "EXP-SEED-002",
    employeeId: "EMP-SEED-002",
    employeeName: "Priya Deshmukh",
    eventName: "College IV — SPPU 2026",
    expenseType: "Food",
    amount: 800,
    description: "Snacks and water for 40 students",
    status: "Under Review",
    paymentStatus: "",
    reviewNote: "",
    submittedAt: "2026-03-05T10:00:00.000Z",
    updatedAt:   "2026-03-06T10:00:00.000Z",
  },
  {
    expenseId: "EXP-SEED-003",
    employeeId: "EMP-SEED-003",
    employeeName: "Amit Shinde",
    eventName: "Camping — Bhandardara",
    expenseType: "Stay",
    amount: 2500,
    description: "Tent rental and ground charges",
    status: "Submitted",
    paymentStatus: "",
    reviewNote: "",
    submittedAt: "2026-03-18T10:00:00.000Z",
    updatedAt:   "2026-03-18T10:00:00.000Z",
  },
  {
    expenseId: "EXP-SEED-004",
    employeeId: "EMP-SEED-001",
    employeeName: "Rahul Patil",
    eventName: "Harishchandragad Trek",
    expenseType: "Miscellaneous",
    amount: 450,
    description: "Rope and safety equipment maintenance",
    status: "Rejected",
    paymentStatus: "",
    reviewNote: "Receipt not uploaded. Please resubmit with valid bill.",
    submittedAt: "2026-01-20T10:00:00.000Z",
    updatedAt:   "2026-01-22T10:00:00.000Z",
  },
  {
    expenseId: "EXP-SEED-005",
    employeeId: "EMP-SEED-004",
    employeeName: "Sneha Kulkarni",
    eventName: "Wellness Camp — Lonavala",
    expenseType: "Travel",
    amount: 950,
    description: "Shared taxi to Lonavala",
    status: "Approved",
    paymentStatus: "Pending",
    reviewNote: "",
    submittedAt: "2026-03-01T10:00:00.000Z",
    updatedAt:   "2026-03-03T10:00:00.000Z",
  },
];

const SEED_ASSIGNMENTS = [
  {
    assignmentId: "ASGN-SEED-001",
    eventName: "Rajgad Fort Trek",
    eventType: "Trek",
    date: "2026-04-06",
    assignedRole: "Trek Leader",
    employeeIds: ["EMP-SEED-001", "EMP-SEED-003"],
    notes: "Weekend batch — 25 participants",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    assignmentId: "ASGN-SEED-002",
    eventName: "College IV — SPPU 2026",
    eventType: "College IV",
    date: "2026-04-12",
    assignedRole: "Coordinator",
    employeeIds: ["EMP-SEED-002"],
    notes: "40 students from SPPU Engineering",
    createdAt: "2026-03-10T10:00:00.000Z",
  },
  {
    assignmentId: "ASGN-SEED-003",
    eventName: "Bhandardara Camping",
    eventType: "Camping",
    date: "2026-04-19",
    assignedRole: "All Roles",
    employeeIds: ["EMP-SEED-001", "EMP-SEED-004", "EMP-SEED-003"],
    notes: "Family camping batch — 30 participants",
    createdAt: "2026-03-15T10:00:00.000Z",
  },
];

// Dev-only demo staff/expenses/assignments: compiled out of production builds
// (build-time constant), so no staff names, emails or phone numbers ship publicly.
if (import.meta.env.DEV) (function _seedOnce() {
  if (!isStaffArea()) return; // demo data only inside admin/employee pages
  /* Merge employees — preserve existing records, add any missing seed employees */
  try {
    const existing = JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || "[]");
    const existingIds = new Set(existing.map(e => e.employeeId));
    const toAdd = SEED_EMPLOYEES.filter(e => !existingIds.has(e.employeeId));
    if (toAdd.length > 0 || !localStorage.getItem(EMPLOYEES_KEY)) {
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify([...existing, ...toAdd]));
    }
  } catch { localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(SEED_EMPLOYEES)); }

  if (!localStorage.getItem(EXPENSES_KEY))    localStorage.setItem(EXPENSES_KEY,    JSON.stringify(SEED_EXPENSES));
  if (!localStorage.getItem(ASSIGNMENTS_KEY)) localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(SEED_ASSIGNMENTS));
})();
