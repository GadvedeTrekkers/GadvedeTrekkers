import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { findTrekBySlug, slugifyTrekName } from "../../data/treks";
import { findOrCreateCustomer, upsertCustomerActivity } from "../../data/customerStorage";
import { generateBookingId, saveBookingRecord } from "../../data/bookingStorage";
import { createTransaction } from "../../data/transactionStorage";
import { createIncentive } from "../../data/incentiveStorage";
import { getAllCredentials } from "../../data/employeePortalStorage";
import { getTrekDates, getWhatsAppLinkForDate } from "../../data/trekDatesStorage";
import { getBookingFormConfig } from "../../data/bookingFormStorage";
import { syncEnquiriesWithBookings } from "../../data/enquiryStorage";
import { createAlert, recordEmailAlertAttempt } from "../../data/notificationStorage";
import InfoTooltip from "../../components/InfoTooltip";
import { getEventDepartureConfig } from "../../utils/eventDepartureConfig";

const paymentOptions = [
  "Debit Card / Credit Card",
  "UPI",
  "Net Banking",
  "Partial Payment",
];

const departureOptions = ["Pune", "Mumbai", "Kasara", "Base Village"];

const pickupOptions = {
  Pune: [
    "McDonald's, Deccan",
    "New Shivaji Nagar (Mari Aai Gate / Wakadewadi)",
    "Nashik Phata (Kasarwadi Police Station)",
    "Wakad Bridge / Rajyog Hotel",
    "Hinjewadi Chowk",
    "Pirangut Chowk (Hinjewadi Phase 3)",
    "Inorbit Mall, Viman Nagar",
    "Chandni Chowk",
  ],
  Mumbai: [
    "CSMT",
    "Byculla",
    "Dadar",
    "Kurla",
    "Ghatkopar",
    "Thane",
    "Dombivali",
    "Kalyan",
    "Borivali National Park Gate",
    "Virwani Bus Stop, Goregaon",
    "Gundavali Bus Stop, Andheri East",
    "Kalanagar Bus Stop, Bandra",
    "Everard Nagar Bus Stop, Sion",
    "Diamond Garden, Chembur",
    "Vashi Plaza",
    "McDonald's, Kalamboli",
  ],
  Kasara: [
    "Kasara Railway Station (Ticket Counter)",
    "Kasara Bus Stop",
  ],
  "Base Village": [
    "Direct At Base Village",
    "Nirgudpada Village",
    "Bhira Base Village",
    "Kotamwadi Junction",
  ],
};

const departureSurcharges = {
  Pune: 300,
  Mumbai: 400,
  Kasara: 150,
  "Base Village": 0,
};

const buildTraveler = (departureList, pickupMap) => {
  const defaultDeparture = departureList[0] || "Base Village";
  return {
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    departureOrigin: defaultDeparture,
    pickupLocation:
      pickupMap[defaultDeparture]?.[0] ||
      pickupMap["Base Village"]?.[0] ||
      "Direct At Base Village",
  };
};

function parseLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadFile(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const queryTrek = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const trekName = params.get("trekName");
    const trekId = params.get("trekId");

    if (trekName) {
      return findTrekBySlug(slugifyTrekName(trekName));
    }

    if (trekId) {
      return findTrekBySlug(trekId);
    }

    return null;
  }, [location.search]);
  const selectedTrek =
    location.state?.trek ??
    (location.state?.trekSlug ? findTrekBySlug(location.state.trekSlug) : null) ??
    queryTrek;
  const bookingForm = useMemo(() => getBookingFormConfig(), []);
  const bookingPaymentOptions = useMemo(
    () => parseLines(bookingForm.paymentOptions).length ? parseLines(bookingForm.paymentOptions) : paymentOptions,
    [bookingForm.paymentOptions]
  );
  const bookingDepartureOptions = useMemo(
    () => parseLines(bookingForm.departureOptions).length ? parseLines(bookingForm.departureOptions) : departureOptions,
    [bookingForm.departureOptions]
  );
  const bookingPickupOptions = useMemo(() => {
    try {
      const parsed = JSON.parse(bookingForm.pickupOptions || "{}");
      return Object.keys(parsed).length ? parsed : pickupOptions;
    } catch {
      return pickupOptions;
    }
  }, [bookingForm.pickupOptions]);
  const trekDepartureConfig = useMemo(
    () =>
      getEventDepartureConfig({
        category: "Trek",
        eventName: selectedTrek?.name,
        fallbackDepartureOptions: bookingDepartureOptions,
        fallbackPickupMap: bookingPickupOptions,
      }),
    [bookingDepartureOptions, bookingPickupOptions, selectedTrek?.name]
  );
  const activeDepartureOptions = trekDepartureConfig.departureOptions.length
    ? trekDepartureConfig.departureOptions
    : bookingDepartureOptions;
  const activePickupOptions = trekDepartureConfig.pickupMap;

  /* ── Capture referral code from URL ?ref= param ── */
  const urlRefCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("ref") || "";
  }, [location.search]);

  /* ── Manual referral code input state ── */
  const [manualRefCode, setManualRefCode] = useState(urlRefCode);
  const [refStatus, setRefStatus] = useState(
    urlRefCode
      ? (() => {
          const creds = getAllCredentials();
          const emp = creds.find(c => c.referralCode === urlRefCode && c.onboardingStatus === "APPROVED");
          return emp ? { valid: true, name: emp.fullName } : { valid: false, name: "" };
        })()
      : { valid: null, name: "" }
  );

  const handleRefCodeChange = (e) => {
    const val = e.target.value.toUpperCase().trim();
    setManualRefCode(val);
    if (!val) { setRefStatus({ valid: null, name: "" }); return; }
    const creds = getAllCredentials();
    const emp = creds.find(c => c.referralCode === val && c.onboardingStatus === "APPROVED");
    setRefStatus(emp ? { valid: true, name: emp.fullName } : { valid: false, name: "" });
  };

  /* Final effective referral code */
  const refCode = manualRefCode && refStatus.valid ? manualRefCode : urlRefCode;

  /* ── Load available dates from admin for this trek (future only) ── */
  const trekSlug = selectedTrek ? slugifyTrekName(selectedTrek.name) : "";
  const availableDates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return getTrekDates(trekSlug).filter((d) => d.date >= today);
  }, [trekSlug]);

  /* ── When a date is picked, auto-populate the WhatsApp group link ── */
  const handleDateSelect = (date) => {
    const link = getWhatsAppLinkForDate(trekSlug, date);
    setFormData(prev => ({ ...prev, travelDate: date, whatsappGroupLink: link }));
  };

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent, setConsent] = useState({
    rulesAccepted: false,
    fitnessAccepted: false,
    cancellationAccepted: false,
  });
  const [formData, setFormData] = useState({
    tickets: 1,
    departureOrigin: activeDepartureOptions[0] || "Base Village",
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    sameWhatsapp: false,
    whatsappNumber: "",
    travelDate: "",
    whatsappGroupLink: "",
    pickupLocation:
      activePickupOptions[activeDepartureOptions[0] || "Base Village"]?.[0] ||
      bookingPickupOptions["Base Village"]?.[0] ||
      pickupOptions["Base Village"][0],
    emergencyContact: "",
    paymentOption: bookingPaymentOptions[0] || paymentOptions[0],
  });
  const [additionalTravelers, setAdditionalTravelers] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const nextDeparture =
      activeDepartureOptions.includes(formData.departureOrigin)
        ? formData.departureOrigin
        : activeDepartureOptions[0] || "Base Village";
    const nextPickup =
      activePickupOptions[nextDeparture]?.includes(formData.pickupLocation)
        ? formData.pickupLocation
        : activePickupOptions[nextDeparture]?.[0] || "";

    if (
      nextDeparture !== formData.departureOrigin ||
      nextPickup !== formData.pickupLocation
    ) {
      setFormData((current) => ({
        ...current,
        departureOrigin: nextDeparture,
        pickupLocation: nextPickup,
      }));
    }
  }, [
    activeDepartureOptions,
    activePickupOptions,
    formData.departureOrigin,
    formData.pickupLocation,
  ]);

  useEffect(() => {
    const extraTravelerCount = Math.max(0, Number(formData.tickets) - 1);

    setAdditionalTravelers((current) => {
      if (current.length === extraTravelerCount) {
        return current;
      }

      if (current.length < extraTravelerCount) {
        return [
          ...current,
          ...Array.from(
            { length: extraTravelerCount - current.length },
            () => buildTraveler(activeDepartureOptions, activePickupOptions)
          ),
        ];
      }

      return current.slice(0, extraTravelerCount);
    });
  }, [activePickupOptions, formData.tickets]);

  useEffect(() => {
    if (!availableDates.length) {
      return;
    }

    const hasSelectedDate = availableDates.some((dateOption) => dateOption.date === formData.travelDate);
    if (hasSelectedDate) {
      return;
    }

    handleDateSelect(availableDates[0].date);
  }, [availableDates, formData.travelDate, trekSlug]);

  useEffect(() => {
    setAdditionalTravelers((current) =>
      current.map((traveler) => {
        const nextDeparture = activeDepartureOptions.includes(traveler.departureOrigin)
          ? traveler.departureOrigin
          : activeDepartureOptions[0] || "Base Village";
        const nextPickup = activePickupOptions[nextDeparture]?.includes(traveler.pickupLocation)
          ? traveler.pickupLocation
          : activePickupOptions[nextDeparture]?.[0] || "";

        if (
          nextDeparture === traveler.departureOrigin &&
          nextPickup === traveler.pickupLocation
        ) {
          return traveler;
        }

        return {
          ...traveler,
          departureOrigin: nextDeparture,
          pickupLocation: nextPickup,
        };
      })
    );
  }, [activeDepartureOptions, activePickupOptions]);

  const ticketCount = Number(formData.tickets) || 1;
  const travelerPricing = [
    {
      departureOrigin: formData.departureOrigin,
      amount:
        (selectedTrek?.price ?? 0) + (departureSurcharges[formData.departureOrigin] ?? 0),
    },
    ...additionalTravelers.map((traveler) => ({
      departureOrigin: traveler.departureOrigin,
      amount:
        (selectedTrek?.price ?? 0) + (departureSurcharges[traveler.departureOrigin] ?? 0),
    })),
  ];

  const baseAmount = travelerPricing.reduce((sum, traveler) => sum + traveler.amount, 0);
  const partialAmount = 200 * ticketCount;
  const taxAmount = Math.round(baseAmount * 0.05);
  const totalAmount = baseAmount + taxAmount;
  const payableNow =
    formData.paymentOption === "Partial Payment" ? partialAmount + taxAmount : totalAmount;
  const remainingAmount =
    formData.paymentOption === "Partial Payment" ? totalAmount - payableNow : 0;

  const allConsentsAccepted = useMemo(
    () => Object.values(consent).every(Boolean),
    [consent]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "travelDate") {
      handleDateSelect(value);
      return;
    }
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "departureOrigin"
        ? { pickupLocation: activePickupOptions[value]?.[0] || "" }
        : {}),
      ...(name === "sameWhatsapp" && checked ? { whatsappNumber: "" } : {}),
    }));
  };

  const handleTravelerChange = (index, field, value) => {
    setAdditionalTravelers((current) =>
      current.map((traveler, travelerIndex) =>
        travelerIndex === index
          ? {
              ...traveler,
              [field]: value,
              ...(field === "departureOrigin"
                ? { pickupLocation: activePickupOptions[value]?.[0] || "" }
                : {}),
            }
          : traveler
      )
    );
  };

  const handleConsentChange = (event) => {
    const { name, checked } = event.target;
    setConsent((current) => ({
      ...current,
      [name]: checked,
    }));
  };

  const openConsentModal = () => {
    if (!formRef.current?.reportValidity()) {
      return;
    }
    setShowConsentModal(true);
  };

  const closeConsentModal = () => {
    setShowConsentModal(false);
  };

  const downloadItinerary = () => {
    if (!selectedTrek) {
      return;
    }

    if (selectedTrek.name === "Kalsubai Trek") {
      downloadFile(
        "/itineraries/kalsubai-trek-gadvede.pdf",
        "gadvede-kalsubai-trek-itinerary.pdf"
      );
      return;
    }

    const itinerary = [
      "Gadvede Trekkers Itinerary",
      "-------------------------",
      `Trek: ${selectedTrek.name}`,
      `Location: ${selectedTrek.location}`,
      `Duration: ${selectedTrek.duration}`,
      `Altitude: ${selectedTrek.altitude}`,
      `Next Batch Date: ${selectedTrek.nextDate}`,
      `Starting Price: INR ${selectedTrek.price}`,
      "",
      "Payment Note:",
      "- 5% tax applicable on every booking",
      "- For partial payment, INR 200 per seat is collected now",
      "- Remaining amount can be paid one day before the trek",
    ].join("\n");

    downloadTextFile(`${slugifyTrekName(selectedTrek.name)}-itinerary.txt`, itinerary);
  };

  const handleSubmit = () => {
    if (!selectedTrek || !allConsentsAccepted) {
      return;
    }

    const bookingId = `GTK-${Date.now().toString().slice(-8)}`;
    const initialPricePaid =
      formData.paymentOption === "Partial Payment" ? payableNow : totalAmount;
    const initialPaymentStatus =
      initialPricePaid >= totalAmount
        ? "PAID"
        : initialPricePaid > 0
        ? "PARTIAL"
        : "PENDING";
    const bookingRecord = {
      bookingId,
      trekName: selectedTrek.name,
      eventName: selectedTrek.name,
      trekLocation: selectedTrek.location,
      trekSlug: slugifyTrekName(selectedTrek.name),
      tickets: ticketCount,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      departureOrigin: formData.departureOrigin,
      contactNumber: formData.contactNumber,
      whatsappNumber: formData.sameWhatsapp ? formData.contactNumber : formData.whatsappNumber,
      travelDate: formData.travelDate,
      whatsappGroupLink: formData.whatsappGroupLink,
      pickupLocation: formData.pickupLocation,
      emergencyContact: formData.emergencyContact,
      paymentOption: formData.paymentOption,
      baseAmount,
      taxAmount,
      totalPrice: totalAmount,
      totalAmount,
      pricePaid: initialPricePaid,
      payableNow,
      remainingAmount,
      paymentStatus: initialPaymentStatus,
      leaderCollected: 0,
      bookingDate: new Date().toLocaleString("en-IN"),
      nextDate: selectedTrek.nextDate,
      additionalTravelers,
      travelerPricing,
      consent,
      referralCode: refCode || "",
      bookingStatus: "CONFIRMED",
      status: "CONFIRMED",
    };

    localStorage.setItem("latestBooking", JSON.stringify(bookingRecord));

    /* ── Additive: persist customer + booking + transaction ── */
    const _paymentModeMap = {
      "Debit Card / Credit Card": "CARD",
      "UPI": "UPI",
      "Net Banking": "NET BANK",
      "Partial Payment": "Partial",
    };
    const _customer = findOrCreateCustomer({
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.contactNumber,
      email: formData.email,
    });
    const _enhancedId = generateBookingId();
    saveBookingRecord({ ...bookingRecord, enhancedBookingId: _enhancedId, customerId: _customer.id, referralCode: refCode || "" });
    upsertCustomerActivity({
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.contactNumber,
      email: formData.email,
      booking: {
        ...bookingRecord,
        bookingId,
        enhancedBookingId: _enhancedId,
        customerId: _customer.id,
      },
    });
    syncEnquiriesWithBookings();
    createTransaction({
      bookingId:         bookingId,
      customerId:        _customer.id,
      customerName:      _customer.name,
      paymentMode:       _paymentModeMap[formData.paymentOption] || "UPI",
      grossAmount:       payableNow,
      tax:               taxAmount,
      netAmount:         baseAmount,
      transactionStatus: "SUCCESS",
    });

    createAlert({
      type: "BOOKING",
      title: "New Ticket Sold",
      message: `${formData.firstName} ${formData.lastName} booked ${selectedTrek.name}`,
      meta: {
        bookingId,
        customerId: _customer.id,
        eventName: selectedTrek.name,
        payableNow,
      },
    });

    recordEmailAlertAttempt({
      kind: "Booking",
      bookingId,
      customerName: `${formData.firstName} ${formData.lastName}`,
      eventName: selectedTrek.name,
      amount: payableNow,
    });

    /* ── Referral incentive — ₹100 to employee if ?ref= was present ── */
    if (refCode) {
      const creds = getAllCredentials();
      const empCred = creds.find(c => c.referralCode === refCode && c.onboardingStatus === "APPROVED");
      if (empCred) {
        createIncentive({
          employeeId:   empCred.employeeId,
          employeeName: empCred.fullName,
          referralCode: refCode,
          bookingId,
          trekName:     selectedTrek?.name || "",
          customerName: `${formData.firstName} ${formData.lastName}`,
          trekDate:     selectedTrek?.nextDate || "",
        });
      }
    }
    /* ── end additive block ── */

    navigate("/booking/success", {
      state: {
        booking: bookingRecord,
      },
    });
  };

  if (!selectedTrek) {
    return (
      <section className="booking-page">
        <div className="container py-5">
          <div className="booking-success-card text-center">
            <h1>Select A Trek First</h1>
            <p>Please choose a trek from the trek listing before continuing to booking.</p>
            <Link to="/treks" className="btn booking-primary-btn">
              Back to Treks
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page">
      <div className="container py-4 py-md-5">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "none", border: "none", color: "#0a6a47",
            fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
            marginBottom: 10, padding: "4px 0",
          }}
        >
          ← Back
        </button>
        <div className="booking-hero">
          <div>
            <span className="booking-kicker">{bookingForm.heroKicker}</span>
            <h1>{bookingForm.heroTitle}</h1>
            <p>
              {bookingForm.heroSubtitle}
            </p>
          </div>

          <div className="booking-hero-card">
            <div className="booking-hero-label">Selected Destination</div>
            <h2>{selectedTrek.name}</h2>
            <p>{selectedTrek.location}</p>
          </div>
        </div>

        <form ref={formRef} className="booking-layout">
          <div className="booking-form-card">
            <div className="booking-section-heading">
              <h2>{bookingForm.leadSectionTitle}</h2>
              <p>{bookingForm.leadSectionSubtitle}</p>
            </div>

            <div className="booking-grid">
              <label className="booking-field booking-field-full">
                <span>Destination Trek</span>
                <input type="text" value={selectedTrek.name} readOnly />
              </label>

              <div className="booking-field booking-field-full">
                <span>
                  Joining Destination
                  <InfoTooltip text="Choose where the traveler will join from. Fare and pickup options update based on this selection." />
                </span>
                <div className="booking-radio-grid">
                  {activeDepartureOptions.length === 1 ? (
                    <label className="booking-field booking-field-full">
                      <input type="text" value={activeDepartureOptions[0]} readOnly />
                    </label>
                  ) : (
                    activeDepartureOptions.map((option) => (
                      <label className="booking-option-card" key={option}>
                        <input
                          type="radio"
                          name="departureOrigin"
                          value={option}
                          checked={formData.departureOrigin === option}
                          onChange={handleChange}
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <label className="booking-field">
                <span>
                  Number of Tickets
                  <InfoTooltip text="Each extra ticket opens another traveler section so you can capture everyone’s details in the same booking." />
                </span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  name="tickets"
                  value={formData.tickets}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* ── Travel Date ── */}
              {availableDates.length > 0 ? (
                <label className="booking-field booking-field-full">
                  <span>
                    Travel Date
                    <InfoTooltip text="Choose one of the configured batch dates. The matching WhatsApp group link is auto-mapped for that batch." />
                  </span>
                  <select
                    name="travelDate"
                    value={formData.travelDate}
                    onChange={handleChange}
                    required
                    style={{ fontSize: "1rem" }}
                  >
                    <option value="" disabled>
                      Select travel date
                    </option>
                    {availableDates.map((d) => {
                      const displayDate = new Date(d.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <option value={d.date} key={d.id}>
                          {displayDate}
                          {d.label ? ` - ${d.label}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ) : (
                /* No admin-configured batch dates for this trek.
                   Show a clear message instead of a free-form calendar so
                   users cannot book invalid / unavailable dates. */
                <div className="booking-field booking-field-full">
                  <span>Travel Date</span>
                  <div style={{
                    padding: "16px 18px",
                    background: "#fefce8",
                    border: "1.5px solid #fde68a",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9rem" }}>
                      📅 No scheduled batches for this trek yet
                    </div>
                    <div style={{ color: "#78350f", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      Available dates haven't been published for this trek.
                      Contact us on WhatsApp and we'll confirm your preferred date.
                    </div>
                    <a
                      href={`https://wa.me/918605866155?text=${encodeURIComponent(`Hi! I want to book the ${selectedTrek?.name || "trek"} — can you share available dates?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#25d366", color: "#fff",
                        borderRadius: 10, padding: "9px 18px",
                        fontWeight: 700, fontSize: "0.88rem",
                        textDecoration: "none", alignSelf: "flex-start",
                      }}
                    >
                      💬 Ask on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              <label className="booking-field">
                <span>First Name</span>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="booking-field">
                <span>Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="booking-field booking-field-full">
                <span>Email Address</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="booking-field">
                <span>Contact Number</span>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="booking-field">
                <span>Emergency Contact Number</span>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  required
                />
              </label>

              {/* ── Referral Code (optional) ── */}
              <div className="booking-field booking-field-full">
                <span>
                  Referral Code <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 12 }}>(optional)</span>
                  <InfoTooltip text="Enter this only if the customer came from an employee referral. Valid codes auto-credit the employee incentive." />
                </span>
                <input
                  type="text"
                  placeholder="e.g. REF-RP001"
                  value={manualRefCode}
                  onChange={handleRefCodeChange}
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    border: refStatus.valid === true
                      ? "1.5px solid #16a34a"
                      : refStatus.valid === false
                      ? "1.5px solid #dc2626"
                      : undefined,
                  }}
                />
                {refStatus.valid === true && (
                  <span style={{ fontSize: 12, color: "#16a34a", marginTop: 4, display: "block" }}>
                    ✅ Valid code — referral credited to <strong>{refStatus.name}</strong>
                  </span>
                )}
                {refStatus.valid === false && manualRefCode && (
                  <span style={{ fontSize: 12, color: "#dc2626", marginTop: 4, display: "block" }}>
                    ❌ Invalid referral code. Please check and try again.
                  </span>
                )}
              </div>

              <label className="booking-field booking-field-full booking-checkbox">
                <input
                  type="checkbox"
                  name="sameWhatsapp"
                  checked={formData.sameWhatsapp}
                  onChange={handleChange}
                  required
                />
                <span>This contact number is available on WhatsApp</span>
              </label>

              {!formData.sameWhatsapp && (
                <label className="booking-field booking-field-full">
                  <span>WhatsApp Number</span>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    required={!formData.sameWhatsapp}
                  />
                </label>
              )}

              <label className="booking-field booking-field-full">
                <span>
                  Pickup Location
                  <InfoTooltip text="Only pickup points for the selected joining destination are shown here." />
                </span>
                <select
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                >
                  {(activePickupOptions[formData.departureOrigin] || []).map((pickup) => (
                    <option value={pickup} key={pickup}>
                      {pickup}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {additionalTravelers.length > 0 && (
              <div className="booking-extra-travelers">
                <div className="booking-section-heading">
                  <h2>Other Travelers</h2>
                  <p>For every extra ticket, add first name, last name, mobile number, email, joining destination, and pickup location.</p>
                </div>

                <div className="booking-traveler-stack">
                  {additionalTravelers.map((traveler, index) => (
                    <div className="booking-traveler-card" key={`traveler-${index}`}>
                      <div className="booking-traveler-title">
                        Traveler {index + 2}
                      </div>

                      <div className="booking-grid">
                        <div className="booking-field booking-field-full">
                          <span>Joining Destination</span>
                          <div className="booking-radio-grid">
                            {activeDepartureOptions.length === 1 ? (
                              <label className="booking-field booking-field-full">
                                <input type="text" value={activeDepartureOptions[0]} readOnly />
                              </label>
                            ) : (
                              activeDepartureOptions.map((option) => (
                                <label className="booking-option-card" key={`${option}-${index}`}>
                                  <input
                                    type="radio"
                                    name={`traveler-departure-${index}`}
                                    value={option}
                                    checked={traveler.departureOrigin === option}
                                    onChange={(event) =>
                                      handleTravelerChange(index, "departureOrigin", event.target.value)
                                    }
                                  />
                                  <span>{option}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>

                        <label className="booking-field">
                          <span>First Name</span>
                          <input
                            type="text"
                            value={traveler.firstName}
                            onChange={(event) =>
                              handleTravelerChange(index, "firstName", event.target.value)
                            }
                            required
                          />
                        </label>

                        <label className="booking-field">
                          <span>Last Name</span>
                          <input
                            type="text"
                            value={traveler.lastName}
                            onChange={(event) =>
                              handleTravelerChange(index, "lastName", event.target.value)
                            }
                            required
                          />
                        </label>

                        <label className="booking-field">
                          <span>Mobile Number</span>
                          <input
                            type="tel"
                            value={traveler.mobileNumber}
                            onChange={(event) =>
                              handleTravelerChange(index, "mobileNumber", event.target.value)
                            }
                            required
                          />
                        </label>

                        <label className="booking-field">
                          <span>Email Address</span>
                          <input
                            type="email"
                            value={traveler.email}
                            onChange={(event) =>
                              handleTravelerChange(index, "email", event.target.value)
                            }
                            required
                          />
                        </label>

                        <label className="booking-field booking-field-full">
                          <span>Pickup Location</span>
                          <select
                            value={traveler.pickupLocation}
                            onChange={(event) =>
                              handleTravelerChange(index, "pickupLocation", event.target.value)
                            }
                            required
                          >
                            {(activePickupOptions[traveler.departureOrigin] || []).map((pickup) => (
                              <option value={pickup} key={`${pickup}-${index}`}>
                                {pickup}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="booking-summary-card">
            <div className="booking-section-heading">
              <h2>{bookingForm.summaryTitle}</h2>
              <p>{bookingForm.summarySubtitle}</p>
            </div>

            <div className="booking-summary-block">
              <div className="booking-summary-row">
                <span>Trek</span>
                <strong>{selectedTrek.name}</strong>
              </div>
              <div className="booking-summary-row">
                <span>Tickets</span>
                <strong>{ticketCount}</strong>
              </div>
              <div className="booking-summary-row">
                <span>Traveler Total</span>
                <strong>₹{baseAmount}</strong>
              </div>
              <div className="booking-summary-row">
                <span>
                  Tax (5%)
                  <InfoTooltip text="Website bookings automatically include 5% tax on the base amount." />
                </span>
                <strong>₹{taxAmount}</strong>
              </div>
              <div className="booking-summary-row booking-summary-total">
                <span>Total</span>
                <strong>₹{totalAmount}</strong>
              </div>
            </div>

            <div className="booking-traveler-fares">
              <span className="booking-subtitle">Fare By Joining Point</span>
              {travelerPricing.map((traveler, index) => (
                <div className="booking-summary-row" key={`${traveler.departureOrigin}-${index}`}>
                  <span>
                    {index === 0 ? "Lead Traveler" : `Traveler ${index + 1}`} from {traveler.departureOrigin}
                  </span>
                  <strong>₹{traveler.amount}</strong>
                </div>
              ))}
            </div>

            <div className="booking-payment-options">
              <span className="booking-subtitle">
                Payment Option
                <InfoTooltip text="Full payment collects the entire amount now. Partial payment collects a smaller amount now and leaves the balance for later." />
              </span>
              {bookingPaymentOptions.map((option) => (
                <label className="booking-radio" key={option}>
                  <input
                    type="radio"
                    name="paymentOption"
                    value={option}
                    checked={formData.paymentOption === option}
                    onChange={handleChange}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {formData.paymentOption === "Partial Payment" && (
              <div className="booking-payment-note">
                Pay ₹200 per ticket now. Remaining ₹{remainingAmount} can be paid one day before the trek.
              </div>
            )}

            <div className="booking-payable-now">
              <span>Pay Now</span>
              <strong>₹{payableNow}</strong>
            </div>

            <div className="booking-summary-actions">
              <button
                type="button"
                className="btn booking-outline-btn"
                onClick={downloadItinerary}
              >
                Download Itinerary
              </button>

              <button
                type="button"
                className="btn booking-primary-btn"
                onClick={openConsentModal}
              >
                Complete Payment
              </button>
            </div>

            <p className="booking-email-note">
              {bookingForm.emailNote}
            </p>

            <Link to="/treks" className="booking-back-link">
              {bookingForm.backLinkLabel}
            </Link>
          </aside>
        </form>
      </div>

      {/* ── Sticky mobile CTA bar (hidden on desktop where sidebar is already sticky) ── */}
      <div className="booking-mobile-cta" aria-hidden="false">
        <div className="booking-mobile-cta-inner">
          <div className="booking-mobile-cta-amount">
            <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", lineHeight: 1.2 }}>Total payable</span>
            <strong style={{ fontSize: "1.15rem", color: "#0f172a" }}>₹{payableNow}</strong>
          </div>
          <button
            type="button"
            className="btn booking-primary-btn"
            onClick={openConsentModal}
            style={{ flex: 1, maxWidth: 200 }}
          >
            Complete Payment →
          </button>
        </div>
      </div>

      {showConsentModal && (
        <div className="booking-modal-backdrop" onClick={closeConsentModal}>
          <div
            className="booking-consent-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-section-heading">
              <h2>Mandatory Consent</h2>
              <p>You must accept all three points before the payment is completed.</p>
            </div>

            <div className="booking-consent-list">
              <label className="booking-checkbox booking-consent-item">
                <input
                  type="checkbox"
                  name="rulesAccepted"
                  checked={consent.rulesAccepted}
                  onChange={handleConsentChange}
                />
                <span>{bookingForm.consentRules}</span>
              </label>

              <label className="booking-checkbox booking-consent-item">
                <input
                  type="checkbox"
                  name="fitnessAccepted"
                  checked={consent.fitnessAccepted}
                  onChange={handleConsentChange}
                />
                <span>{bookingForm.consentFitness}</span>
              </label>

              <label className="booking-checkbox booking-consent-item">
                <input
                  type="checkbox"
                  name="cancellationAccepted"
                  checked={consent.cancellationAccepted}
                  onChange={handleConsentChange}
                />
                <span>{bookingForm.consentCancellation}</span>
              </label>
            </div>

            <div className="booking-summary-actions">
              <button
                type="button"
                className="btn booking-outline-btn"
                onClick={closeConsentModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn booking-primary-btn"
                disabled={!allConsentsAccepted}
                onClick={() => {
                  closeConsentModal();
                  handleSubmit();
                }}
              >
                Accept And Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Booking;
