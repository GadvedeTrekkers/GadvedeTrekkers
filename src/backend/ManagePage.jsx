import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminData } from "../hooks/useAdminData";
import { logActivity } from "../data/activityLogStorage";

const CITY_STOPS = {
  Mumbai: ["Dadar", "Thane", "Borivali", "Ghatkopar", "Andheri", "Bandra", "CST / CSMT", "Kurla", "Mulund", "Vashi", "Panvel", "Kalyan"],
  Pune: ["Shivajinagar", "Wakad", "Nigdi", "Katraj", "Kothrud", "Hadapsar", "Pimpri", "Chinchwad", "Hinjewadi", "Swargate", "Deccan", "Kharadi", "Nashik Phata"],
  Kasara: ["Kasara Railway Station", "Asangaon", "Shahapur", "Igatpuri"],
  "Base Village": ["Bari Village", "Pachnai Village", "Samrad Village", "Bhorgiri Base", "Dehene Village"],
  Nashik: ["CBS Bus Stand", "Gangapur Road", "Satpur", "Dwarka", "Cidco"],
  Thane: ["Thane Station (E)", "Thane Station (W)", "Kalwa", "Mulund Naka", "Airoli", "Ghansoli"],
  "Navi Mumbai": ["Vashi", "Nerul", "Belapur", "Panvel", "Kharghar", "Airoli", "Sanpada"],
  Aurangabad: ["MSRTC Bus Stand", "Jalna Road", "Cidco", "Padegaon"],
  Nagpur: ["Sitabuldi", "Dharampeth", "Hingna Road", "Kamptee Road", "Reshimbagh"],
  Kolhapur: ["Mahadwar Road", "Rankala", "Tarabai Park", "MSRTC Stand"],
};

function parseJsonValue(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function PickupPointsField({ value, onChange, cities }) {
  const parsed = useMemo(() => parseJsonValue(value, {}), [value]);

  const update = (next) => onChange(JSON.stringify(next));

  const toggleCity = (city) => {
    const next = { ...parsed };
    if (next[city]) delete next[city];
    else next[city] = [];
    update(next);
  };

  const addPoint = (city) => {
    update({ ...parsed, [city]: [...(parsed[city] || []), { time: "", location: "" }] });
  };

  const editPoint = (city, idx, field, val) => {
    const pts = [...(parsed[city] || [])];
    pts[idx] = { ...pts[idx], [field]: val };
    update({ ...parsed, [city]: pts });
  };

  const removePoint = (city, idx) => {
    update({ ...parsed, [city]: (parsed[city] || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="adm-city-list mb-3">
        {cities.map((city) => (
          <label key={city} className="adm-city-check">
            <input type="checkbox" checked={!!parsed[city]} onChange={() => toggleCity(city)} />
            {city}
          </label>
        ))}
      </div>

      {Object.keys(parsed).map((city) => (
        <div key={city} className="adm-pickup-city mb-3">
          <div className="adm-pickup-city-header">
            <span>📍 {city}</span>
            <button type="button" className="btn btn-outline-success btn-sm py-0 px-2" onClick={() => addPoint(city)}>
              + Add Pickup
            </button>
          </div>
          {(parsed[city] || []).length === 0 && <p className="text-muted small mb-0 mt-1">No pickup points yet - click "+ Add Pickup"</p>}
          {(parsed[city] || []).map((pt, i) => (
            <div key={i} className="adm-pickup-row">
              <input
                className="form-control form-control-sm"
                placeholder="Time (e.g. 09:00 PM)"
                value={pt.time}
                onChange={(e) => editPoint(city, i, "time", e.target.value)}
              />
              <select className="form-select form-select-sm" value={pt.location} onChange={(e) => editPoint(city, i, "location", e.target.value)}>
                <option value="">- Select stop -</option>
                {(CITY_STOPS[city] || []).map((stop) => (
                  <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
              <button type="button" className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => removePoint(city, i)}>x</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TrekDatesField({ value, onChange }) {
  const rows = parseJsonValue(value, []);

  const updateRows = (next) => onChange(JSON.stringify(next));

  const addRow = () => {
    updateRows([
      ...rows,
      { id: `date_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, date: "", label: "", whatsappGroupLink: "" },
    ]);
  };

  const updateRow = (id, field, fieldValue) => {
    updateRows(rows.map((row) => (row.id === id ? { ...row, [field]: fieldValue } : row)));
  };

  const removeRow = (id) => {
    updateRows(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="small text-muted">Add multiple departure dates and map the WhatsApp group link for each batch.</div>
        <button type="button" className="btn btn-outline-success btn-sm" onClick={addRow}>+ Add Date</button>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted small">No dates added yet.</div>
      ) : (
        rows.map((row, index) => (
          <div key={row.id} className="border rounded-3 p-3 mb-3 bg-light">
            <div className="fw-semibold small mb-2">Batch {index + 1}</div>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label small fw-semibold mb-1">Date</label>
                <input type="date" className="form-control form-control-sm" value={row.date || ""} onChange={(e) => updateRow(row.id, "date", e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold mb-1">Label</label>
                <input type="text" className="form-control form-control-sm" placeholder="Weekend batch" value={row.label || ""} onChange={(e) => updateRow(row.id, "label", e.target.value)} />
              </div>
              <div className="col-md-5">
                <label className="form-label small fw-semibold mb-1">WhatsApp Group Link</label>
                <input type="url" className="form-control form-control-sm" placeholder="https://chat.whatsapp.com/..." value={row.whatsappGroupLink || ""} onChange={(e) => updateRow(row.id, "whatsappGroupLink", e.target.value)} />
              </div>
              <div className="col-md-1">
                <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => removeRow(row.id)}>x</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ChecklistTextareaField({ value, onChange, options = [], manualPlaceholder = "Add one item per line" }) {
  const parsedItems = String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedSet = new Set(parsedItems.filter((item) => options.includes(item)));

  const toggleOption = (option) => {
    const nextSelected = selectedSet.has(option)
      ? parsedItems.filter((item) => item !== option)
      : [...parsedItems, option];
    onChange(nextSelected.join("\n"));
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="adm-city-list mb-3">
        {options.map((option) => (
          <label key={option} className="adm-city-check">
            <input type="checkbox" checked={selectedSet.has(option)} onChange={() => toggleOption(option)} />
            {option}
          </label>
        ))}
      </div>
      <textarea
        className="form-control form-control-sm"
        rows={5}
        placeholder={manualPlaceholder}
        value={parsedItems.join("\n")}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DiscountCodesField({ value, onChange, enabled, onToggle, options = [] }) {
  const rows = String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const [selectedOption, setSelectedOption] = useState("");

  const addSelectedOption = () => {
    if (!selectedOption) return;
    const next = rows.includes(selectedOption) ? rows : [...rows, selectedOption];
    onChange(next.join("\n"));
    setSelectedOption("");
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="small text-muted">Turn coupon visibility on or off for the trek page.</span>
        <label className="adm-city-check mb-0">
          <input type="checkbox" checked={!!enabled} onChange={(e) => onToggle(e.target.checked)} />
          Show Discount Coupons
        </label>
      </div>

      {enabled && (
        <>
          <div className="d-flex gap-2 mb-3">
            <select className="form-select form-select-sm" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
              <option value="">- Select discount coupon -</option>
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button type="button" className="btn btn-outline-success btn-sm" onClick={addSelectedOption}>Add Coupon</button>
          </div>
          <textarea
            className="form-control form-control-sm"
            rows={4}
            placeholder="Selected coupons appear here. You can also add custom coupon lines manually."
            value={rows.join("\n")}
            onChange={(e) => onChange(e.target.value)}
          />
        </>
      )}
    </div>
  );
}

function ImageGalleryField({ value, onChange }) {
  const images = parseJsonValue(value, []);

  const updateImages = (next) => onChange(JSON.stringify(next));

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((result) => {
      updateImages([...images, ...result.filter(Boolean)]);
    });

    event.target.value = "";
  };

  const removeImage = (index) => {
    updateImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="small text-muted mb-2">
        Upload at least 3 images from your system. The banner preview uses cover crop so you can check how the trek hero will look.
      </div>
      <input type="file" accept="image/*" multiple className="form-control form-control-sm mb-3" onChange={handleFiles} />
      <div className="row g-3">
        {images.map((image, index) => (
          <div className="col-md-4" key={`${index}_${String(image).slice(0, 24)}`}>
            <div className="border rounded-3 p-2 h-100 bg-light">
              <div className="small fw-semibold mb-2">Banner Preview {index + 1}</div>
              <div style={{ aspectRatio: "16 / 7", overflow: "hidden", borderRadius: 10, background: "#d1d5db" }}>
                <img src={image} alt={`Preview ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <button type="button" className="btn btn-outline-danger btn-sm mt-2 w-100" onClick={() => removeImage(index)}>Remove Image</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeparturePlansField({ value, onChange, cityOptions = [] }) {
  const plans = parseJsonValue(value, {});
  const selectedCities = Object.keys(plans);
  const [activeCity, setActiveCity] = useState(selectedCities[0] || "");

  useEffect(() => {
    if (selectedCities.length === 0) {
      setActiveCity("");
      return;
    }
    if (!selectedCities.includes(activeCity)) {
      setActiveCity(selectedCities[0]);
    }
  }, [activeCity, selectedCities]);

  const updatePlans = (next) => onChange(JSON.stringify(next));

  const addCity = (city) => {
    if (plans[city]) {
      setActiveCity(city);
      return;
    }
    updatePlans({ ...plans, [city]: { price: "", pickupPoints: [], itinerary: "" } });
    setActiveCity(city);
  };

  const removeCity = (city) => {
    const next = { ...plans };
    delete next[city];
    updatePlans(next);
  };

  const updatePlan = (city, field, fieldValue) => {
    updatePlans({ ...plans, [city]: { ...plans[city], [field]: fieldValue } });
  };

  const addPickup = (city) => {
    const current = plans[city] || { pickupPoints: [] };
    updatePlan(city, "pickupPoints", [...(current.pickupPoints || []), { time: "", location: "" }]);
  };

  const updatePickup = (city, index, field, fieldValue) => {
    const current = plans[city] || { pickupPoints: [] };
    const nextPickups = [...(current.pickupPoints || [])];
    nextPickups[index] = { ...(nextPickups[index] || {}), [field]: fieldValue };
    updatePlan(city, "pickupPoints", nextPickups);
  };

  const removePickup = (city, index) => {
    const current = plans[city] || { pickupPoints: [] };
    updatePlan(city, "pickupPoints", (current.pickupPoints || []).filter((_, i) => i !== index));
  };

  return (
    <div className="adm-pickups-wrap">
      <div className="small text-muted mb-2">
        Add departure cities once, then switch between city tabs. Data stays saved while switching and is removed only if you click remove.
      </div>

      <div className="adm-city-list mb-3">
        {cityOptions.map((city) => (
          <button key={city} type="button" className="btn btn-outline-success btn-sm" onClick={() => addCity(city)}>
            {plans[city] ? `Edit ${city}` : `+ ${city}`}
          </button>
        ))}
      </div>

      {selectedCities.length === 0 ? (
        <div className="text-muted small">No departure city selected yet.</div>
      ) : (
        <>
          <div className="adm-city-list mb-3">
            {selectedCities.map((city) => (
              <label key={city} className="adm-city-check">
                <input type="radio" name="departure-city-editor" checked={activeCity === city} onChange={() => setActiveCity(city)} />
                {city}
              </label>
            ))}
          </div>

          {activeCity && (
            <div className="border rounded-3 p-3 mb-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-semibold">{activeCity} Settings</div>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeCity(activeCity)}>
                  Remove {activeCity}
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold mb-1">{activeCity} Price (INR)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={`Enter ${activeCity} price`}
                    value={plans[activeCity]?.price ?? ""}
                    onChange={(e) => updatePlan(activeCity, "price", e.target.value)}
                  />
                </div>

                <div className="col-md-8">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label small fw-semibold mb-1">{activeCity} Pickup Points</label>
                    <button type="button" className="btn btn-outline-success btn-sm py-0 px-2" onClick={() => addPickup(activeCity)}>+ Add Pickup</button>
                  </div>

                  {(plans[activeCity]?.pickupPoints || []).length === 0 ? (
                    <div className="text-muted small mt-1">No pickup points added yet.</div>
                  ) : (
                    (plans[activeCity]?.pickupPoints || []).map((pickup, index) => (
                      <div key={`${activeCity}_${index}`} className="adm-pickup-row">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Time (e.g. 08:30 PM)"
                          value={pickup.time || ""}
                          onChange={(e) => updatePickup(activeCity, index, "time", e.target.value)}
                        />
                        <select
                          className="form-select form-select-sm"
                          value={(CITY_STOPS[activeCity] || []).includes(pickup.location || "") ? pickup.location || "" : "__manual__"}
                          onChange={(e) => updatePickup(activeCity, index, "location", e.target.value === "__manual__" ? "" : e.target.value)}
                        >
                          <option value="">- Select stop -</option>
                          {(CITY_STOPS[activeCity] || []).map((stop) => (
                            <option key={stop} value={stop}>{stop}</option>
                          ))}
                          <option value="__manual__">Other (manual entry)</option>
                        </select>
                        <input
                          className="form-control form-control-sm"
                          placeholder="Manual pickup location"
                          value={pickup.location || ""}
                          onChange={(e) => updatePickup(activeCity, index, "location", e.target.value)}
                        />
                        <input
                          className="form-control form-control-sm"
                          placeholder="📍 Google Maps URL (optional)"
                          value={pickup.mapUrl || ""}
                          onChange={(e) => updatePickup(activeCity, index, "mapUrl", e.target.value)}
                        />
                        <button type="button" className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => removePickup(activeCity, index)}>x</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold mb-1">{activeCity} Itinerary</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={4}
                    placeholder={`One entry per line — format: Time|Description\nExample:\n06:00 AM|Meet at pickup point\n07:30 AM|Depart for base village\n12:00 PM|Summit`}
                    value={plans[activeCity]?.itinerary || ""}
                    onChange={(e) => updatePlan(activeCity, "itinerary", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ManagePage({
  title,
  icon,
  storageKey,
  fields,
  defaultForm,
  seedData = [],
  transformForm,
  afterSubmit,
  onPreview,
}) {
  const { data, add, update, remove, toggleActive } = useAdminData(storageKey, seedData);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [reimporting, setReimporting] = useState(false);
  const formRef = useRef(null);
  const [aiModal, setAiModal] = useState({ open: false, label: "", prompt: "" });
  const [copied, setCopied] = useState(false);

  const handleReimport = async () => {
    if (!window.confirm(`Re-import all ${seedData.length} items from seed data? This will add any missing items to Supabase.`)) {
      return;
    }

    setReimporting(true);
    try {
      const token = localStorage.getItem('gt_admin_token');
      const response = await fetch('http://localhost:10000/api/admin-tools/reimport-seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          storageKey,
          seedData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Re-import complete!\n\nImported: ${result.data.imported}\nUpdated: ${result.data.updated}\nFailed: ${result.data.failed}\n\nRefreshing page...`);
        window.location.reload();
      } else {
        alert(`❌ Re-import failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Re-import error: ${error.message}`);
    } finally {
      setReimporting(false);
    }
  };

  const openAiPrompt = (f) => {
    const prompt = f.aiPrompt(form);
    setAiModal({ open: true, label: f.label, prompt });
    setCopied(false);
  };
  const copyPrompt = () => {
    navigator.clipboard.writeText(aiModal.prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const openCreate = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({ ...defaultForm, ...item });
    setEditId(item.id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const preparedForm = transformForm ? transformForm(form, { editId }) : form;
    let savedItem;
    if (editId) {
      savedItem = update(editId, preparedForm);
      logActivity({
        action: `${title.toUpperCase().replace(/\s+/g, "_")}_UPDATED`,
        actionLabel: `Updated ${title}: ${preparedForm.name || preparedForm.title || editId}`,
        details: `ID: ${editId}`,
        module: title,
        severity: "info",
      });
    } else {
      savedItem = add(preparedForm);
      logActivity({
        action: `${title.toUpperCase().replace(/\s+/g, "_")}_ADDED`,
        actionLabel: `Added new ${title}: ${preparedForm.name || preparedForm.title || "-"}`,
        details: `Name: ${preparedForm.name || preparedForm.title || "-"}`,
        module: title,
        severity: "info",
      });
    }
    afterSubmit?.(savedItem, { editId });
    handleCancel();
  };

  const handleDelete = (id) => {
    const item = data.find((d) => d.id === id);
    if (window.confirm("Delete this item?")) {
      logActivity({
        action: `${title.toUpperCase().replace(/\s+/g, "_")}_DELETED`,
        actionLabel: `Deleted ${title}: ${item?.name || item?.title || id}`,
        details: `ID: ${id}`,
        module: title,
        severity: "warning",
      });
      remove(id);
    }
  };

  const filtered = data.filter((d) => Object.values(d).some((v) => String(v).toLowerCase().includes(search.toLowerCase())));
  const previewFields = fields.slice(0, 3);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">{icon} {title}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {seedData.length > 0 && (
            <button 
              className="btn btn-outline-primary btn-sm px-3" 
              onClick={handleReimport}
              disabled={reimporting}
              title={`Re-import all ${seedData.length} items from seed data`}
            >
              {reimporting ? '⏳ Re-importing...' : '🔄 Re-import Seed Data'}
            </button>
          )}
          <button className="btn btn-success btn-sm px-3" onClick={openCreate}>+ Add New</button>
        </div>
      </div>

      {showForm && (
        <div className="adm-form-card" ref={formRef}>
          <h5 className="mb-4 fw-bold">{editId ? `Edit ${title}` : `Add New ${title}`}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {fields.map((f) => (
                <div className={`col-md-${f.col || 6}`} key={f.key}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <label className="form-label small fw-semibold mb-0">
                      {f.label}
                      {f.required && <span className="text-danger ms-1">*</span>}
                    </label>
                    {f.aiPrompt && (
                      <button type="button" className="btn btn-sm py-0 px-2" style={{ fontSize: "0.7rem", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", borderRadius: 6, lineHeight: 1.6 }} onClick={() => openAiPrompt(f)}>
                        ✨ AI Prompt
                      </button>
                    )}
                  </div>

                  {f.type === "select" ? (
                    <select className="form-select form-select-sm" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required}>
                      <option value="">- Select {f.label} -</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea className="form-control form-control-sm" rows={3} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder || ""} required={f.required} />
                  ) : f.type === "pickups" ? (
                    <PickupPointsField value={form[f.key] ?? "{}"} onChange={(val) => setForm({ ...form, [f.key]: val })} cities={f.cities || []} />
                  ) : f.type === "trekDates" ? (
                    <TrekDatesField value={form[f.key] ?? "[]"} onChange={(val) => setForm({ ...form, [f.key]: val })} />
                  ) : f.type === "departurePlans" ? (
                    <DeparturePlansField value={form[f.key] ?? "{}"} onChange={(val) => setForm({ ...form, [f.key]: val })} cityOptions={f.cityOptions || []} />
                  ) : f.type === "checklistTextarea" ? (
                    <ChecklistTextareaField value={form[f.key] ?? ""} onChange={(val) => setForm({ ...form, [f.key]: val })} options={f.options || []} manualPlaceholder={f.placeholder || ""} />
                  ) : f.type === "discountCodes" ? (
                    <DiscountCodesField
                      value={form[f.key] ?? ""}
                      onChange={(val) => setForm({ ...form, [f.key]: val })}
                      enabled={!!form[f.toggleKey]}
                      onToggle={(checked) => setForm({ ...form, [f.toggleKey]: checked })}
                      options={f.options || []}
                    />
                  ) : f.type === "imageGallery" ? (
                    <ImageGalleryField value={form[f.key] ?? "[]"} onChange={(val) => setForm({ ...form, [f.key]: val })} />
                  ) : (
                    <input type={f.type || "text"} className="form-control form-control-sm" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder || ""} required={f.required} />
                  )}
                  {f.helpText && (
                    <div style={{ fontSize: "0.71rem", color: "#6c757d", marginTop: 6, lineHeight: 1.55, background: "#f8f9fa", padding: "8px 12px", borderRadius: 6, borderLeft: "3px solid #adb5bd", whiteSpace: "pre-line" }}>
                      {f.helpText}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-success btn-sm px-4">{editId ? "Update" : "Save Listing"}</button>
              {onPreview && <button type="button" className="btn btn-outline-primary btn-sm px-4" onClick={() => onPreview(form)}>Preview</button>}
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {data.length > 0 && (
        <div className="adm-search-row">
          <input className="form-control form-control-sm adm-search" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="adm-count-badge">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {data.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">{icon}</div>
          <p className="adm-empty-text">No {title.toLowerCase()} yet.</p>
          <button className="btn btn-success btn-sm" onClick={openCreate}>+ Add First {title}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          <p className="adm-empty-text">No results for "{search}"</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="table table-hover adm-table mb-0">
            <thead>
              <tr>
                {previewFields.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: onPreview ? 180 : 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  {previewFields.map((f) => (
                    <td key={f.key} className="text-truncate" style={{ maxWidth: 200 }}>
                      {f.key === "image" ? (
                        <img src={item[f.key]} alt="" className="adm-thumb" onError={(e) => (e.target.style.display = "none")} />
                      ) : f.type === "pickups" ? (
                        (() => {
                          try {
                            const pts = JSON.parse(item[f.key] || "{}");
                            const cities = Object.keys(pts);
                            return cities.length ? cities.join(", ") : "-";
                          } catch {
                            return "-";
                          }
                        })()
                      ) : (
                        item[f.key] || "-"
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      className={`adm-toggle-btn ${item.active !== false ? "adm-toggle-on" : "adm-toggle-off"}`}
                      onClick={() => {
                        const nextState = item.active === false ? "Live" : "Offline";
                        logActivity({
                          action: `${title.toUpperCase().replace(/\s+/g, "_")}_STATUS_CHANGED`,
                          actionLabel: `Marked ${title} ${nextState}: ${item.name || item.title || item.id}`,
                          details: `ID: ${item.id} -> ${nextState}`,
                          module: title,
                          severity: "info",
                        });
                        toggleActive(item.id);
                      }}
                      title={item.active !== false ? "Click to take offline" : "Click to go live"}
                    >
                      {item.active !== false ? "Live" : "Off"}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEdit(item)}>Edit</button>
                    {onPreview && (
                      <button className="btn btn-outline-success btn-sm me-1" onClick={() => onPreview(item)}>Preview</button>
                    )}
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ── AI Prompt Modal ── */}
      {aiModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, maxWidth: 680, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed" }}>✨ AI Prompt</span>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: 2 }}>{aiModal.label}</div>
              </div>
              <button type="button" className="btn-close" onClick={() => setAiModal({ open: false, label: "", prompt: "" })} />
            </div>
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 10 }}>Copy this prompt and paste it into ChatGPT or Claude to generate content for this field.</p>
              <pre style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: 16, fontSize: "0.82rem", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#1e1b4b", lineHeight: 1.7 }}>{aiModal.prompt}</pre>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAiModal({ open: false, label: "", prompt: "" })}>Close</button>
              <button type="button" className="btn btn-sm px-4" style={{ background: copied ? "#059669" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 6 }} onClick={copyPrompt}>
                {copied ? "✓ Copied!" : "📋 Copy Prompt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePage;
