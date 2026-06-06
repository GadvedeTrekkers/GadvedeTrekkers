import { useEffect, useMemo, useState } from "react";
import { useEnquiries } from "../hooks/useEnquiries";
import DownloadButton from "../components/DownloadButton";
import {
  archiveEnquiry,
  ENQUIRY_STATUS,
  ENQUIRY_TAGS,
  getAssignableSalesPeople,
  getEnquiryInsights,
  setEnquiryAssignment,
  setEnquiryStatus,
  setEnquiryTags,
  syncEnquiriesWithBookings,
} from "../data/enquiryStorage";
import {
  buildSalesFollowUpWhatsAppMessage,
  DEFAULT_SALES_SMS,
  openSmsWithMessage,
} from "../utils/leadActions";
import { canAssignEnquiries } from "../utils/roleHelpers";

const STATUS_COLUMNS = [
  { key: ENQUIRY_STATUS.NEW_LEAD, label: "New Lead", color: "#d97706", bg: "#fff7ed" },
  { key: ENQUIRY_STATUS.CONTACTED, label: "Contacted", color: "#2563eb", bg: "#eff6ff" },
  { key: ENQUIRY_STATUS.QUOTED, label: "Quoted", color: "#7c3aed", bg: "#f5f3ff" },
  { key: ENQUIRY_STATUS.CONVERTED, label: "Converted", color: "#16a34a", bg: "#f0fdf4" },
  { key: ENQUIRY_STATUS.LOST, label: "Lost", color: "#dc2626", bg: "#fef2f2" },
];

const HIGH_INTENT_TAG = "High Intent";

function formatStatus(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDuration(ms = 0) {
  if (!ms) return "—";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function EnquiryBoard({ items, expanded, setExpanded, onStatusDrop, onStatusUpdate, onArchive, onTagToggle, onAssign, onCall, onWhatsApp, onEmail, onContact, salesPeople, showStatusControls = true, showAssignControls = true }) {
  const columns = STATUS_COLUMNS.map((status) => ({
    ...status,
    items: items.filter((item) => item.status === status.key),
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
        gap: 16,
        alignItems: "start",
        overflowX: "auto",
      }}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropId = event.dataTransfer.getData("text/plain");
            if (!dropId) return;
            onStatusDrop(dropId, column.key);
          }}
          style={{
            background: column.bg,
            border: `1px solid ${column.color}30`,
            borderRadius: 18,
            padding: 14,
            minHeight: 520,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, color: column.color, fontSize: 14 }}>{column.label}</div>
            <span style={{ background: "#fff", color: column.color, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>
              {column.items.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {column.items.length === 0 ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: "22px 12px", textAlign: "center", color: "#94a3b8", fontSize: 12, background: "rgba(255,255,255,0.55)" }}>
                Drop enquiry here
              </div>
            ) : (
              column.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.06)", padding: 14, cursor: "grab" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.phone}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.location || "Unknown location"}</div>
                    </div>
                    <span style={{ background: `${column.color}15`, color: column.color, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#334155", marginBottom: 6 }}>
                    <strong>Package:</strong> {item.eventName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {item.category || "General"} · PAX {item.pax || "—"}
                  </div>

                  {item.assignedSalesName && (
                    <div style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 8 }}>
                      <strong>Sales:</strong> {item.assignedSalesName}
                    </div>
                  )}

                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    <strong style={{ color: "#0f172a" }}>Booked:</strong>{" "}
                    {item.bookedEventName ? (
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>{item.bookedEventName}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not booked</span>
                    )}
                  </div>

                  {(item.tags || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {(item.tags || []).map((tag) => (
                        <span key={tag} style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#92400e" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-1 flex-wrap">
                    <button className="btn btn-outline-primary btn-sm py-0 px-2" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                      {expanded === item.id ? "Hide" : "View"}
                    </button>
                    <button className="btn btn-outline-success btn-sm py-0 px-2" onClick={() => onWhatsApp(item)}>WhatsApp</button>
                    <button className="btn btn-outline-dark btn-sm py-0 px-2" onClick={() => onContact(item)}>SMS</button>
                    <button className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => onArchive(item.id)}>Archive</button>
                  </div>

                  {expanded === item.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <div className="adm-detail-grid">
                        <div><span>Contact</span><strong>{item.phone || "—"}</strong></div>
                        <div><span>Email</span><strong>{item.email || "—"}</strong></div>
                        <div><span>Date</span><strong>{item.date || "Flexible"}</strong></div>
                        <div><span>Page</span><strong>{item.pageKey || item.pageUrl || "—"}</strong></div>
                        <div><span>First Response</span><strong>{item.firstResponseAt ? new Date(item.firstResponseAt).toLocaleString("en-IN") : "Not responded"}</strong></div>
                        <div><span>Customer ID</span><strong style={{ fontFamily: "monospace", fontSize: 11 }}>{item.customerId || "—"}</strong></div>
                      </div>

                      <div className="mt-3">
                        <strong style={{ fontSize: 13 }}>Quick Actions</strong>
                        <div className="adm-traveler-list mt-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onCall(item.phone)}>Call</button>
                          <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onWhatsApp(item)}>WhatsApp</button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEmail(item)} disabled={!item.email}>Email</button>
                          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onContact(item)}>Contact SMS</button>
                        </div>
                      </div>

                      {showStatusControls && (
                        <div className="mt-3">
                          <strong style={{ fontSize: 13 }}>Move Status</strong>
                          <div className="adm-traveler-list mt-2">
                            {STATUS_COLUMNS.map((status) => (
                              <button
                                key={status.key}
                                type="button"
                                className={`btn btn-sm ${item.status === status.key ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => onStatusUpdate(item.id, status.key)}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <strong style={{ fontSize: 13 }}>High Intent</strong>
                        <div className="adm-traveler-list mt-2">
                          {ENQUIRY_TAGS.map((tag) => {
                            const active = (item.tags || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                className={`btn btn-sm ${active ? "btn-warning" : "btn-outline-secondary"}`}
                                onClick={() => onTagToggle(item, tag)}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {showAssignControls && (
                        <div className="mt-3">
                          <strong style={{ fontSize: 13 }}>Assign Sales</strong>
                          <div className="mt-2">
                            <select
                              className="form-select form-select-sm"
                              value={item.assignedSalesEmployeeId || ""}
                              onChange={(event) => {
                                const employeeId = event.target.value;
                                const assignee = salesPeople.find((person) => person.employeeId === employeeId) || {};
                                onAssign(item.id, assignee);
                              }}
                            >
                              <option value="">Unassigned</option>
                              {salesPeople.map((person) => (
                                <option value={person.employeeId} key={person.employeeId}>
                                  {person.fullName} ({person.username})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManageEnquiries() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [salesFilter, setSalesFilter] = useState("");

  const { enquiries, loading, refresh, currentUser, seeAll } = useEnquiries({ limit: 500 });

  // Management / Super Admin can filter by sales person; Sales users cannot.
  const canAssign = canAssignEnquiries(currentUser.role);

  useEffect(() => { syncEnquiriesWithBookings(); }, []);

  const insights    = useMemo(() => getEnquiryInsights(enquiries), [enquiries]);
  const salesPeople = useMemo(() => getAssignableSalesPeople(), []);

  const filtered = enquiries.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.phone?.includes(q) ||
      item.eventName?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.bookedEventName?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q);

    // The salesFilter dropdown is only rendered for Management/Super Admin.
    // Sales users' records are already pre-scoped by the API — no extra filter needed.
    const matchesSales = !seeAll || !salesFilter || item.assignedSalesEmployeeId === salesFilter;

    return matchesSearch && matchesSales;
  });

  const highIntentItems = filtered.filter((item) => (item.tags || []).includes(HIGH_INTENT_TAG));

  const updateStatus = (id, status) => {
    setEnquiryStatus(id, status);
    refresh();
  };

  const toggleTag = (enquiry, tag) => {
    const currentTags = Array.isArray(enquiry.tags) ? enquiry.tags : [];
    const nextTags = currentTags.includes(tag)
      ? currentTags.filter((item) => item !== tag)
      : [...currentTags, tag];
    setEnquiryTags(enquiry.id, nextTags);
    refresh();
  };

  const assignSales = (id, assignee) => {
    setEnquiryAssignment(id, assignee);
    refresh();
  };

  const removeItem = (id) => {
    if (!window.confirm("Archive this enquiry? It will stay stored in CRM and customers.")) return;
    archiveEnquiry(id);
    refresh();
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  };

  const handleEmail = (item) => {
    if (!item.email) return;
    const subject = encodeURIComponent(`Regarding your enquiry for ${item.eventName || "Gadvede Trekkers"}`);
    const body = encodeURIComponent(`Hi ${item.name || ""},\n\nThank you for your enquiry for ${item.eventName || "our event"}.\nWe are sharing the details with you shortly.\n\nRegards,\nGadvede Trekkers`);
    window.open(`mailto:${item.email}?subject=${subject}&body=${body}`, "_self");
  };

  const handleWhatsApp = (item) => {
    if (!item.phone) return;
    const message = buildSalesFollowUpWhatsAppMessage({
      eventName: item.eventName,
      location: item.location || item.eventName?.split("–")[0]?.trim() || item.eventName || "Pune/Mumbai",
      category: item.category || "Enquiry",
      customerName: item.name,
    });
    window.open(`https://wa.me/91${item.phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleContact = (item) => {
    if (!item.phone) return;
    openSmsWithMessage(item.phone, DEFAULT_SALES_SMS);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">📬 Enquiries Pipeline</h3>
        <div className="d-flex align-items-center gap-2">
          <span className="adm-count-badge">{filtered.length} total</span>
          <DownloadButton
            getData={() =>
              filtered.map((item) => ({
                id: item.id,
                createdAt: new Date(item.createdAt).toLocaleString("en-IN"),
                status: formatStatus(item.status),
                name: item.name,
                phone: item.phone,
                email: item.email || "",
                location: item.location || "",
                page: item.pageKey || item.pageUrl || "",
                event: item.eventName,
                category: item.category,
                pax: item.pax,
                assignedSales: item.assignedSalesName || "",
                tags: (item.tags || []).join(", "),
                bookedEvent: item.bookedEventName || "",
              }))
            }
            filename="enquiries-pipeline"
            title="Enquiries Pipeline — Gadvede Trekkers"
          />
        </div>
      </div>

      {loading && <div className="text-muted small mb-2">Loading enquiries…</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="adm-form-card h-100"><div className="text-muted small">Top Lead Location</div><div className="fw-bold mt-1">{insights.topLocation.label}</div><div className="small text-success">{insights.topLocation.count} leads</div></div></div>
        <div className="col-md-3"><div className="adm-form-card h-100"><div className="text-muted small">Best Converting Page</div><div className="fw-bold mt-1">{insights.bestPage.page}</div><div className="small text-primary">{insights.bestPage.rate.toFixed(1)}% conversion</div></div></div>
        <div className="col-md-3"><div className="adm-form-card h-100"><div className="text-muted small">Avg Time To Response</div><div className="fw-bold mt-1">{formatDuration(insights.avgResponseMs)}</div><div className="small text-secondary">from new lead to first action</div></div></div>
        <div className="col-md-3"><div className="adm-form-card h-100"><div className="text-muted small">Conversion %</div><div className="fw-bold mt-1">{insights.conversionRate.toFixed(1)}%</div><div className="small text-success">{insights.converted}/{insights.total} converted</div></div></div>
      </div>

      <div className="adm-filter-bar">
        <input
          className="form-control form-control-sm"
          placeholder="Search by customer, phone, package, location, booked event…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />

        {/* Sales-owner dropdown — Management/Super Admin only */}
        {seeAll && (
          <select
            className="form-select form-select-sm"
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          >
            <option value="">All Sales Owners</option>
            {salesPeople.map((person) => (
              <option value={person.employeeId} key={person.employeeId}>
                {person.fullName}
              </option>
            ))}
          </select>
        )}

        {/* Scope pill — visible to Sales users so they know the view is filtered */}
        {!seeAll && (
          <span style={{
            padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
            whiteSpace: "nowrap",
          }}>
            👤 My enquiries only
          </span>
        )}
      </div>

      <div className="adm-form-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="fw-bold">🔥 High Intent Leads</div>
            <div className="text-muted small">Tag priority leads here so the team can spot them instantly.</div>
          </div>
          <span className="adm-count-badge">{highIntentItems.length} tagged</span>
        </div>

        {highIntentItems.length === 0 ? (
          <div className="text-muted small">No high intent leads tagged yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {highIntentItems.map((item) => (
              <div key={item.id} style={{ border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 14, padding: 14 }}>
                <div className="fw-bold">{item.name}</div>
                <div className="small text-muted mb-2">{item.eventName}</div>
                <div className="small mb-2">Sales: {item.assignedSalesName || "Unassigned"}</div>
                <div className="d-flex gap-1 flex-wrap">
                  <button className="btn btn-outline-primary btn-sm py-0 px-2" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>View</button>
                  <button className="btn btn-outline-success btn-sm py-0 px-2" onClick={() => handleWhatsApp(item)}>WhatsApp</button>
                  <button className="btn btn-outline-warning btn-sm py-0 px-2" onClick={() => toggleTag(item, HIGH_INTENT_TAG)}>Remove Tag</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EnquiryBoard
        items={filtered}
        expanded={expanded}
        setExpanded={setExpanded}
        onStatusDrop={updateStatus}
        onStatusUpdate={updateStatus}
        onArchive={removeItem}
        onTagToggle={toggleTag}
        onAssign={assignSales}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onEmail={handleEmail}
        onContact={handleContact}
        salesPeople={salesPeople}
        showAssignControls={canAssign}
      />
    </div>
  );
}
