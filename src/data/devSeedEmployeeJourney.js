const DEMO_FLAG = "__gt_employee_journey_demo_registered__";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function upsertBy(list, item, keyName) {
  const index = list.findIndex((entry) => entry?.[keyName] === item?.[keyName]);
  if (index >= 0) {
    list[index] = { ...list[index], ...item };
    return list;
  }
  return [item, ...list];
}

function formatDate(offsetDays = 0) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

function isoAt(dateString, hour = 9, minute = 0) {
  return new Date(`${dateString}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`).toISOString();
}

function createLifecycle(currentStage, changedAt, actor, note, options = {}) {
  const {
    leaderName = "Rahul Patil",
    foodVendorName = "Mountain Bites",
    transportVendorName = "Shivaji Travels",
    markSettled = false,
  } = options;
  const done = (taskKey, assignedTo = "") => ({
    status: "DONE",
    assignedTo,
    completedAt: changedAt,
    completedBy: actor,
    note: "",
  });

  return {
    eventId: "",
    currentStage,
    stageHistory: [
      { stage: "CREATED", changedAt, changedBy: actor, note: "Demo journey seeded" },
      { stage: "BOOKING_OPEN", changedAt, changedBy: actor, note },
      ...(currentStage === "BOOKING_OPEN"
        ? []
        : [{ stage: currentStage, changedAt, changedBy: actor, note }]),
    ],
    tasks: [
      { taskId: "", taskKey: "assign_leader", label: "Assign Trek Leader", requiredStage: "BOOKING_OPEN", ...done("assign_leader", leaderName) },
      { taskId: "", taskKey: "confirm_food", label: "Confirm Food Vendor", requiredStage: "BOOKING_OPEN", ...done("confirm_food", foodVendorName) },
      { taskId: "", taskKey: "book_transport", label: "Book Transport", requiredStage: "BOOKING_OPEN", ...done("book_transport", transportVendorName) },
      { taskId: "", taskKey: "collect_payments", label: "Collect All Payments", requiredStage: "DEPARTURE", ...(currentStage === "BOOKING_OPEN" ? { status: "PENDING", assignedTo: leaderName, completedAt: null, completedBy: null, note: "" } : done("collect_payments", leaderName)) },
      { taskId: "", taskKey: "send_briefing", label: "Send Pre-Trek Briefing", requiredStage: "DEPARTURE", ...(currentStage === "BOOKING_OPEN" ? { status: "PENDING", assignedTo: leaderName, completedAt: null, completedBy: null, note: "" } : done("send_briefing", leaderName)) },
      { taskId: "", taskKey: "complete_trek", label: "Mark Trek Completed", requiredStage: "COMPLETED", ...(currentStage === "BOOKING_OPEN" ? { status: "PENDING", assignedTo: leaderName, completedAt: null, completedBy: null, note: "" } : done("complete_trek", leaderName)) },
      { taskId: "", taskKey: "settle_leader", label: "Settle Leader Payment", requiredStage: "PAYMENTS_SETTLED", ...(markSettled ? done("settle_leader", leaderName) : { status: "PENDING", assignedTo: leaderName, completedAt: null, completedBy: null, note: "" }) },
      { taskId: "", taskKey: "settle_vendors", label: "Settle Vendor Payments", requiredStage: "PAYMENTS_SETTLED", ...(markSettled ? done("settle_vendors", "Operations") : { status: "PENDING", assignedTo: "Operations", completedAt: null, completedBy: null, note: "" }) },
      { taskId: "", taskKey: "settle_incentives", label: "Settle Referral Incentives", requiredStage: "PAYMENTS_SETTLED", ...(markSettled ? done("settle_incentives", "Accounts") : { status: "PENDING", assignedTo: "Accounts", completedAt: null, completedBy: null, note: "" }) },
    ],
    notes: note,
  };
}

function chooseTreks() {
  const treks = readJson("gt_treks", []);
  const findByName = (value) =>
    treks.find((item) => item?.name?.toLowerCase() === value.toLowerCase());

  const rajmachi =
    findByName("Rajmachi Trek") ||
    findByName("Rajmachi Fort Trek") || {
      id: "seed_gt_treks_demo_rajmachi",
      name: "Rajmachi Trek",
      price: 1099,
      location: "Lonavala",
      nextDate: formatDate(10),
    };

  const kalsubai =
    findByName("Kalsubai Trek") ||
    findByName("Kalsubai Peak Trek") || {
      id: "seed_gt_treks_demo_kalsubai",
      name: "Kalsubai Trek",
      price: 999,
      location: "Ahmednagar",
      nextDate: formatDate(15),
    };

  const rajgad =
    findByName("Rajgad Fort Trek") ||
    findByName("Rajgad Trek") || {
      id: "seed_gt_treks_demo_rajgad",
      name: "Rajgad Fort Trek",
      price: 999,
      location: "Pune",
      nextDate: formatDate(-7),
    };

  return { rajmachi, kalsubai, rajgad };
}

function ensureCustomer(existing, customer, bookingSummary) {
  const next = {
    enquiries: [],
    bookings: [],
    tags: [],
    enquiryCount: 0,
    bookingCount: 0,
    ...customer,
  };

  if (bookingSummary) {
    next.bookings = [
      bookingSummary,
      ...(Array.isArray(next.bookings) ? next.bookings.filter((item) => item.id !== bookingSummary.id) : []),
    ];
    next.bookingCount = next.bookings.length;
    next.latestBookedEvent = bookingSummary.eventName;
    next.latestBookingStatus = bookingSummary.status;
  }

  return existing ? { ...existing, ...next } : next;
}

function seedEmployeeJourneyDemo() {
  if (!canUseStorage()) {
    return { seeded: false, reason: "localStorage unavailable" };
  }

  const actor = "Pratik Ubhe";
  const actorUsername = "pratik.ubhe";
  const rajmachiDate = formatDate(9);
  const kalsubaiDate = formatDate(15);
  const rajgadDate = formatDate(-6);
  const bookingCreatedAt = isoAt(formatDate(-2), 11, 15);
  const departureCreatedAt = isoAt(formatDate(-5), 9, 10);
  const completedCreatedAt = isoAt(formatDate(-12), 8, 45);
  const { rajmachi, kalsubai, rajgad } = chooseTreks();

  const trekPayments = readJson("gt_trek_payments", []);
  const bookings = readJson("gt_bookings", []);
  const customers = readJson("gt_customers", []);
  const enquiries = readJson("gt_enquiries", []);
  const incentives = readJson("gt_incentives", []);
  const transactions = readJson("gt_transactions", []);
  const logs = readJson("gt_activity_logs", []);
  const trekEvents = readJson("gt_trek_events", []);

  const leaderMap = {
    rahul: { employeeId: "EMP-SEED-001", fullName: "Rahul Patil", username: "rahul.patil", referralCode: "REF-RP001" },
    priya: { employeeId: "EMP-SEED-002", fullName: "Priya Deshmukh", username: "priya.deshmukh", referralCode: "REF-PD002" },
    amit: { employeeId: "EMP-SEED-003", fullName: "Amit Shinde", username: "amit.shinde", referralCode: "REF-AS003" },
  };

  const rajmachiPaymentId = "GT-EVT-DEMO-RAJMACHI-RAHUL";
  const kalsubaiPaymentId = "GT-EVT-DEMO-KALSUBAI-PRIYA";
  const rajgadPaymentId = "GT-EVT-DEMO-RAJGAD-AMIT";

  const rajmachiPayment = {
    paymentId: rajmachiPaymentId,
    eventId: rajmachiPaymentId,
    trekName: rajmachi.name,
    trekId: rajmachi.id || "",
    eventDate: rajmachiDate,
    participants: 6,
    status: "PENDING",
    config: {
      trekLeaderName: leaderMap.rahul.fullName,
      foodVendorName: "Mountain Bites",
      busVendorName: "Shivaji Travels",
      vendorName: "Shivaji Travels",
      whatsappGroupLink: "https://chat.whatsapp.com/demo-rajmachi-rahul",
      leaderFee: 2500,
      foodCostPerPerson: 350,
      transportCostFixed: 5200,
      entryFees: 50,
    },
    calculations: {
      leaderFee: 2500,
      foodTotal: 2100,
      transportTotal: 5200,
      entryTotal: 300,
      totalCost: 10100,
    },
    payments: [
      { recipientType: "LEADER", recipientName: leaderMap.rahul.fullName, amount: 2500, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 2500, overrideReason: "", isOverridden: false },
      { recipientType: "FOOD_VENDOR", recipientName: "Mountain Bites", amount: 2100, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 2100, overrideReason: "", isOverridden: false },
      { recipientType: "BUS_VENDOR", recipientName: "Shivaji Travels", amount: 5200, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 5200, overrideReason: "", isOverridden: false },
      { recipientType: "ENTRY_FEES", recipientName: "Entry Fees / Government", amount: 300, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 300, overrideReason: "", isOverridden: false },
    ],
    lifecycle: createLifecycle("BOOKING_OPEN", bookingCreatedAt, actor, "Sales opened bookings and assigned Rahul Patil to the upcoming Rajmachi batch.", {
      leaderName: leaderMap.rahul.fullName,
    }),
    createdBy: actor,
    createdByUsername: actorUsername,
    createdAt: bookingCreatedAt,
  };

  const kalsubaiPayment = {
    paymentId: kalsubaiPaymentId,
    eventId: kalsubaiPaymentId,
    trekName: kalsubai.name,
    trekId: kalsubai.id || "",
    eventDate: kalsubaiDate,
    participants: 4,
    status: "IN_PROGRESS",
    config: {
      trekLeaderName: leaderMap.priya.fullName,
      foodVendorName: "Campfire Kitchen",
      busVendorName: "Summit Travels",
      vendorName: "Summit Travels",
      whatsappGroupLink: "https://chat.whatsapp.com/demo-kalsubai-priya",
      leaderFee: 2200,
      foodCostPerPerson: 280,
      transportCostFixed: 4100,
      entryFees: 40,
    },
    calculations: {
      leaderFee: 2200,
      foodTotal: 1120,
      transportTotal: 4100,
      entryTotal: 160,
      totalCost: 7580,
    },
    payments: [
      { recipientType: "LEADER", recipientName: leaderMap.priya.fullName, amount: 2200, status: "COMPLETED", method: "UPI", reference: "UPI-DEMO-PRIYA", paidAt: departureCreatedAt, baseAmount: 2200, overrideReason: "", isOverridden: false },
      { recipientType: "FOOD_VENDOR", recipientName: "Campfire Kitchen", amount: 1120, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 1120, overrideReason: "", isOverridden: false },
      { recipientType: "BUS_VENDOR", recipientName: "Summit Travels", amount: 4100, status: "PENDING", method: "", reference: "", paidAt: null, baseAmount: 4100, overrideReason: "", isOverridden: false },
      { recipientType: "ENTRY_FEES", recipientName: "Entry Fees / Government", amount: 160, status: "COMPLETED", method: "CASH", reference: "CASH-KALSUBAI-ENTRY", paidAt: departureCreatedAt, baseAmount: 160, overrideReason: "", isOverridden: false },
    ],
    lifecycle: createLifecycle("DEPARTURE", departureCreatedAt, actor, "Priya Deshmukh received the briefing list, collected participant dues, and is ready for departure.", {
      leaderName: leaderMap.priya.fullName,
      foodVendorName: "Campfire Kitchen",
      transportVendorName: "Summit Travels",
    }),
    createdBy: actor,
    createdByUsername: actorUsername,
    createdAt: departureCreatedAt,
  };

  const rajgadPayment = {
    paymentId: rajgadPaymentId,
    eventId: rajgadPaymentId,
    trekName: rajgad.name,
    trekId: rajgad.id || "",
    eventDate: rajgadDate,
    participants: 5,
    status: "COMPLETED",
    config: {
      trekLeaderName: leaderMap.amit.fullName,
      foodVendorName: "Mountain Bites",
      busVendorName: "Shivaji Travels",
      vendorName: "Shivaji Travels",
      whatsappGroupLink: "https://chat.whatsapp.com/demo-rajgad-amit",
      leaderFee: 2800,
      foodCostPerPerson: 300,
      transportCostFixed: 5200,
      entryFees: 40,
    },
    calculations: {
      leaderFee: 2800,
      foodTotal: 1500,
      transportTotal: 5200,
      entryTotal: 200,
      totalCost: 9700,
    },
    payments: [
      { recipientType: "LEADER", recipientName: leaderMap.amit.fullName, amount: 2800, status: "COMPLETED", method: "UPI", reference: "UPI-DEMO-AMIT", paidAt: completedCreatedAt, baseAmount: 2800, overrideReason: "", isOverridden: false },
      { recipientType: "FOOD_VENDOR", recipientName: "Mountain Bites", amount: 1500, status: "COMPLETED", method: "BANK", reference: "BANK-DEMO-FOOD", paidAt: completedCreatedAt, baseAmount: 1500, overrideReason: "", isOverridden: false },
      { recipientType: "BUS_VENDOR", recipientName: "Shivaji Travels", amount: 5200, status: "COMPLETED", method: "BANK", reference: "BANK-DEMO-BUS", paidAt: completedCreatedAt, baseAmount: 5200, overrideReason: "", isOverridden: false },
      { recipientType: "ENTRY_FEES", recipientName: "Entry Fees / Government", amount: 200, status: "COMPLETED", method: "CASH", reference: "CASH-DEMO-ENTRY", paidAt: completedCreatedAt, baseAmount: 200, overrideReason: "", isOverridden: false },
    ],
    lifecycle: createLifecycle("PAYMENTS_SETTLED", completedCreatedAt, actor, "Amit completed the Rajgad trek and accounts settled leader plus vendor payouts.", {
      leaderName: leaderMap.amit.fullName,
      markSettled: true,
    }),
    createdBy: actor,
    createdByUsername: actorUsername,
    createdAt: completedCreatedAt,
  };

  const rajgadBooking = {
    bookingId: "GTK-DEMO-RAJGAD-001",
    enhancedBookingId: "GT-2026-DEMO-RAJGAD-001",
    customerId: "CUST-DEMO-RAJGAD-001",
    firstName: "Devika",
    lastName: "Joshi",
    email: "devika.joshi@example.com",
    contactNumber: "9012345678",
    whatsappNumber: "9012345678",
    trekName: rajgad.name,
    trekId: rajgad.id || "",
    eventName: rajgad.name,
    tickets: 2,
    departureOrigin: "Pune",
    pickupLocation: "Shivajinagar",
    travelDate: rajgadDate,
    emergencyContact: { name: "Sanjay Joshi", phone: "9090909090" },
    paymentOption: "UPI",
    paymentStatus: "PAID",
    pricePaid: 2598,
    totalPrice: 2598,
    totalAmount: 2598,
    payableNow: 2598,
    remainingAmount: 0,
    leaderCollected: 0,
    bookingStatus: "CONFIRMED",
    status: "CONFIRMED",
    bookingSource: "Website",
    referralCode: "",
    savedAt: completedCreatedAt,
    bookingDate: new Date(completedCreatedAt).toLocaleString("en-IN"),
  };

  const rajmachiBooking = {
    bookingId: "GTK-DEMO-RAJMACHI-001",
    enhancedBookingId: "GT-2026-DEMO-RAJMACHI-001",
    customerId: "CUST-DEMO-RAJMACHI-001",
    firstName: "Aarya",
    lastName: "Kulkarni",
    email: "aarya.kulkarni@example.com",
    contactNumber: "9123456789",
    whatsappNumber: "9123456789",
    trekName: rajmachi.name,
    trekId: rajmachi.id || "",
    eventName: rajmachi.name,
    tickets: 1,
    departureOrigin: "Pune",
    pickupLocation: "Deccan (08:30 PM)",
    travelDate: rajmachiDate,
    emergencyContact: { name: "Kiran Kulkarni", phone: "9988776655" },
    paymentOption: "Partial Payment",
    paymentStatus: "PARTIAL",
    pricePaid: 700,
    totalPrice: 1476,
    totalAmount: 1476,
    payableNow: 255,
    remainingAmount: 776,
    leaderCollected: 445,
    bookingStatus: "CONFIRMED",
    status: "CONFIRMED",
    bookingSource: "Referral Link",
    referralCode: leaderMap.rahul.referralCode,
    savedAt: bookingCreatedAt,
    bookingDate: new Date(bookingCreatedAt).toLocaleString("en-IN"),
  };

  const kalsubaiBooking = {
    bookingId: "GTK-DEMO-KALSUBAI-001",
    enhancedBookingId: "GT-2026-DEMO-KALSUBAI-001",
    customerId: "CUST-DEMO-KALSUBAI-001",
    firstName: "Sneha",
    lastName: "More",
    email: "sneha.more@example.com",
    contactNumber: "9876501234",
    whatsappNumber: "9876501234",
    trekName: kalsubai.name,
    trekId: kalsubai.id || "",
    eventName: kalsubai.name,
    tickets: 2,
    departureOrigin: "Kasara",
    pickupLocation: "Kasara Railway Station",
    travelDate: kalsubaiDate,
    emergencyContact: { name: "Mahesh More", phone: "9777701234" },
    paymentOption: "UPI",
    paymentStatus: "PAID",
    pricePaid: 2298,
    totalPrice: 2298,
    totalAmount: 2298,
    payableNow: 2298,
    remainingAmount: 0,
    leaderCollected: 0,
    bookingStatus: "CONFIRMED",
    status: "CONFIRMED",
    bookingSource: "Direct Booking",
    referralCode: leaderMap.priya.referralCode,
    savedAt: departureCreatedAt,
    bookingDate: new Date(departureCreatedAt).toLocaleString("en-IN"),
  };

  const completedCustomer = ensureCustomer(
    customers.find((item) => item.id === rajgadBooking.customerId),
    {
      id: rajgadBooking.customerId,
      name: "Devika Joshi",
      phone: rajgadBooking.contactNumber,
      email: rajgadBooking.email,
      createdAt: completedCreatedAt,
      latestEnquiryStatus: "CONVERTED",
      tags: ["High Intent"],
    },
    {
      id: rajgadBooking.enhancedBookingId,
      eventName: rajgadBooking.trekName,
      status: rajgadBooking.bookingStatus,
      travelDate: rajgadBooking.travelDate,
      createdAt: completedCreatedAt,
    }
  );

  const rajmachiCustomer = ensureCustomer(
    customers.find((item) => item.id === rajmachiBooking.customerId),
    {
      id: rajmachiBooking.customerId,
      name: "Aarya Kulkarni",
      phone: rajmachiBooking.contactNumber,
      email: rajmachiBooking.email,
      createdAt: bookingCreatedAt,
      latestEnquiryStatus: "CONTACTED",
      tags: ["High Intent", "Repeat Follow-up"],
    },
    {
      id: rajmachiBooking.enhancedBookingId,
      eventName: rajmachiBooking.trekName,
      status: rajmachiBooking.bookingStatus,
      travelDate: rajmachiBooking.travelDate,
      createdAt: bookingCreatedAt,
    }
  );

  const kalsubaiCustomer = ensureCustomer(
    customers.find((item) => item.id === kalsubaiBooking.customerId),
    {
      id: kalsubaiBooking.customerId,
      name: "Sneha More",
      phone: kalsubaiBooking.contactNumber,
      email: kalsubaiBooking.email,
      createdAt: departureCreatedAt,
      latestEnquiryStatus: "QUOTED",
      tags: ["Quoted"],
    },
    {
      id: kalsubaiBooking.enhancedBookingId,
      eventName: kalsubaiBooking.trekName,
      status: kalsubaiBooking.bookingStatus,
      travelDate: kalsubaiBooking.travelDate,
      createdAt: departureCreatedAt,
    }
  );

  const completedEnquiry = {
    id: "ENQ-DEMO-RAJGAD-001",
    name: "Devika Joshi",
    phone: rajgadBooking.contactNumber,
    email: rajgadBooking.email,
    eventName: rajgad.name,
    category: "Trek",
    pax: "2",
    date: rajgadDate,
    createdAt: isoAt(formatDate(-14), 10, 0),
    viewedAt: isoAt(formatDate(-14), 10, 20),
    firstResponseAt: isoAt(formatDate(-14), 10, 35),
    convertedAt: completedCreatedAt,
    status: "CONVERTED",
    tags: ["High Intent"],
    pageUrl: "/treks",
    pageKey: "/treks",
    location: rajgad.location || "Pune",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: actor,
    assignedSalesUsername: actorUsername,
    bookedEventName: rajgad.name,
    bookedBookingId: rajgadBooking.enhancedBookingId,
    customerId: rajgadBooking.customerId,
  };

  const rajmachiEnquiry = {
    id: "ENQ-DEMO-RAJMACHI-001",
    name: "Aarya Kulkarni",
    phone: rajmachiBooking.contactNumber,
    email: rajmachiBooking.email,
    eventName: rajmachi.name,
    category: "Trek",
    pax: "1",
    date: rajmachiDate,
    createdAt: isoAt(formatDate(-1), 9, 30),
    viewedAt: isoAt(formatDate(-1), 9, 45),
    firstResponseAt: isoAt(formatDate(-1), 10, 5),
    convertedAt: "",
    status: "CONTACTED",
    tags: ["High Intent"],
    pageUrl: `/treks/${rajmachi.id || ""}`,
    pageKey: `/treks/${rajmachi.id || ""}`,
    location: rajmachi.location || "Lonavala",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: actor,
    assignedSalesUsername: actorUsername,
    bookedEventName: rajmachi.name,
    bookedBookingId: rajmachiBooking.enhancedBookingId,
    customerId: rajmachiBooking.customerId,
  };

  const kalsubaiEnquiry = {
    id: "ENQ-DEMO-KALSUBAI-001",
    name: "Sneha More",
    phone: kalsubaiBooking.contactNumber,
    email: kalsubaiBooking.email,
    eventName: kalsubai.name,
    category: "Trek",
    pax: "2",
    date: kalsubaiDate,
    createdAt: isoAt(formatDate(-6), 13, 0),
    viewedAt: isoAt(formatDate(-6), 13, 12),
    firstResponseAt: isoAt(formatDate(-6), 13, 40),
    convertedAt: "",
    status: "QUOTED",
    tags: ["Quoted"],
    pageUrl: `/treks/${kalsubai.id || ""}`,
    pageKey: `/treks/${kalsubai.id || ""}`,
    location: kalsubai.location || "Ahmednagar",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: actor,
    assignedSalesUsername: actorUsername,
    bookedEventName: "",
    bookedBookingId: "",
    customerId: kalsubaiBooking.customerId,
  };

  const pawnaEnquiry = {
    id: "ENQ-DEMO-PAWNA-001",
    name: "Rahul Pandey",
    phone: "9833001003",
    email: "rahul.pandey@gmail.com",
    eventName: "Pawna Lake Camping",
    category: "Camping",
    pax: "4",
    date: "Flexible",
    createdAt: isoAt(formatDate(-1), 16, 10),
    viewedAt: isoAt(formatDate(-1), 16, 20),
    firstResponseAt: isoAt(formatDate(-1), 16, 35),
    convertedAt: "",
    status: "CONTACTED",
    tags: ["Camping Lead", "High Intent"],
    pageUrl: "/camping",
    pageKey: "/camping",
    location: "Pune",
    assignedSalesEmployeeId: "EMP-ADMIN-PRATIK",
    assignedSalesName: actor,
    assignedSalesUsername: actorUsername,
    bookedEventName: "",
    bookedBookingId: "",
    customerId: "",
  };

  const paidIncentive = {
    incentiveId: "INC-DEMO-RAJGAD-001",
    employeeId: leaderMap.rahul.employeeId,
    employeeName: leaderMap.rahul.fullName,
    referralCode: leaderMap.rahul.referralCode,
    bookingId: rajmachiBooking.bookingId,
    trekName: rajmachi.name,
    customerName: "Aarya Kulkarni",
    trekDate: rajmachiDate,
    amount: 100,
    status: "PAID",
    paidAt: completedCreatedAt,
    paidVia: "UPI",
    paidRef: "UPI-DEMO-INCENTIVE",
    createdAt: completedCreatedAt,
  };

  const pendingIncentive = {
    incentiveId: "INC-DEMO-KALSUBAI-001",
    employeeId: leaderMap.priya.employeeId,
    employeeName: leaderMap.priya.fullName,
    referralCode: leaderMap.priya.referralCode,
    bookingId: kalsubaiBooking.bookingId,
    trekName: kalsubai.name,
    customerName: "Sneha More",
    trekDate: kalsubaiDate,
    amount: 100,
    status: "PENDING",
    paidAt: "",
    paidVia: "",
    paidRef: "",
    createdAt: departureCreatedAt,
  };

  const completedTransaction = {
    transactionId: "TXN-DEMO-RAJGAD-001",
    bookingId: rajgadBooking.bookingId,
    customerId: rajgadBooking.customerId,
    customerName: "Devika Joshi",
    transactionStatus: "SUCCESS",
    paymentMode: "UPI",
    tax: 124,
    netAmount: 2474,
    grossAmount: 2598,
    createdAt: completedCreatedAt,
    dateTime: completedCreatedAt,
  };

  const kalsubaiTransaction = {
    transactionId: "TXN-DEMO-KALSUBAI-001",
    bookingId: kalsubaiBooking.bookingId,
    customerId: kalsubaiBooking.customerId,
    customerName: "Sneha More",
    transactionStatus: "SUCCESS",
    paymentMode: "UPI",
    tax: 109,
    netAmount: 2189,
    grossAmount: 2298,
    createdAt: departureCreatedAt,
    dateTime: departureCreatedAt,
  };

  const rajmachiTransaction = {
    transactionId: "TXN-DEMO-RAJMACHI-001",
    bookingId: rajmachiBooking.bookingId,
    customerId: rajmachiBooking.customerId,
    customerName: "Aarya Kulkarni",
    transactionStatus: "SUCCESS",
    paymentMode: "Partial",
    tax: 55,
    netAmount: 645,
    grossAmount: 700,
    createdAt: bookingCreatedAt,
    dateTime: bookingCreatedAt,
  };

  const demoLogs = [
    {
      logId: "LOG-DEMO-001",
      timestamp: isoAt(formatDate(-14), 10, 10),
      username: actorUsername,
      userName: actor,
      userRole: "Management",
      action: "ENQUIRY_ASSIGNED",
      actionLabel: "Assigned Rajgad enquiry to sales pipeline",
      details: "Devika Joshi's Rajgad enquiry was handled by Pratik Ubhe and prepared for conversion.",
      module: "Enquiries",
      severity: "info",
    },
    {
      logId: "LOG-DEMO-002",
      timestamp: bookingCreatedAt,
      username: actorUsername,
      userName: actor,
      userRole: "Management",
      action: "TREK_ASSIGNED",
      actionLabel: `Assigned ${rajmachi.name} batch to Rahul Patil`,
      details: `Upcoming ${rajmachi.name} batch was assigned to Rahul Patil with food and transport vendors.`,
      module: "Trek Events",
      severity: "info",
    },
    {
      logId: "LOG-DEMO-006",
      timestamp: departureCreatedAt,
      username: actorUsername,
      userName: actor,
      userRole: "Management",
      action: "TREK_ASSIGNED",
      actionLabel: `Assigned ${kalsubai.name} batch to Priya Deshmukh`,
      details: `${kalsubai.name} was moved to departure stage with leader fee settled and vendor payments pending.`,
      module: "Trek Events",
      severity: "info",
    },
    {
      logId: "LOG-DEMO-004",
      timestamp: completedCreatedAt,
      username: actorUsername,
      userName: actor,
      userRole: "Management",
      action: "TREK_SETTLED",
      actionLabel: `Settled ${rajgad.name} payments for Amit Shinde`,
      details: "Leader and vendor payouts were completed after trek closure.",
      module: "Payments",
      severity: "success",
    },
    {
      logId: "LOG-DEMO-005",
      timestamp: isoAt(formatDate(-1), 16, 40),
      username: actorUsername,
      userName: actor,
      userRole: "Sales",
      action: "ENQUIRY_CONTACTED",
      actionLabel: "Contacted Rahul Pandey for Pawna Lake Camping",
      details: "Sent WhatsApp follow-up and offered a quick call for Pawna Lake Camping enquiry.",
      module: "Enquiries",
      severity: "info",
    },
    {
      logId: "LOG-DEMO-003",
      timestamp: bookingCreatedAt,
      username: leaderMap.rahul.username,
      userName: leaderMap.rahul.fullName,
      userRole: "Trek Leader",
      action: "PAYMENT_COLLECTED",
      actionLabel: "Collected Rajmachi participant balance",
      details: "Rahul collected partial dues from referral participant Aarya Kulkarni.",
      module: "Operations",
      severity: "success",
    },
  ];

  let nextPayments = trekPayments;
  [rajmachiPayment, kalsubaiPayment, rajgadPayment].forEach((entry) => {
    nextPayments = upsertBy(nextPayments, entry, "paymentId");
  });
  writeJson("gt_trek_payments", nextPayments);

  let nextEvents = trekEvents;
  [
    { eventId: `EVT-${rajmachiPaymentId}`, trekName: rajmachi.name, trekDate: rajmachiDate, currentStage: "BOOKING_OPEN", stageHistory: rajmachiPayment.lifecycle.stageHistory, tasks: rajmachiPayment.lifecycle.tasks, notes: rajmachiPayment.lifecycle.notes, createdAt: bookingCreatedAt, createdBy: actor, _linkedPaymentId: rajmachiPaymentId },
    { eventId: `EVT-${kalsubaiPaymentId}`, trekName: kalsubai.name, trekDate: kalsubaiDate, currentStage: "DEPARTURE", stageHistory: kalsubaiPayment.lifecycle.stageHistory, tasks: kalsubaiPayment.lifecycle.tasks, notes: kalsubaiPayment.lifecycle.notes, createdAt: departureCreatedAt, createdBy: actor, _linkedPaymentId: kalsubaiPaymentId },
    { eventId: `EVT-${rajgadPaymentId}`, trekName: rajgad.name, trekDate: rajgadDate, currentStage: "PAYMENTS_SETTLED", stageHistory: rajgadPayment.lifecycle.stageHistory, tasks: rajgadPayment.lifecycle.tasks, notes: rajgadPayment.lifecycle.notes, createdAt: completedCreatedAt, createdBy: actor, _linkedPaymentId: rajgadPaymentId },
  ].forEach((entry) => {
    nextEvents = upsertBy(nextEvents, entry, "eventId");
  });
  writeJson("gt_trek_events", nextEvents);

  let nextBookings = bookings;
  [rajmachiBooking, kalsubaiBooking, rajgadBooking].forEach((entry) => {
    nextBookings = upsertBy(nextBookings, entry, "bookingId");
  });
  writeJson("gt_bookings", nextBookings);

  let nextCustomers = customers;
  [completedCustomer, rajmachiCustomer, kalsubaiCustomer].forEach((entry) => {
    nextCustomers = upsertBy(nextCustomers, entry, "id");
  });
  writeJson("gt_customers", nextCustomers);

  let nextEnquiries = enquiries;
  [completedEnquiry, rajmachiEnquiry, kalsubaiEnquiry, pawnaEnquiry].forEach((entry) => {
    nextEnquiries = upsertBy(nextEnquiries, entry, "id");
  });
  writeJson("gt_enquiries", nextEnquiries);

  let nextIncentives = incentives;
  [paidIncentive, pendingIncentive].forEach((entry) => {
    nextIncentives = upsertBy(nextIncentives, entry, "incentiveId");
  });
  writeJson("gt_incentives", nextIncentives);

  let nextTransactions = transactions;
  [completedTransaction, kalsubaiTransaction, rajmachiTransaction].forEach((entry) => {
    nextTransactions = upsertBy(nextTransactions, entry, "transactionId");
  });
  writeJson("gt_transactions", nextTransactions);

  let nextLogs = logs;
  demoLogs.forEach((entry) => {
    nextLogs = upsertBy(nextLogs, entry, "logId");
  });
  writeJson("gt_activity_logs", nextLogs);

  return {
    seeded: true,
    assignedTreks: [
      { paymentId: rajmachiPaymentId, trekName: rajmachi.name, eventDate: rajmachiDate, leader: leaderMap.rahul.fullName, stage: "BOOKING_OPEN" },
      { paymentId: kalsubaiPaymentId, trekName: kalsubai.name, eventDate: kalsubaiDate, leader: leaderMap.priya.fullName, stage: "DEPARTURE" },
      { paymentId: rajgadPaymentId, trekName: rajgad.name, eventDate: rajgadDate, leader: leaderMap.amit.fullName, stage: "PAYMENTS_SETTLED" },
    ],
    enquiriesSeeded: [
      { id: pawnaEnquiry.id, eventName: pawnaEnquiry.eventName, status: pawnaEnquiry.status },
      { id: kalsubaiEnquiry.id, eventName: kalsubaiEnquiry.eventName, status: kalsubaiEnquiry.status },
      { id: completedEnquiry.id, eventName: completedEnquiry.eventName, status: completedEnquiry.status },
    ],
  };
}

export function registerEmployeeJourneyDemoSeed() {
  if (typeof window === "undefined" || window[DEMO_FLAG]) return;
  window[DEMO_FLAG] = true;
  window.__seedEmployeeJourneyDemo = seedEmployeeJourneyDemo;

  const params = new URLSearchParams(window.location.search);
  if (params.get("seedEmployeeJourney") === "1") {
    const result = seedEmployeeJourneyDemo();
    console.info("Employee journey demo seed:", result);
  }
}
