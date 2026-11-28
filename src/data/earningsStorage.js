/* ─────────────────────────────────────────────
   Earnings Storage  — localStorage
   Supports: Trek, Tent Rental, Villa, Camping, College IV
───────────────────────────────────────────── */
import { isStaffArea } from "../utils/clientDataHygiene";

const KEY = "gt_earnings";

/* ── Internal helpers ── */
function _load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function _save(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }
function _id() { return "ERN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); }

/* ── Profit formula per revenue type ── */
export function computeProfit(entry) {
  const {
    revenueType,
    /* Trek */
    trekRevenue = 0, transportCost = 0, foodCost = 0, trekOtherExpenses = 0,
    /* Tent Rental */
    tentQty = 0, rentPerTent = 0, durationDays = 0, tentMaintenance = 0,
    /* Villa */
    villaRentPerDay = 0, villaDays = 0, villaServiceCharges = 0,
    /* Camping */
    campingPerPerson = 0, campingParticipants = 0, campingSetup = 0, campingFoodLogistics = 0,
    /* College IV */
    collegePkgPerStudent = 0, collegeStudents = 0, collegeCost = 0,
    /* Common extras */
    trekLeaderPay = 0, vendorCosts = 0,
  } = entry;

  const extra = Number(trekLeaderPay) + Number(vendorCosts);

  switch (revenueType) {
    case "Trek / Tour": {
      const rev = Number(trekRevenue);
      const exp = Number(transportCost) + Number(foodCost) + Number(trekOtherExpenses) + extra;
      return { revenue: rev, expenses: exp, profit: rev - exp };
    }
    case "Tent Rental": {
      const rev = Number(tentQty) * Number(rentPerTent) * Number(durationDays);
      const exp = Number(tentMaintenance) + extra;
      return { revenue: rev, expenses: exp, profit: rev - exp };
    }
    case "Villa Rental": {
      const rev = Number(villaRentPerDay) * Number(villaDays);
      const exp = Number(villaServiceCharges) + extra;
      return { revenue: rev, expenses: exp, profit: rev - exp };
    }
    case "Camping": {
      const rev = Number(campingPerPerson) * Number(campingParticipants);
      const exp = Number(campingSetup) + Number(campingFoodLogistics) + extra;
      return { revenue: rev, expenses: exp, profit: rev - exp };
    }
    case "College IV": {
      const rev = Number(collegePkgPerStudent) * Number(collegeStudents);
      const exp = Number(collegeCost) + extra;
      return { revenue: rev, expenses: exp, profit: rev - exp };
    }
    default:
      return { revenue: 0, expenses: 0, profit: 0 };
  }
}

/* ── CRUD ── */
export function getAllEarnings() { return _load(); }

export function saveEarning(entry) {
  const all = _load();
  const calc = computeProfit(entry);
  if (entry.earningId) {
    const updated = all.map((e) =>
      e.earningId === entry.earningId
        ? { ...e, ...entry, ...calc, updatedAt: new Date().toISOString() }
        : e
    );
    _save(updated);
    return updated.find((e) => e.earningId === entry.earningId);
  }
  const newEntry = {
    ...entry,
    ...calc,
    earningId: _id(),
    createdAt: new Date().toISOString(),
    paymentStatus: entry.paymentStatus || "PAID",
  };
  _save([newEntry, ...all]);
  return newEntry;
}

export function deleteEarning(earningId) {
  _save(_load().filter((e) => e.earningId !== earningId));
}

export function queryEarnings({ revenueType, fromDate, toDate, search, paymentStatus } = {}) {
  let list = _load();
  if (revenueType)    list = list.filter((e) => e.revenueType === revenueType);
  if (paymentStatus)  list = list.filter((e) => e.paymentStatus === paymentStatus);
  if (fromDate)       list = list.filter((e) => e.date >= fromDate);
  if (toDate)         list = list.filter((e) => e.date <= toDate);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((e) =>
      (e.clientName || "").toLowerCase().includes(q) ||
      (e.earningId || "").toLowerCase().includes(q) ||
      (e.trekName || e.villaName || e.collegeName || "").toLowerCase().includes(q)
    );
  }
  return list;
}

/* ── Summary analytics ── */
export function getEarningsSummary() {
  const all = _load();
  const totalRevenue  = all.reduce((s, e) => s + (e.revenue  || 0), 0);
  const totalExpenses = all.reduce((s, e) => s + (e.expenses || 0), 0);
  const totalProfit   = all.reduce((s, e) => s + (e.profit   || 0), 0);
  const pending       = all.filter((e) => e.paymentStatus === "PENDING").reduce((s, e) => s + ((e.revenue || 0) - (e.paidAmount || 0)), 0);

  const byType = {};
  all.forEach((e) => {
    const t = e.revenueType || "Other";
    if (!byType[t]) byType[t] = { revenue: 0, profit: 0, count: 0 };
    byType[t].revenue += e.revenue || 0;
    byType[t].profit  += e.profit  || 0;
    byType[t].count   += 1;
  });

  /* Monthly revenue (last 6 months) */
  const monthly = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthly[key] = 0;
  }
  all.forEach((e) => {
    if (!e.date) return;
    const d = new Date(e.date);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (key in monthly) monthly[key] += e.revenue || 0;
  });

  return { totalRevenue, totalExpenses, totalProfit, pending, byType, monthly, count: all.length };
}

/* ── Seed 10 sample earnings ── */
// Dev-only demo data: compiled out of production builds (build-time constant).
if (import.meta.env.DEV) (function seed() {
  if (!isStaffArea()) return; // demo data only inside admin/employee pages
  if (_load().length > 0) return;
  const samples = [
    { revenueType: "Trek / Tour", clientName: "Rohan Patil", trekName: "Rajmachi Fort", date: "2026-01-10", trekRevenue: 28000, transportCost: 8000, foodCost: 4000, trekOtherExpenses: 1000, trekLeaderPay: 2000, vendorCosts: 500, paymentStatus: "PAID" },
    { revenueType: "Trek / Tour", clientName: "Sunita Mane", trekName: "Harishchandragad", date: "2026-01-22", trekRevenue: 35000, transportCost: 12000, foodCost: 5000, trekOtherExpenses: 2000, trekLeaderPay: 2500, vendorCosts: 0, paymentStatus: "PAID" },
    { revenueType: "Trek / Tour", clientName: "Vikram Shinde", trekName: "Kalsubai Peak", date: "2026-02-05", trekRevenue: 22000, transportCost: 7000, foodCost: 3500, trekOtherExpenses: 500, trekLeaderPay: 1500, vendorCosts: 800, paymentStatus: "PENDING" },
    { revenueType: "Tent Rental", clientName: "Priya Kulkarni", date: "2026-01-15", tentQty: 10, rentPerTent: 500, durationDays: 3, tentMaintenance: 800, trekLeaderPay: 0, vendorCosts: 0, paymentStatus: "PAID" },
    { revenueType: "Tent Rental", clientName: "Amit Joshi", date: "2026-02-18", tentQty: 20, rentPerTent: 450, durationDays: 2, tentMaintenance: 1200, trekLeaderPay: 0, vendorCosts: 500, paymentStatus: "PAID" },
    { revenueType: "Villa Rental", clientName: "Deepa Sharma", villaName: "Sahyadri Retreat", date: "2026-01-28", villaRentPerDay: 8000, villaDays: 3, villaServiceCharges: 2000, trekLeaderPay: 0, vendorCosts: 0, paymentStatus: "PAID" },
    { revenueType: "Villa Rental", clientName: "Nikhil Gaikwad", villaName: "Forest View Villa", date: "2026-02-14", villaRentPerDay: 6000, villaDays: 2, villaServiceCharges: 1500, trekLeaderPay: 0, vendorCosts: 0, paymentStatus: "PENDING" },
    { revenueType: "Camping", clientName: "Aditya Rao", date: "2026-01-30", campingPerPerson: 800, campingParticipants: 30, campingSetup: 3000, campingFoodLogistics: 5000, trekLeaderPay: 1000, vendorCosts: 0, paymentStatus: "PAID" },
    { revenueType: "College IV", clientName: "Pune IT College", collegeName: "Pune IT College", date: "2026-02-10", collegePkgPerStudent: 1200, collegeStudents: 50, collegeCost: 25000, trekLeaderPay: 3000, vendorCosts: 2000, paymentStatus: "PAID" },
    { revenueType: "College IV", clientName: "COEP Group", collegeName: "COEP Pune", date: "2026-02-25", collegePkgPerStudent: 1500, collegeStudents: 80, collegeCost: 55000, trekLeaderPay: 4000, vendorCosts: 3000, paymentStatus: "PENDING" },
  ];
  samples.forEach((s) => saveEarning(s));
})();
