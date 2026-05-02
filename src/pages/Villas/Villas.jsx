import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminItems } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";

export const villasList = [
  {
    id: "marigold-villa",
    name: "The Marigold Villa",
    location: "Girivan, 412108 Pune",
    area: "Pune",
    rating: 8.5,
    ratingLabel: "Very good",
    reviews: 8,
    price: 5200,
    originalPrice: 7500,
    guests: "2 adults",
    size: "279 m²",
    bedrooms: 3,
    bathrooms: 4,
    badge: "Top Pick",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 9.6,
    description: "Featuring garden views, The Marigold Villa provides accommodation with a garden and a patio, around 42 km from University of Pune.",
    about: "Spacious Accommodation: The Marigold Villa in Pune offers a spacious villa with three bedrooms and four bathrooms. Family rooms provide ample space for relaxation and comfort. Outdoor Spaces: Guests can enjoy a beautiful garden and terrace with stunning mountain views. The terrace is perfect for outdoor dining and leisure activities such as cycling. Modern Amenities: The property features free WiFi, a balcony, patio, and dining area. Additional amenities include a barbecue, shower, and carpeted floors. Convenient Location: Located 42 km from the University of Pune and 54 km from Pune International Airport, the villa is close to attractions like Bund Garden and FTII.",
    guestReview: "Property is very neat and clean. It is amidst the forest so there will be no noise and you can enjoy the nature peacefully. Caretaker is very helpful.",
    reviewerName: "Pramod, India",
    amenities: ["Free WiFi", "Free Parking", "Garden", "Balcony", "Terrace", "Patio", "Pets Allowed", "Family Rooms", "Bath", "Barbecue", "Mountain View", "Entire Place"],
    activities: ["Hiking", "Cycling", "Badminton"],
    accommodation: [
      { type: "Three-Bedroom Villa", beds: ["Bedroom 1: 1 large double bed", "Bedroom 2: 1 large double bed", "Bedroom 3: 1 extra-large double bed"], maxGuests: 6 },
    ],
    distance: "42 km from University of Pune · 54 km from Pune International Airport",
  },
  {
    id: "villetta-cottage",
    name: "Villetta, Cozy & Uber Modern Cottage",
    location: "Pune, Maharashtra",
    area: "Pune",
    rating: 8.8,
    ratingLabel: "Fabulous",
    reviews: 9,
    price: 9751,
    originalPrice: 13000,
    guests: "2 adults",
    size: "180 m²",
    bedrooms: 2,
    bathrooms: 2,
    badge: "Fabulous",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 9.0,
    description: "Situated in Pune in the Maharashtra region, Villetta, cozy and uber modern cottage features a patio and stunning interiors.",
    about: "Villetta is a beautifully designed modern cottage offering a perfect blend of contemporary aesthetics and cozy comfort. The property features a spacious patio, modern kitchen, and stylishly furnished rooms. Ideal for couples and small families seeking a luxurious yet homely retreat in the heart of Maharashtra.",
    guestReview: "Absolutely stunning property. Very clean, stylish and well maintained. The host was very responsive and helpful throughout our stay.",
    reviewerName: "Anjali, Mumbai",
    amenities: ["Free WiFi", "Patio", "Air Conditioning", "Modern Kitchen", "Free Parking", "Garden", "Balcony", "Entire Place"],
    activities: ["Sightseeing", "Local Tours"],
    accommodation: [
      { type: "Two-Bedroom Cottage", beds: ["Bedroom 1: 1 king bed", "Bedroom 2: 1 queen bed"], maxGuests: 4 },
    ],
    distance: "Central Pune location · Easy access to restaurants and shopping",
  },
  {
    id: "royal-luxor-villa",
    name: "The Royal Luxor 3BHK Villa",
    location: "Baner, Pune",
    area: "Pune",
    rating: 7.2,
    ratingLabel: "Good",
    reviews: 8,
    price: 4679,
    originalPrice: 6500,
    guests: "2 adults",
    size: "220 m²",
    bedrooms: 3,
    bathrooms: 3,
    badge: null,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 8.2,
    description: "Featuring garden views, The Royal Luxor 3BHK Villa features accommodation with a garden and a balcony, around 6.9 km from University of Pune.",
    about: "The Royal Luxor is a premium 3-bedroom villa in the upscale Baner area of Pune. Featuring a beautiful garden, private balcony, and modern furnishings, this villa is perfect for families and groups. Located close to major IT hubs and shopping centers, it offers the perfect mix of luxury and convenience.",
    guestReview: "Great location in Baner. Villa is spacious and well furnished. Good for family stays.",
    reviewerName: "Rahul, Pune",
    amenities: ["Free WiFi", "Garden", "Balcony", "Air Conditioning", "Free Parking", "Family Rooms", "Kitchen", "Entire Place"],
    activities: ["City Tours", "Shopping"],
    accommodation: [
      { type: "Three-Bedroom Villa", beds: ["Bedroom 1: 1 king bed", "Bedroom 2: 1 queen bed", "Bedroom 3: 2 single beds"], maxGuests: 8 },
    ],
    distance: "6.9 km from University of Pune · 20 km from Pune Airport",
  },
  {
    id: "saffron-happy-fields",
    name: "SaffronStays Happy Fields — 3BR Pet-Friendly Pool Farmhouse",
    location: "Pune, Maharashtra",
    area: "Pune",
    rating: 7.4,
    ratingLabel: "Good",
    reviews: 8,
    price: 22655,
    originalPrice: 30000,
    guests: "2 adults",
    size: "350 m²",
    bedrooms: 3,
    bathrooms: 3,
    badge: "Pet Friendly",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 8.5,
    description: "Featuring air-conditioned accommodation with a private pool, pool view and a terrace. Pet-friendly farmhouse with farm-to-table dining near Pune.",
    about: "SaffronStays Happy Fields is a luxurious 3-bedroom pet-friendly farmhouse featuring a private pool, farm views, hammocks, and farm-to-table dining. Perfect for a premium getaway with your pets and family. The property features air-conditioned rooms, a terrace, and beautifully landscaped farm grounds.",
    guestReview: "Amazing farmhouse with a beautiful private pool. Farm-to-table food was delicious. Pet-friendly was a big plus for us!",
    reviewerName: "Sneha, Mumbai",
    amenities: ["Private Pool", "Pet Friendly", "Air Conditioning", "Farm-to-Table Dining", "Terrace", "Free WiFi", "Free Parking", "Hammocks", "Entire Place"],
    activities: ["Swimming", "Farm Activities", "Nature Walks"],
    accommodation: [
      { type: "Three-Bedroom Farmhouse", beds: ["Bedroom 1: 1 king bed", "Bedroom 2: 1 king bed", "Bedroom 3: 1 queen bed"], maxGuests: 8 },
    ],
    distance: "Near Pune · Farm-fresh dining experience included",
  },
  {
    id: "teak-trail",
    name: "Teak Trail",
    location: "Pune, Maharashtra",
    area: "Pune",
    rating: 7.2,
    ratingLabel: "Good",
    reviews: 9,
    price: 2100,
    originalPrice: 3500,
    guests: "2 adults",
    size: "150 m²",
    bedrooms: 2,
    bathrooms: 1,
    badge: "Best Value",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 7.8,
    description: "Teak Trail, a property with a garden, is situated in Pune, 29 km from Raja Dinkar Kelkar Museum, 30 km from Fergusson College.",
    about: "Teak Trail is a serene property nestled in a teak forest, offering a peaceful retreat from city life. The property features a beautiful garden, cozy rooms, and a relaxing ambiance perfect for nature lovers. Located conveniently near major Pune landmarks.",
    guestReview: "Very peaceful and serene property. Perfect for a quiet weekend getaway. The garden is beautiful.",
    reviewerName: "Vikram, Pune",
    amenities: ["Garden", "Free Parking", "Nature Views", "Free WiFi", "Entire Place"],
    activities: ["Nature Walks", "Bird Watching"],
    accommodation: [
      { type: "Two-Bedroom Property", beds: ["Bedroom 1: 1 double bed", "Bedroom 2: 1 double bed"], maxGuests: 4 },
    ],
    distance: "29 km from Raja Dinkar Kelkar Museum · 30 km from Fergusson College",
  },
  {
    id: "bhaktivilla",
    name: "Bhaktivilla",
    location: "Talegaon Dābhāde, Near Pune",
    area: "Near Pune",
    rating: 8.4,
    ratingLabel: "Very good",
    reviews: 11,
    price: 5040,
    originalPrice: 7200,
    guests: "2 adults",
    size: "240 m²",
    bedrooms: 3,
    bathrooms: 2,
    badge: null,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    ],
    locationScore: 8.8,
    description: "Boasting air-conditioned accommodation with a private pool, garden view and a balcony, Bhaktivilla is situated in Talegaon Dābhāde.",
    about: "Bhaktivilla is a luxurious retreat in Talegaon Dābhāde, offering air-conditioned rooms, a private pool, and stunning garden views. The property features a beautiful balcony overlooking the gardens, making it perfect for relaxation and rejuvenation. Ideal for families and groups looking for a serene escape near Pune.",
    guestReview: "Beautiful villa with a lovely pool. Very clean and well-maintained. Great host. Will definitely come back!",
    reviewerName: "Meera, Nashik",
    amenities: ["Private Pool", "Air Conditioning", "Garden View", "Balcony", "Free WiFi", "Free Parking", "Family Rooms", "Entire Place"],
    activities: ["Swimming", "Relaxation", "Nature Walks"],
    accommodation: [
      { type: "Three-Bedroom Villa", beds: ["Bedroom 1: 1 king bed", "Bedroom 2: 1 queen bed", "Bedroom 3: 2 single beds"], maxGuests: 8 },
    ],
    distance: "Near Pune · Talegaon Dābhāde location",
  },
];

const SORT_OPTIONS = [
  { value: "top", label: "Our Top Picks" },
  { value: "price-asc", label: "Lowest Price First" },
  { value: "rating", label: "Top Reviewed" },
];

const SCORE_FILTERS = [
  { value: 0, label: "Any" },
  { value: 7, label: "Good: 7+" },
  { value: 8, label: "Very Good: 8+" },
  { value: 8.5, label: "Fabulous: 8.5+" },
];

const amenityIcons = {
  "Free WiFi": "📶", "Free Parking": "🅿️", "Garden": "🌿", "Balcony": "🏠",
  "Terrace": "🌅", "Patio": "☀️", "Pets Allowed": "🐾", "Pet Friendly": "🐾",
  "Family Rooms": "👨‍👩‍👧", "Bath": "🛁", "Barbecue": "🔥", "Mountain View": "⛰️",
  "Private Pool": "🏊", "Air Conditioning": "❄️", "Kitchen": "🍳",
  "Farm-to-Table Dining": "🥗", "Hammocks": "🌴", "Entire Place": "🏡",
  "Nature Views": "🌲",
};

function StarRating({ score }) {
  const filled = Math.round(score / 2);
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= filled ? "#f59e0b" : "#d1d5db", fontSize: "0.9rem" }}>★</span>
      ))}
    </span>
  );
}

function RatingBadge({ score }) {
  const color = score >= 8.5 ? "#059669" : score >= 7 ? "#0d9488" : "#3b82f6";
  return (
    <span style={{ background: color, color: "#fff", fontWeight: 800, fontSize: "1rem", padding: "6px 12px", borderRadius: "8px 8px 8px 0" }}>
      {score}
    </span>
  );
}

/* ── Detail Modal ── */
function VillaDetail({ villa, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;
  const totalPrice = villa.price * nights;

  const handleBooking = (e) => {
    e.preventDefault();
    setBookingSubmitted(true);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", display: "flex",
        alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "20px 16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20,
          width: "100%", maxWidth: 860,
          overflow: "hidden", position: "relative",
          marginTop: 20, marginBottom: 20,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            background: "rgba(0,0,0,0.5)", border: "none",
            color: "#fff", width: 34, height: 34, borderRadius: "50%",
            fontSize: "1.1rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Gallery */}
        <div style={{ position: "relative", background: "#111" }}>
          <img
            src={villa.gallery[activeImg]}
            alt={villa.name}
            style={{ width: "100%", height: 320, objectFit: "cover", display: "block", opacity: 0.95 }}
          />
          {/* Thumbnail strip */}
          {villa.gallery.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 6 }}>
              {villa.gallery.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 52, height: 38, borderRadius: 6, overflow: "hidden",
                    border: i === activeImg ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              <div
                style={{
                  background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6,
                  padding: "0 10px", fontSize: "0.75rem", fontWeight: 600,
                  display: "flex", alignItems: "center",
                }}
              >
                +{51 - villa.gallery.length} photos
              </div>
            </div>
          )}
          {/* Price Match badge */}
          <div
            style={{
              position: "absolute", top: 14, left: 14,
              background: "#fff", borderRadius: 8, padding: "5px 12px",
              fontSize: "0.78rem", fontWeight: 700, color: "#059669",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            🏷️ We Price Match
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <div>
              <h2 style={{ fontWeight: 800, color: "#111827", fontSize: "1.35rem", marginBottom: 4 }}>
                {villa.name}
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                📍 {villa.location}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <RatingBadge score={villa.rating} />
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginTop: 4 }}>{villa.ratingLabel}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{villa.reviews} reviews</div>
            </div>
          </div>

          {/* Location score */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 8, padding: "6px 12px", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#059669", fontSize: "0.9rem" }}>Excellent location</span>
            <span style={{ background: "#059669", color: "#fff", fontWeight: 800, fontSize: "0.8rem", padding: "2px 8px", borderRadius: 6 }}>
              {villa.locationScore}/10
            </span>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>score from {villa.reviews} reviews</span>
          </div>

          {/* Guest review */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 20, borderLeft: "3px solid #059669" }}>
            <p style={{ fontSize: "0.85rem", color: "#374151", fontStyle: "italic", margin: "0 0 6px", lineHeight: 1.6 }}>
              "{villa.guestReview}"
            </p>
            <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>— {villa.reviewerName}</span>
          </div>

          {/* Quick facts */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Entire place is yours", icon: "🏡" },
              { label: villa.size, icon: "📐" },
              { label: `${villa.bedrooms} Bedrooms`, icon: "🛏️" },
              { label: `${villa.bathrooms} Bathrooms`, icon: "🛁" },
              { label: `Up to ${villa.accommodation[0]?.maxGuests || 6} guests`, icon: "👥" },
            ].map((f) => (
              <span
                key={f.label}
                style={{
                  background: "#f1f5f9", color: "#374151", borderRadius: 8,
                  padding: "6px 12px", fontSize: "0.82rem", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* Amenities */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Most Popular Facilities</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {villa.amenities.map((a) => (
              <span
                key={a}
                style={{
                  background: "#f0fdf4", color: "#065f46",
                  border: "1px solid #bbf7d0", borderRadius: 8,
                  padding: "5px 12px", fontSize: "0.8rem", fontWeight: 500,
                }}
              >
                {amenityIcons[a] || "✓"} {a}
              </span>
            ))}
          </div>

          {/* Activities */}
          {villa.activities?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Activities</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {villa.activities.map((a) => (
                  <span key={a} style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 500 }}>
                    🎯 {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>About This Property</h4>
          <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8, marginBottom: 24 }}>
            {villa.about}
          </p>

          {/* Distance */}
          <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 24 }}>
            📍 {villa.distance}
          </p>

          {/* Accommodation types */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Accommodation</h4>
          {villa.accommodation.map((acc) => (
            <div
              key={acc.type}
              style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 12, border: "1px solid #e2e8f0" }}
            >
              <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 8, fontSize: "0.9rem" }}>
                🏠 {acc.type} · Max {acc.maxGuests} guests
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {acc.beds.map((b) => (
                  <span key={b} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", color: "#374151" }}>
                    🛏 {b}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Booking section */}
          <div
            style={{
              background: "#f0fdf4", borderRadius: 16,
              padding: "24px", marginTop: 24,
              border: "1px solid #bbf7d0",
            }}
          >
            <h4 style={{ fontWeight: 800, color: "#064e3b", marginBottom: 4 }}>
              Reserve Your Villa Stay
            </h4>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>
              Select dates to check availability and prices
            </p>

            {bookingSubmitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>✅</div>
                <h5 style={{ fontWeight: 700, color: "#065f46", marginBottom: 8 }}>Booking Request Received!</h5>
                <p style={{ fontSize: "0.88rem", color: "#374151" }}>
                  We'll contact you on WhatsApp within 30 minutes to confirm your reservation.
                </p>
                <a
                  href="https://wa.me/919856112727"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#25d366", color: "#fff",
                    padding: "10px 22px", borderRadius: 8,
                    fontWeight: 700, fontSize: "0.88rem",
                    textDecoration: "none", marginTop: 12,
                  }}
                >
                  Chat on WhatsApp →
                </a>
              </div>
            ) : (
              <form onSubmit={handleBooking}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    Guests
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8].map((n) => (
                      <option key={n} value={n}>{n} adult{n > 1 ? "s" : ""} · 0 children · 1 room</option>
                    ))}
                  </select>
                </div>

                {/* Price summary */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>₹{villa.price.toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>Total</span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#059669" }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%", background: "#059669", color: "#fff",
                    border: "none", borderRadius: 10, padding: "13px",
                    fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  Reserve Now
                </button>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", margin: 0 }}>
                  You won't be charged yet · We'll confirm via WhatsApp
                </p>
              </form>
            )}
          </div>

          {/* WhatsApp quick contact */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a
              href={`https://wa.me/919856112727?text=Hi! I'm interested in booking ${villa.name}.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                color: "#25d366", fontWeight: 600, fontSize: "0.88rem",
                textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Have questions? Chat on WhatsApp
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Main Villas Page ── */
export default function Villas() {
  const [sort, setSort] = useState("top");
  const [minScore, setMinScore] = useState(0);
  const [selectedVilla, setSelectedVilla] = useState(null);

  const [, setVillaSyncKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Best Villas in Pune | Villa Booking | Gadvede Trekkers";

    syncProductsFromApi("villa", "gt_villas")
      .then((items) => { if (items) setVillaSyncKey((k) => k + 1); })
      .catch(() => {});

    const onStorage = () => setVillaSyncKey((k) => k + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("gt:storage-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gt:storage-updated", onStorage);
    };
  }, []);

  const _storedVillas = getAdminItems("gt_villas");
  const activeVillas = _storedVillas.length > 0
    ? _storedVillas
        .filter((v) => v.active !== false)
        .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
        .map((v) => {
          let gallery;
          try { gallery = JSON.parse(v.imageGallery || "[]").filter(Boolean); } catch { gallery = []; }
          const amenitiesArr = String(v.amenities || "").split("\n").map((s) => s.trim()).filter(Boolean);
          const maxG = Number(v.maxGuests) || 6;
          const rating = Number(v.rating) || 0;
          const ratingLbl = v.ratingLabel || (rating >= 8.5 ? "Fabulous" : rating >= 8 ? "Very good" : "Good");
          return {
            id: v.id || String(v.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") || String(v.sortOrder),
            name: v.name || "",
            location: v.location || "",
            area: v.area || v.location || "",
            rating,
            ratingLabel: ratingLbl,
            reviews: Number(v.reviews) || 0,
            price: Number(v.price) || 0,
            originalPrice: Number(v.originalPrice) || 0,
            guests: "2 adults",
            size: v.size || "",
            bedrooms: Number(v.bedrooms) || 0,
            bathrooms: Number(v.bathrooms) || 0,
            badge: v.badge || null,
            image: gallery[0] || "",
            gallery: gallery.length ? gallery : [],
            locationScore: Number(v.locationScore) || 0,
            description: v.description || "",
            about: v.about || v.description || "",
            guestReview: v.guestReview || "",
            reviewerName: v.reviewerName || "",
            amenities: amenitiesArr,
            activities: [],
            accommodation: [{ type: `${v.bedrooms || "?"}-Bedroom Villa`, beds: [], maxGuests: maxG }],
            distance: v.distance || v.nearbyAttractions || "",
          };
        })
    : villasList;

  const sorted = [...activeVillas]
    .filter((v) => v.rating >= minScore)
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div>

      {/* ── HERO ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          padding: "60px 0 44px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="container">
          <span
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "5px 18px",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              display: "inline-block",
              marginBottom: 18,
              color: "#c7d2fe",
            }}
          >
            🏡 Villa Rentals
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, marginBottom: 10 }}>
            The Best Villas in Pune
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.85, maxWidth: 520, margin: "0 auto 0" }}>
            Check out our pick of great villas in Pune. Handpicked properties for every budget — from cozy cottages to luxury farmhouses with private pools.
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 90 }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "12px 16px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Filter by Review Score:</span>
            {SCORE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMinScore(f.value)}
                style={{
                  padding: "5px 14px", borderRadius: 999,
                  border: minScore === f.value ? "none" : "1px solid #d1d5db",
                  background: minScore === f.value ? "#4338ca" : "#f9fafb",
                  color: minScore === f.value ? "#fff" : "#374151",
                  fontWeight: 600, fontSize: "0.78rem",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{sorted.length} properties</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── VILLA LIST ── */}
      <div className="container py-5">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sorted.map((villa) => (
            <div
              key={villa.id}
              style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: "280px 1fr",
                transition: "box-shadow 0.2s",
                cursor: "pointer",
              }}
              className="villa-card-row"
              onClick={() => setSelectedVilla(villa)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)")}
            >
              {/* Image */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={villa.image}
                  alt={villa.name}
                  style={{ width: "100%", height: "100%", minHeight: 200, objectFit: "cover", display: "block" }}
                />
                {villa.badge && (
                  <span
                    style={{
                      position: "absolute", top: 10, left: 10,
                      background: "#4338ca", color: "#fff",
                      padding: "3px 10px", borderRadius: 999,
                      fontSize: "0.72rem", fontWeight: 700,
                    }}
                  >
                    {villa.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111827", lineHeight: 1.3, margin: 0 }}>
                      {villa.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{villa.ratingLabel}</div>
                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{villa.reviews} reviews</div>
                      </div>
                      <RatingBadge score={villa.rating} />
                    </div>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 6 }}>📍 {villa.location}</p>
                  <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
                    {villa.description}
                  </p>

                  {/* Top amenities preview */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {villa.amenities.slice(0, 5).map((a) => (
                      <span key={a} style={{ background: "#f0fdf4", color: "#065f46", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                        {amenityIcons[a] || "✓"} {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Price from</div>
                    <div>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e1b4b" }}>
                        ₹{villa.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af", textDecoration: "line-through", marginLeft: 6 }}>
                        ₹{villa.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>1 night, 2 adults</div>
                  </div>
                  <button
                    style={{
                      background: "#4338ca", color: "#fff",
                      border: "none", padding: "10px 22px",
                      borderRadius: 10, fontWeight: 700,
                      fontSize: "0.88rem", cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#3730a3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#4338ca")}
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SEO footer */}
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: "28px 32px", marginTop: 48, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>Best Villa Rentals Near Pune</h2>
          <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 16 }}>
            Gadvede Trekkers offers curated villa rentals near Pune — from lakefront farmhouses to forest retreats
            and luxury pool villas. Whether you're planning a family vacation, couple getaway, or group outing, our
            handpicked villas offer the perfect escape from city life. All properties include free WiFi, parking, and
            direct booking support via WhatsApp.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Villa Near Pune", "Private Pool Villa", "Pet Friendly Villa", "Farmhouse Near Pune", "Weekend Villa Rental", "Luxury Villa Pune", "Budget Villa Pune"].map((tag) => (
              <span key={tag} style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedVilla && <VillaDetail villa={selectedVilla} onClose={() => setSelectedVilla(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .villa-card-row {
            grid-template-columns: 1fr !important;
          }
          .villa-card-row img {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}
