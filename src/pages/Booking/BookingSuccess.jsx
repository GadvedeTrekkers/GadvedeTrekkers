import { Link, useLocation } from "react-router-dom";
import HistoricTicket from "../../components/HistoricTicket";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";

function BookingSuccess() {
  const location = useLocation();
  const storedBooking = localStorage.getItem("latestBooking");
  const booking =
    location.state?.booking ?? (storedBooking ? JSON.parse(storedBooking) : null);

  if (!booking) {
    return (
      <section className="booking-page">
        <div className="container py-5">
          <div className="booking-success-card text-center">
            <h1>No Booking Found</h1>
            <p>Your booking summary is not available right now.</p>
            <a href={buildBookingWhatsAppUrl({ name: "a Gadvede trek" })} target="_blank" rel="noopener noreferrer" className="btn booking-primary-btn">
              Book on WhatsApp
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page">
      <div className="container py-4 py-md-5">
        <div className="booking-success-card">
          <span className="booking-success-badge">
            Payment Successful
          </span>
          <h1>Congratulations, Your Trek Is Booked!</h1>
          <p>
            Your seat has been reserved successfully. You can review the booking details below and download your ticket right away.
          </p>

          <div className="booking-success-grid">
            <div className="booking-success-panel">
              <h2>Booking Details</h2>
              <div className="booking-success-row">
                <span>Booking ID</span>
                <strong>{booking.bookingId}</strong>
              </div>
              <div className="booking-success-row">
                <span>Destination Trek</span>
                <strong>{booking.trekName}</strong>
              </div>
              <div className="booking-success-row">
                <span>Trek Date</span>
                <strong>{booking.travelDate || booking.nextDate}</strong>
              </div>
              <div className="booking-success-row">
                <span>Tickets</span>
                <strong>{booking.tickets}</strong>
              </div>
              <div className="booking-success-row">
                <span>Joining From</span>
                <strong>{booking.departureOrigin}</strong>
              </div>
              <div className="booking-success-row">
                <span>Pickup Location</span>
                <strong>{booking.pickupLocation}</strong>
              </div>
              <div className="booking-success-row">
                <span>Payment Option</span>
                <strong>{booking.paymentOption}</strong>
              </div>
              <div className="booking-success-row">
                <span>Amount Paid</span>
                <strong>₹{booking.payableNow}</strong>
              </div>
            </div>

            <div className="booking-success-panel">
              <h2>Traveler</h2>
              <div className="booking-success-row">
                <span>Name</span>
                <strong>{booking.firstName} {booking.lastName}</strong>
              </div>
              <div className="booking-success-row">
                <span>Email</span>
                <strong>{booking.email}</strong>
              </div>
              <div className="booking-success-row">
                <span>Contact</span>
                <strong>{booking.contactNumber}</strong>
              </div>
              <div className="booking-success-row">
                <span>WhatsApp</span>
                <strong>{booking.whatsappNumber}</strong>
              </div>
              <div className="booking-success-row">
                <span>Emergency Contact</span>
                <strong>{booking.emergencyContact}</strong>
              </div>
              <div className="booking-success-row">
                <span>Remaining Amount</span>
                <strong>₹{booking.remainingAmount}</strong>
              </div>
              {booking.whatsappGroupLink && (
                <div className="booking-success-row">
                  <span>WhatsApp Group</span>
                  <strong>Available</strong>
                </div>
              )}
            </div>
          </div>

          {/* ── Referral Code Applied Banner ── */}
          {booking.referralCode && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
              padding: "12px 18px", marginTop: 16, display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <div>
                <div style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>Referral Code Applied!</div>
                <div style={{ color: "#15803d", fontSize: 13 }}>
                  Code <strong>{booking.referralCode}</strong> was successfully applied to this booking.
                </div>
              </div>
            </div>
          )}

          {booking.additionalTravelers?.length > 0 && (
            <div className="booking-success-panel booking-success-extra">
              <h2>Additional Travelers</h2>
              {booking.additionalTravelers.map((traveler, index) => (
                <div className="booking-success-row" key={`traveler-${index}`}>
                  <span>Traveler {index + 2}</span>
                  <strong>
                    {traveler.firstName} {traveler.lastName} | {traveler.departureOrigin} | {traveler.pickupLocation}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <div className="booking-success-actions">
            <a
              href={`/ticket?bookingId=${encodeURIComponent(booking.enhancedBookingId || booking.bookingId)}`}
              className="btn booking-primary-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              🎟 View &amp; Download Ticket
            </a>
            <Link to="/treks" className="btn booking-outline-btn">
              Explore More Treks
            </Link>
          </div>

          {/* ── Confirmation notice ── */}
          <div className="booking-confirmation-notice">
            <div className="booking-confirmation-icon">✅</div>
            <div>
              <p className="booking-confirmation-heading">Booking Confirmed!</p>
              {booking.email ? (
                <p className="booking-confirmation-sub">
                  A confirmation email with your ticket has been sent to <strong>{booking.email}</strong>.
                  <br />
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    (Email delivery requires a backend mail service — ticket download available above.)
                  </span>
                </p>
              ) : (
                <p className="booking-confirmation-sub">
                  Your booking is confirmed. Download your ticket using the button above.
                </p>
              )}
            </div>
          </div>

          {/* ── WhatsApp Group Link ── */}
          {booking.whatsappGroupLink && (
            <div style={{
              background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              border: "1px solid #86efac",
              borderRadius: 12,
              padding: "18px 22px",
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 32 }}>📱</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, color: "#166534", fontSize: "1rem", marginBottom: 4 }}>Join Your Trek WhatsApp Group</div>
                <div style={{ fontSize: "0.85rem", color: "#15803d" }}>
                  Trek leader details, meetup point updates, and event info will be shared here. Join now to stay connected!
                </div>
              </div>
              <a href={booking.whatsappGroupLink} target="_blank" rel="noopener noreferrer"
                style={{ background: "#25d366", color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 800, fontSize: "0.95rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                💬 Join WhatsApp Group
              </a>
            </div>
          )}

          {/* ── What's Next ── */}
          <div className="booking-next-steps">
            <h3>What's Next?</h3>
            <div className="booking-steps-grid">
              <div className="booking-step">
                <span className="booking-step-num">1</span>
                <div>
                  <strong>Save your ticket</strong>
                  <p>Download and screenshot your booking confirmation.</p>
                </div>
              </div>
              <div className="booking-step">
                <span className="booking-step-num">2</span>
                <div>
                  <strong>Reach pickup on time</strong>
                  <p>Be at <strong>{booking.pickupLocation}</strong> 15 mins before departure.</p>
                </div>
              </div>
              <div className="booking-step">
                <span className="booking-step-num">3</span>
                <div>
                  <strong>Pack essentials</strong>
                  <p>Water, snacks, ID proof, warm clothes & trek shoes.</p>
                </div>
              </div>
              <div className="booking-step">
                <span className="booking-step-num">4</span>
                <div>
                  <strong>Share feedback</strong>
                  <p>After your trek, share your experience to help other adventurers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Historic Ticket ── */}
      <div className="container pb-5">
        <HistoricTicket booking={booking} />
      </div>
    </section>
  );
}

export default BookingSuccess;
