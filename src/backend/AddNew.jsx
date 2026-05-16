import { useState } from "react";
import { useAdminData } from "../hooks/useAdminData";
import { saveVendor } from "../data/vendorStorage";

/* ─── Field definitions for each category ─── */
const TREK_FIELDS = [
  { key: "name",          label: "Trek Name",           required: true, col: 8 },
  { key: "region",        label: "Region",              required: true, type: "select", options: ["mumbai", "pune"], col: 4 },
  { key: "location",      label: "Location",            required: true, placeholder: "Pune, Maharashtra", col: 6 },
  { key: "difficulty",    label: "Difficulty",          required: true, type: "select", options: ["Easy", "Medium", "Hard"], col: 3 },
  { key: "duration",      label: "Duration",            required: true, placeholder: "1 Night 1 Day", col: 3 },
  { key: "altitude",      label: "Altitude",            placeholder: "1424m", col: 4 },
  { key: "price",         label: "Price (₹)",           required: true, type: "number", placeholder: "1449", col: 4 },
  { key: "originalPrice", label: "Original Price (₹)",  type: "number", placeholder: "1899", col: 4 },
  { key: "nextDate",      label: "Next Date",           placeholder: "20 Oct 2025", col: 4 },
  { key: "rating",        label: "Rating (1-5)",        type: "number", placeholder: "4.9", col: 4 },
  { key: "reviews",       label: "Review Count",        type: "number", placeholder: "190", col: 4 },
  { key: "image",         label: "Image URL",           col: 12, placeholder: "https://..." },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/trek-name.pdf or https://...", col: 12 },
  { key: "about",         label: "About / Overview",    type: "textarea", col: 12 },
  { key: "highlights",    label: "Trek Highlights (one per line)", type: "textarea", col: 12 },
];

const TREK_DEFAULT = {
  name: "", region: "mumbai", location: "", difficulty: "Medium",
  duration: "", altitude: "", price: "", originalPrice: "", nextDate: "",
  rating: "", reviews: "", image: "", itineraryPdfUrl: "", about: "", highlights: "", active: true,
};

const TOUR_FIELDS = [
  { key: "name",          label: "Tour Name",           required: true, col: 8 },
  { key: "region",        label: "Region",              required: true, type: "select",
    options: ["himachal", "kashmir", "northeast", "rajasthan", "southindia", "uttarakhand"], col: 4 },
  { key: "duration",      label: "Duration",            required: true, placeholder: "5-6 Days", col: 4 },
  { key: "price",         label: "Price (₹)",           required: true, type: "number", placeholder: "9999", col: 4 },
  { key: "originalPrice", label: "Original Price (₹)",  type: "number", placeholder: "12999", col: 4 },
  { key: "nextDate",      label: "Next Date",           placeholder: "10 Oct 2025", col: 4 },
  { key: "image",         label: "Image URL",           col: 12, placeholder: "https://..." },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/tour-name.pdf or https://...", col: 12 },
];

const TOUR_DEFAULT = {
  name: "", region: "himachal", duration: "",
  price: "", originalPrice: "", nextDate: "", image: "", itineraryPdfUrl: "", active: true,
};

const CAMPING_FIELDS = [
  { key: "name",          label: "Site Name (Full)",    required: true, col: 8 },
  { key: "shortName",     label: "Short Name",          placeholder: "Pawna Lake Camping", col: 4 },
  { key: "type",          label: "Type",                required: true, type: "select", options: ["Beach", "Lake", "Forest", "Hill", "Farm"], col: 4 },
  { key: "location",      label: "Location",            required: true, placeholder: "Pawna Lake — Keware Village", col: 8 },
  { key: "duration",      label: "Duration",            required: true, placeholder: "Overnight", col: 4 },
  { key: "price",         label: "Price (₹)",           required: true, type: "number", placeholder: "1099", col: 4 },
  { key: "originalPrice", label: "Original Price (₹)",  type: "number", placeholder: "1499", col: 4 },
  { key: "badge",         label: "Badge",               placeholder: "Most Popular", col: 4 },
  { key: "description",   label: "Description",         type: "textarea", col: 12, placeholder: "Brief description of the camping experience…" },
  { key: "image",         label: "Image URL",           col: 12, placeholder: "https://..." },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/camping-name.pdf or https://...", col: 12 },
];

const CAMPING_DEFAULT = {
  name: "", shortName: "", type: "Lake", location: "", duration: "",
  price: "", originalPrice: "", badge: "", description: "", image: "", itineraryPdfUrl: "", active: true,
};

const HERITAGE_FIELDS = [
  { key: "name",          label: "Walk Name",           required: true, col: 8 },
  { key: "type",          label: "Category",            required: true, type: "select", options: ["city", "forts", "temples"], col: 4 },
  { key: "location",      label: "Location",            required: true, placeholder: "Pune", col: 6 },
  { key: "duration",      label: "Duration",            required: true, placeholder: "2-3 Hours", col: 3 },
  { key: "price",         label: "Price (₹)",           required: true, type: "number", placeholder: "499", col: 3 },
  { key: "originalPrice", label: "Original Price (₹)",  type: "number", placeholder: "799", col: 4 },
  { key: "nextDate",      label: "Next Date",           placeholder: "20 Oct 2025", col: 4 },
  { key: "rating",        label: "Rating (1-5)",        type: "number", placeholder: "4.8", col: 4 },
  { key: "image",         label: "Image URL",           col: 12, placeholder: "https://..." },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/heritage-name.pdf or https://...", col: 12 },
];

const HERITAGE_DEFAULT = {
  name: "", type: "city", location: "", duration: "",
  price: "", originalPrice: "", nextDate: "", rating: "", image: "", itineraryPdfUrl: "", active: true,
};

const RENTAL_FIELDS = [
  { key: "name",          label: "Item Name",           required: true, col: 8 },
  { key: "category",      label: "Category",            required: true, type: "select", options: ["Tents", "Gear", "Villas"], col: 4 },
  { key: "location",      label: "Location",            required: true, placeholder: "Pune", col: 6 },
  { key: "price",         label: "Price (₹/day)",       required: true, type: "number", placeholder: "299", col: 3 },
  { key: "originalPrice", label: "Original Price (₹)",  type: "number", placeholder: "499", col: 3 },
  { key: "rating",        label: "Rating (1-5)",        type: "number", placeholder: "4.7", col: 4 },
  { key: "image",         label: "Image URL",           col: 12, placeholder: "https://..." },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/rental-name.pdf or https://...", col: 12 },
];

const RENTAL_DEFAULT = {
  name: "", category: "Tents", location: "",
  price: "", originalPrice: "", rating: "", image: "", itineraryPdfUrl: "", active: true,
};

/* ─── Generic field-based Add form ─── */
function GenericAddForm({ fields, defaultForm, storageKey, label }) {
  const { add } = useAdminData(storageKey);
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    add(form);
    setForm(defaultForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit}>
      {saved && (
        <div className="alert alert-success py-2 mb-3" role="alert">
          ✅ {label} added successfully!
        </div>
      )}
      <div className="row g-3">
        {fields.map((f) => (
          <div className={`col-md-${f.col || 6}`} key={f.key}>
            <label className="form-label small fw-semibold mb-1">
              {f.label}
              {f.required && <span className="text-danger ms-1">*</span>}
            </label>
            {f.type === "select" ? (
              <select
                className="form-select form-select-sm"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder || ""}
                required={f.required}
              />
            ) : (
              <input
                type={f.type || "text"}
                className="form-control form-control-sm"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder || ""}
                required={f.required}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 d-flex gap-2">
        <button type="submit" className="btn btn-success btn-sm px-4">
          Save {label}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setForm(defaultForm)}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

/* ─── Vendor Add Form ─── */
const SERVICE_TYPES = ["Bus", "Food", "Adventure Activity"];
const RATE_PLACEHOLDERS = {
  Bus: "e.g. ₹15,000/day (AC Bus 40 seats)",
  Food: "e.g. ₹150/plate (Veg Thali)",
  "Adventure Activity": "e.g. ₹500/day per person",
};
const VENDOR_EMPTY = { name: "", address: "", googleMapLocation: "", contactNumber: "", serviceType: "Bus", rates: "", images: [] };

function VendorAddForm() {
  const [form, setForm] = useState(VENDOR_EMPTY);
  const [saved, setSaved] = useState(false);

  const handleImages = (e) => {
    const files = [...e.target.files];
    Promise.all(
      files.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onload = (ev) => res(ev.target.result);
            r.readAsDataURL(f);
          })
      )
    ).then((imgs) => setForm((f) => ({ ...f, images: [...f.images, ...imgs] })));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.contactNumber) return alert("Name and Contact Number are required.");
    saveVendor({ ...form });
    setForm(VENDOR_EMPTY);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave}>
      {saved && (
        <div className="alert alert-success py-2 mb-3" role="alert">
          ✅ Vendor registered successfully!
        </div>
      )}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold mb-1">Vendor Name <span className="text-danger">*</span></label>
          <input className="form-control form-control-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold mb-1">Contact Number <span className="text-danger">*</span></label>
          <input className="form-control form-control-sm" value={form.contactNumber} onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))} required />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold mb-1">Address</label>
          <input className="form-control form-control-sm" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold mb-1">Google Map URL</label>
          <input className="form-control form-control-sm" placeholder="https://maps.google.com/…" value={form.googleMapLocation} onChange={(e) => setForm((f) => ({ ...f, googleMapLocation: e.target.value }))} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold mb-1">Service Type</label>
          <select className="form-select form-select-sm" value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value, rates: "" }))}>
            {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label small fw-semibold mb-1">Rates</label>
          <input className="form-control form-control-sm" placeholder={RATE_PLACEHOLDERS[form.serviceType]} value={form.rates} onChange={(e) => setForm((f) => ({ ...f, rates: e.target.value }))} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold mb-1">Upload Images</label>
          <input type="file" className="form-control form-control-sm" multiple accept="image/*" onChange={handleImages} />
          {form.images?.length > 0 && (
            <div className="d-flex gap-2 mt-2 flex-wrap">
              {form.images.map((img, i) => (
                <img key={i} src={img} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 d-flex gap-2">
        <button type="submit" className="btn btn-success btn-sm px-4">Register Vendor</button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setForm(VENDOR_EMPTY)}>Reset</button>
      </div>
    </form>
  );
}

/* ─── Tabs config ─── */
const TABS = [
  { key: "trek",    icon: "🥾", label: "Trek" },
  { key: "tour",    icon: "🗺",  label: "Tour" },
  { key: "camping", icon: "⛺", label: "Camping" },
  { key: "vendor",  icon: "🏪", label: "Vendor" },
  { key: "heritage",icon: "🏛", label: "Heritage Walk" },
  { key: "rental",  icon: "🏠", label: "Rental" },
];

export default function AddNew() {
  const [activeTab, setActiveTab] = useState("trek");

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">➕ Add New</h3>
        <span className="text-muted small">Choose a category and fill in the details</span>
      </div>

      {/* Sub-tabs */}
      <div className="adm-addnew-tabs mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`adm-addnew-tab ${activeTab === t.key ? "adm-addnew-tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}
            type="button"
          >
            <span className="me-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="adm-form-card">
        <h5 className="mb-4 fw-bold">
          {TABS.find((t) => t.key === activeTab)?.icon}{" "}
          Add New {TABS.find((t) => t.key === activeTab)?.label}
        </h5>

        {activeTab === "trek" && (
          <GenericAddForm fields={TREK_FIELDS} defaultForm={TREK_DEFAULT} storageKey="gt_treks" label="Trek" />
        )}
        {activeTab === "tour" && (
          <GenericAddForm fields={TOUR_FIELDS} defaultForm={TOUR_DEFAULT} storageKey="gt_tours" label="Tour" />
        )}
        {activeTab === "camping" && (
          <GenericAddForm fields={CAMPING_FIELDS} defaultForm={CAMPING_DEFAULT} storageKey="gt_camping" label="Camping Site" />
        )}
        {activeTab === "vendor" && <VendorAddForm />}
        {activeTab === "heritage" && (
          <GenericAddForm fields={HERITAGE_FIELDS} defaultForm={HERITAGE_DEFAULT} storageKey="gt_heritage" label="Heritage Walk" />
        )}
        {activeTab === "rental" && (
          <GenericAddForm fields={RENTAL_FIELDS} defaultForm={RENTAL_DEFAULT} storageKey="gt_rentals" label="Rental Item" />
        )}
      </div>

      <style>{`
        .adm-addnew-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .adm-addnew-tab {
          padding: 7px 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.18s;
        }
        .adm-addnew-tab:hover {
          border-color: #16a34a;
          color: #16a34a;
        }
        .adm-addnew-tab--active {
          background: #16a34a;
          border-color: #16a34a;
          color: #fff;
          box-shadow: 0 2px 8px rgba(22,163,74,0.25);
        }
      `}</style>
    </div>
  );
}
