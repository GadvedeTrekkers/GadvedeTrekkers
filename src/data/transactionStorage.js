/* ─────────────────────────────────────────────────────────────
   Transaction Storage Service
   Models:
     Transaction  – one per payment attempt
     Refund       – one or more per transaction
   Rules:
     • One booking → multiple transactions (loosely coupled)
     • Refund amount ≤ grossAmount − already-refunded
     • Cancelled bookings must not create new transactions (caller responsibility)
   Schema additions (additive, non-breaking):
     • customerId  – links transaction to customer module
     • dateTime    – ISO timestamp alias (same value as createdAt)
───────────────────────────────────────────────────────────── */
import { isStaffArea } from "../utils/clientDataHygiene";

import { apiRequest } from "../api/backendClient";

const TXN_KEY    = "gt_transactions";
const REFUND_KEY = "gt_refunds";

/* ── raw helpers ── */
export function getAllTransactions() {
  try { return JSON.parse(localStorage.getItem(TXN_KEY) || "[]"); } catch { return []; }
}
function _saveTxns(txns) { localStorage.setItem(TXN_KEY, JSON.stringify(txns)); }

export function getAllRefunds() {
  try { return JSON.parse(localStorage.getItem(REFUND_KEY) || "[]"); } catch { return []; }
}
function _saveRefunds(refunds) { localStorage.setItem(REFUND_KEY, JSON.stringify(refunds)); }

/* ── ID helpers ── */
function _txnId()    { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function _refundId() { return `RFD-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }

/* ── Create transaction ──────────────────────────────────────
   transactionStatus: 'SUCCESS' | 'FAILED' | 'REFUNDED'
   paymentMode:       'CASH' | 'UPI' | 'CARD' | 'Partial' | 'NET BANK'
   customerId:        links to customer module (additive)
   dateTime:          ISO string — same as createdAt (required by Part 4 schema)
─────────────────────────────────────────────────────────── */
export function createTransaction({
  bookingId,
  customerId,
  customerName,
  paymentMode,
  grossAmount,
  tax,
  netAmount,
  transactionStatus = "SUCCESS",
}) {
  const now = new Date().toISOString();
  const txn = {
    transactionId:     _txnId(),
    bookingId:         bookingId         || "",
    customerId:        customerId        || "",
    customerName:      customerName      || "Unknown",
    transactionStatus: transactionStatus,
    paymentMode:       paymentMode       || "UPI",
    tax:               Number(tax)       || 0,
    netAmount:         Number(netAmount) || 0,
    grossAmount:       Number(grossAmount) || 0,
    createdAt:         now,
    dateTime:          now,              /* Part 4 required field — alias of createdAt */
  };
  _saveTxns([txn, ...getAllTransactions()]);
  apiRequest("/api/payments/upsert", {
    method: "POST",
    body: txn,
  }).catch((error) => console.warn("Transaction sync failed", error));
  return txn;
}

/* ── Update status ── */
export function updateTransactionStatus(transactionId, status) {
  const all = getAllTransactions();
  const updated = all.map((t) =>
    t.transactionId === transactionId ? { ...t, transactionStatus: status } : t
  );
  _saveTxns(updated);
  const transaction = updated.find((t) => t.transactionId === transactionId) || null;
  if (transaction) {
    apiRequest("/api/payments/upsert", {
      method: "POST",
      body: transaction,
    }).catch((error) => console.warn("Transaction status sync failed", error));
  }
  return transaction;
}

/* ── Refund ──────────────────────────────────────────────────
   Full or partial refund.
   Validates:
     • refundAmount ≤ (grossAmount − alreadyRefunded)
     • Prevents refund if grossAmount already fully refunded
   Updates transaction status → REFUNDED on success.
─────────────────────────────────────────────────────────── */
export function createRefund({ transactionId, amount }) {
  const txn = getAllTransactions().find((t) => t.transactionId === transactionId);
  if (!txn) return { error: "Transaction not found" };

  const alreadyRefunded = getAllRefunds()
    .filter((r) => r.transactionId === transactionId)
    .reduce((sum, r) => sum + r.amount, 0);

  const maxRefund = txn.grossAmount - alreadyRefunded;

  if (maxRefund <= 0) {
    return { error: "This transaction has already been fully refunded." };
  }
  if (Number(amount) > maxRefund) {
    return { error: `Refund amount ₹${amount} exceeds available ₹${maxRefund}` };
  }
  if (Number(amount) <= 0) return { error: "Refund amount must be greater than 0" };

  const refund = {
    refundId:      _refundId(),
    transactionId,
    amount:        Number(amount),
    status:        "REFUNDED",
    createdAt:     new Date().toISOString(),
  };

  _saveRefunds([...getAllRefunds(), refund]);
  updateTransactionStatus(transactionId, "REFUNDED");
  apiRequest("/api/payments/refunds", {
    method: "POST",
    admin: true,
    body: refund,
  }).catch((error) => console.warn("Refund sync failed", error));
  return { refund };
}

/* ── Get refunds for a transaction ── */
export function getRefundsForTransaction(transactionId) {
  return getAllRefunds().filter((r) => r.transactionId === transactionId);
}

/* ── Filter / Search / Sort ──────────────────────────────────
   Filters:
     status      – 'SUCCESS' | 'FAILED' | 'REFUNDED'
     paymentMode – 'CASH' | 'UPI' | 'CARD' | 'Partial' | 'NET BANK'
     fromDate    – ISO date string
     toDate      – ISO date string
   Search (partial match):
     customerName, customerId, bookingId, transactionId
   Sort:
     latest (default) | oldest | amount-high | amount-low
─────────────────────────────────────────────────────────── */
export function queryTransactions({
  status,
  paymentMode,
  fromDate,
  toDate,
  search,
  sortBy = "latest",
} = {}) {
  let results = getAllTransactions();

  if (status)      results = results.filter((t) => t.transactionStatus === status);
  if (paymentMode) results = results.filter((t) => t.paymentMode === paymentMode);

  if (fromDate) {
    const from = new Date(fromDate).getTime();
    results = results.filter((t) => new Date(t.createdAt).getTime() >= from);
  }
  if (toDate) {
    const to = new Date(toDate).getTime() + 86_400_000;
    results = results.filter((t) => new Date(t.createdAt).getTime() <= to);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (t) =>
        t.customerName?.toLowerCase().includes(q) ||
        t.customerId?.toLowerCase().includes(q) ||
        t.bookingId?.toLowerCase().includes(q) ||
        t.transactionId?.toLowerCase().includes(q)
    );
  }

  if      (sortBy === "latest")      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === "oldest")      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortBy === "amount-high") results.sort((a, b) => b.grossAmount - a.grossAmount);
  else if (sortBy === "amount-low")  results.sort((a, b) => a.grossAmount - b.grossAmount);

  return results;
}

/* ── Summary stats ── */
export function getTransactionStats() {
  const all = getAllTransactions();
  return {
    total:    all.length,
    success:  all.filter((t) => t.transactionStatus === "SUCCESS").length,
    failed:   all.filter((t) => t.transactionStatus === "FAILED").length,
    refunded: all.filter((t) => t.transactionStatus === "REFUNDED").length,
    revenue:  all
      .filter((t) => t.transactionStatus === "SUCCESS")
      .reduce((s, t) => s + t.grossAmount, 0),
  };
}

/* ── Seed transactions ───────────────────────────────────────
   30 seed transactions linked to seed bookings and customers.
   Statuses: 15 SUCCESS · 8 FAILED · 7 REFUNDED
   Payment modes: CASH · UPI · CARD  (as per Part 4 spec)
   Auto-seeded on first load if gt_transactions is empty.
─────────────────────────────────────────────────────────── */
const _TXN_STATUSES = [
  "SUCCESS","SUCCESS","SUCCESS","SUCCESS","SUCCESS",
  "SUCCESS","SUCCESS","SUCCESS","SUCCESS","SUCCESS",
  "SUCCESS","SUCCESS","SUCCESS","SUCCESS","SUCCESS",
  "FAILED","FAILED","FAILED","FAILED","FAILED",
  "FAILED","FAILED","FAILED",
  "REFUNDED","REFUNDED","REFUNDED","REFUNDED","REFUNDED","REFUNDED","REFUNDED",
];
const _TXN_MODES = [
  "UPI","CARD","CASH","UPI","CARD",
  "UPI","CASH","CARD","UPI","CASH",
  "CARD","UPI","CARD","CASH","UPI",
  "CARD","UPI","CASH","CARD","UPI",
  "CASH","CARD","UPI",
  "CARD","CASH","UPI","CARD","CASH","UPI","CARD",
];

/* Mirror of seed customers in bookingStorage — kept in sync */
const _SEED_CUST = [
  { id:"CUST-seed-01", name:"Arjun Sharma" },
  { id:"CUST-seed-02", name:"Priya Patil" },
  { id:"CUST-seed-03", name:"Rohit Desai" },
  { id:"CUST-seed-04", name:"Sneha Joshi" },
  { id:"CUST-seed-05", name:"Vikram Kulkarni" },
  { id:"CUST-seed-06", name:"Neha Mehta" },
  { id:"CUST-seed-07", name:"Amit Bhosale" },
  { id:"CUST-seed-08", name:"Kavita Rane" },
  { id:"CUST-seed-09", name:"Suresh Naik" },
  { id:"CUST-seed-10", name:"Pooja Wagh" },
  { id:"CUST-seed-11", name:"Rahul Shinde" },
  { id:"CUST-seed-12", name:"Anita Pawar" },
  { id:"CUST-seed-13", name:"Deepak Gaikwad" },
  { id:"CUST-seed-14", name:"Swati More" },
  { id:"CUST-seed-15", name:"Sachin Kadam" },
  { id:"CUST-seed-16", name:"Rujuta Mane" },
  { id:"CUST-seed-17", name:"Omkar Jadhav" },
  { id:"CUST-seed-18", name:"Dipali Sawant" },
  { id:"CUST-seed-19", name:"Nikhil Thakur" },
  { id:"CUST-seed-20", name:"Gayatri Deshpande" },
  { id:"CUST-seed-21", name:"Prathamesh Salvi" },
  { id:"CUST-seed-22", name:"Ashwini Chavan" },
  { id:"CUST-seed-23", name:"Yash Kore" },
  { id:"CUST-seed-24", name:"Rutuja Ghuge" },
  { id:"CUST-seed-25", name:"Siddharth Phadtare" },
  { id:"CUST-seed-26", name:"Manasi Dalvi" },
  { id:"CUST-seed-27", name:"Tejas Bhalekar" },
  { id:"CUST-seed-28", name:"Shraddha Kamble" },
  { id:"CUST-seed-29", name:"Akash Lonkar" },
  { id:"CUST-seed-30", name:"Pallavi Nimbalkar" },
];

/* Amounts mirror the seed bookings (base 999 + surcharge, 5% tax) */
const _SEED_AMOUNTS = [
  /* i=0  Pune  1tkts UPI       */ { gross:1349, tax:64,  net:1299 },
  /* i=1  Mum   2tkts CARD      */ { gross:2938, tax:140, net:2798 },
  /* i=2  Kasa  3tkts CASH      */ { gross:3807, tax:182, net:3624 },
  /* i=3  Base  2tkts UPI-Ptl   */ { gross:400,  tax:95,  net:1998 },
  /* i=4  Pune  1tkts CARD      */ { gross:1349, tax:64,  net:1299 },
  /* i=5  Mum   4tkts UPI       */ { gross:5876, tax:280, net:5596 },
  /* i=6  Kasa  2tkts CASH      */ { gross:2538, tax:121, net:2416 },
  /* i=7  Base  1tkts CARD      */ { gross:1049, tax:50,  net:999  },
  /* i=8  Pune  3tkts UPI       */ { gross:4047, tax:193, net:3897 },
  /* i=9  Mum   2tkts CASH      */ { gross:2938, tax:140, net:2798 },
  /* i=10 Kasa  1tkts CARD      */ { gross:1269, tax:60,  net:1208 },
  /* i=11 Base  2tkts UPI-Ptl   */ { gross:400,  tax:95,  net:1998 },
  /* i=12 Pune  3tkts CARD      */ { gross:4047, tax:193, net:3897 },
  /* i=13 Mum   1tkts CASH      */ { gross:1469, tax:70,  net:1399 },
  /* i=14 Kasa  2tkts UPI       */ { gross:2538, tax:121, net:2416 },
  /* i=15 Base  3tkts CARD FAIL */ { gross:3147, tax:150, net:2997 },
  /* i=16 Pune  1tkts UPI  FAIL */ { gross:1349, tax:64,  net:1299 },
  /* i=17 Mum   2tkts CASH FAIL */ { gross:2938, tax:140, net:2798 },
  /* i=18 Kasa  1tkts CARD FAIL */ { gross:1269, tax:60,  net:1208 },
  /* i=19 Base  3tkts UPI  FAIL */ { gross:3147, tax:150, net:2997 },
  /* i=20 Pune  2tkts CASH FAIL */ { gross:2698, tax:129, net:2598 },
  /* i=21 Mum   1tkts CARD FAIL */ { gross:1469, tax:70,  net:1399 },
  /* i=22 Kasa  2tkts UPI  FAIL */ { gross:2538, tax:121, net:2416 },
  /* i=23 Base  3tkts CARD RFD  */ { gross:3147, tax:150, net:2997 },
  /* i=24 Pune  1tkts CASH RFD  */ { gross:1349, tax:64,  net:1299 },
  /* i=25 Mum   2tkts UPI  RFD  */ { gross:2938, tax:140, net:2798 },
  /* i=26 Kasa  1tkts CARD RFD  */ { gross:1269, tax:60,  net:1208 },
  /* i=27 Base  2tkts CASH RFD  */ { gross:400,  tax:95,  net:1998 },
  /* i=28 Pune  1tkts UPI  RFD  */ { gross:1349, tax:64,  net:1299 },
  /* i=29 Mum   2tkts CARD RFD  */ { gross:2938, tax:140, net:2798 },
];

(function seedTransactionsIfEmpty() {
  if (!isStaffArea()) return; // demo data only inside admin/employee pages
  try {
    if (getAllTransactions().length > 0) return;

    const baseMs = new Date(2025, 8, 1).getTime();
    const seeds  = _SEED_CUST.map((c, i) => {
      const amt = _SEED_AMOUNTS[i];
      const dt  = new Date(baseMs + i * 6 * 24 * 3600 * 1000).toISOString();
      return {
        transactionId:     `TXN-seed-${String(i + 1).padStart(4, "0")}`,
        bookingId:         `GT-2025-${String(i + 1).padStart(6, "0")}`,
        customerId:        c.id,
        customerName:      c.name,
        transactionStatus: _TXN_STATUSES[i],
        paymentMode:       _TXN_MODES[i],
        grossAmount:       amt.gross,
        tax:               amt.tax,
        netAmount:         amt.net,
        createdAt:         dt,
        dateTime:          dt,
      };
    });
    _saveTxns(seeds);
  } catch { /* ignore */ }
})();
