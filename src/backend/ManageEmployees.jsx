import { useState, useMemo } from "react";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmModal";
import {
  getAllEmployees, saveEmployee, deleteEmployee, queryEmployees,
  getAllAssignments, saveAssignment, deleteAssignment,
  getAllExpenses, submitExpense, updateExpenseStatus, deleteExpense, queryExpenses,
  getAvailabilityMap, setEmployeeAvailability, getEmployeeAvailability,
} from "../data/employeeStorage";
import DownloadButton from "../components/DownloadButton";
import { logActivity } from "../data/activityLogStorage";
import { getUserPermissions, togglePermission, ALL_PERMISSIONS, currentUserHasPermission } from "../data/permissionStorage";
import { submitRateApproval, getPendingApprovals, approveRateRequest, rejectRateRequest, hasPendingRequest } from "../data/rateApprovalStorage";
import { getWhatsAppLinkForDate } from "../data/trekDatesStorage";
import { slugifyTrekName } from "../utils/slugify";
import { getErrorMessage } from "../utils/errorMessage";

/* ─── constants ─── */
const ROLES      = ["Trek Leader", "Coordinator", "Support Staff", "Guide", "Instructor"];
const EXPERTISE  = ["Trek Leader", "Coordinator", "Guide", "Instructor", "Photographer"];
const EVENT_TYPES= ["Trek", "Tour", "Camping", "College IV", "Heritage Walk"];
const EXP_TYPES  = ["Travel", "Food", "Stay", "Miscellaneous"];
const EXP_STATUS = ["Submitted", "Under Review", "Approved", "Rejected"];
const SKILLS_LIST= ["Trek Leadership","First Aid","Navigation","Rock Climbing","Photography",
  "Coordination","Customer Service","Event Planning","Camp Setup","Yoga","Fitness Training",
  "Logistics","Vehicle Management","Budget Tracking","Documentation","Nutrition"];

/* ─── helpers ─── */
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

function StatusBadge({ status }) {
  const map = {
    "active":       "emp-badge emp-badge--active",
    "inactive":     "emp-badge emp-badge--inactive",
    "Submitted":    "emp-badge emp-badge--submitted",
    "Under Review": "emp-badge emp-badge--review",
    "Approved":     "emp-badge emp-badge--approved",
    "Rejected":     "emp-badge emp-badge--rejected",
    "Paid":         "emp-badge emp-badge--paid",
    "Pending":      "emp-badge emp-badge--pending",
  };
  return <span className={map[status] || "emp-badge"}>{status}</span>;
}

/* ═══════════════════════════════════════════════════════
   EMPLOYEE FORM
═══════════════════════════════════════════════════════ */
const EMPTY_EMP = {
  fullName:"", contactNumber:"", email:"", address:"",
  skills:[], certifications:[], experience:{ years:"", description:"" },
  expertise:"Trek Leader", linkedin:"", instagram:"",
  role:"Trek Leader", status:"active", profilePhoto:"", payPerTrek:"",
};

function EmployeeForm({ initial, onSave, onCancel }) {
  const toast = useToast();
  const [f, setF] = useState(initial || EMPTY_EMP);
  const [skillInput, setSkillInput] = useState("");
  const [certInput,  setCertInput]  = useState({ name:"", details:"" });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setExp = (k, v) => setF(p => ({ ...p, experience: { ...p.experience, [k]: v } }));

  const toggleSkill = (s) => {
    const cur = f.skills || [];
    set("skills", cur.includes(s) ? cur.filter(x=>x!==s) : [...cur, s]);
  };
  const addCustomSkill = () => {
    if (!skillInput.trim()) return;
    set("skills", [...(f.skills||[]), skillInput.trim()]);
    setSkillInput("");
  };
  const addCert = () => {
    if (!certInput.name.trim()) return;
    set("certifications", [...(f.certifications||[]), { ...certInput }]);
    setCertInput({ name:"", details:"" });
  };
  const removeCert = (i) => set("certifications", f.certifications.filter((_,idx)=>idx!==i));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("profilePhoto", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="emp-form-card">
      <div className="emp-form-grid">
        {/* Photo */}
        <div className="emp-form-photo-col">
          <div className="emp-photo-preview">
            {f.profilePhoto
              ? <img src={f.profilePhoto} alt="Profile" />
              : <span>👤</span>}
          </div>
          <label className="btn btn-outline-secondary btn-sm mt-2" style={{fontSize:12}}>
            Upload Photo <input type="file" accept="image/*" hidden onChange={handlePhoto} />
          </label>
        </div>

        {/* Main fields */}
        <div className="emp-form-main">
          <div className="row g-2">
            <div className="col-md-6">
              <label className="emp-label">Full Name *</label>
              <input className="form-control form-control-sm" value={f.fullName} onChange={e=>set("fullName",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">Contact Number</label>
              <input className="form-control form-control-sm" value={f.contactNumber} onChange={e=>set("contactNumber",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">Email</label>
              <input type="email" className="form-control form-control-sm" value={f.email} onChange={e=>set("email",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">Address</label>
              <input className="form-control form-control-sm" value={f.address} onChange={e=>set("address",e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="emp-label">Role</label>
              <select className="form-select form-select-sm" value={f.role} onChange={e=>set("role",e.target.value)}>
                {ROLES.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="emp-label">Expertise</label>
              <select className="form-select form-select-sm" value={f.expertise} onChange={e=>set("expertise",e.target.value)}>
                {EXPERTISE.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="emp-label">Status</label>
              <select className="form-select form-select-sm" value={f.status} onChange={e=>set("status",e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {f.role === "Trek Leader" && (
              <div className="col-md-4">
                <label className="emp-label">
                  Pay per Trek (₹)
                  {!currentUserHasPermission("trek_allocation") && <span style={{color:"#ef4444", fontSize:10, marginLeft:4}}>🔒 Pratik/Akshay only</span>}
                </label>
                <input
                  type="number" min="0"
                  className="form-control form-control-sm"
                  value={f.payPerTrek || ""}
                  onChange={e=>set("payPerTrek", e.target.value)}
                  placeholder="e.g. 2000"
                  disabled={!currentUserHasPermission("trek_allocation")}
                />
                {f.employeeId && hasPendingRequest(f.employeeId, "payPerTrek") && (
                  <small style={{color:"#f59e0b", fontSize:10}}>⏳ Approval pending</small>
                )}
              </div>
            )}
            <div className="col-md-6">
              <label className="emp-label">Experience (years)</label>
              <input type="number" min="0" className="form-control form-control-sm" value={f.experience.years} onChange={e=>setExp("years",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">Experience Description</label>
              <input className="form-control form-control-sm" value={f.experience.description} onChange={e=>setExp("description",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">LinkedIn</label>
              <input className="form-control form-control-sm" placeholder="https://linkedin.com/in/..." value={f.linkedin} onChange={e=>set("linkedin",e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="emp-label">Instagram</label>
              <input className="form-control form-control-sm" placeholder="https://instagram.com/..." value={f.instagram} onChange={e=>set("instagram",e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="emp-section-label mt-3">🎯 Skills</div>
      <div className="emp-skill-grid">
        {SKILLS_LIST.map(s=>(
          <button key={s} type="button"
            className={`emp-skill-chip ${(f.skills||[]).includes(s) ? "emp-skill-chip--active" : ""}`}
            onClick={()=>toggleSkill(s)}
          >{s}</button>
        ))}
      </div>
      <div className="d-flex gap-2 mt-2">
        <input className="form-control form-control-sm" placeholder="Add custom skill…" value={skillInput} onChange={e=>setSkillInput(e.target.value)} style={{maxWidth:200}} />
        <button className="btn btn-outline-success btn-sm" onClick={addCustomSkill}>+ Add</button>
      </div>
      {(f.skills||[]).filter(s=>!SKILLS_LIST.includes(s)).map((s,i)=>(
        <span key={i} className="emp-skill-chip emp-skill-chip--active ms-1 mt-1">{s}
          <span className="ms-1" style={{cursor:"pointer"}} onClick={()=>set("skills",(f.skills||[]).filter(x=>x!==s))}>×</span>
        </span>
      ))}

      {/* Certifications */}
      <div className="emp-section-label mt-3">🏅 Certifications</div>
      <div className="d-flex gap-2 align-items-end flex-wrap mb-2">
        <div>
          <label className="emp-label">Cert Name</label>
          <input className="form-control form-control-sm" style={{minWidth:160}} value={certInput.name} onChange={e=>setCertInput(p=>({...p,name:e.target.value}))} />
        </div>
        <div>
          <label className="emp-label">Details</label>
          <input className="form-control form-control-sm" style={{minWidth:200}} value={certInput.details} onChange={e=>setCertInput(p=>({...p,details:e.target.value}))} />
        </div>
        <button className="btn btn-outline-success btn-sm" onClick={addCert}>+ Add</button>
      </div>
      {(f.certifications||[]).map((c,i)=>(
        <div key={i} className="emp-cert-row">
          <span>🏅 <strong>{c.name}</strong> — {c.details}</span>
          <button className="btn btn-link btn-sm text-danger p-0 ms-2" onClick={()=>removeCert(i)}>Remove</button>
        </div>
      ))}

      <div className="d-flex gap-2 mt-4">
        <button className="btn btn-success btn-sm" onClick={()=>{ if(!f.fullName.trim()){toast.error("Full name is required.");return;} onSave(f); }}>
          {initial?.employeeId ? "Update Employee" : "Add Employee"}
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EMPLOYEES TAB
═══════════════════════════════════════════════════════ */
function EmployeesTab({ tick, onTick }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [search,   setSearch]   = useState("");
  const [roleF,    setRoleF]    = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [expanded, setExpanded] = useState(null);

  const list = queryEmployees({ search: search||undefined, role: roleF||undefined, status: statusF||undefined });

  const handleSave = (emp) => {
    const hasVendorPayments = currentUserHasPermission("vendor_payments");
    if (emp.payPerTrek && !hasVendorPayments) {
      const existingEmp = getAllEmployees().find(e => e.employeeId === emp.employeeId);
      const empToSave = { ...emp, payPerTrek: existingEmp?.payPerTrek || "" };
      try {
        const savedEmp = saveEmployee(empToSave);
        submitRateApproval({
          type: "employee",
          targetId: savedEmp?.employeeId || emp.employeeId || empToSave.employeeId,
          targetName: emp.fullName,
          field: "payPerTrek",
          proposedAmount: emp.payPerTrek,
          currentAmount: existingEmp?.payPerTrek || 0,
        });
        toast.info("Pay per trek submitted for Rohit's approval.");
      } catch (error) {
        toast.error(getErrorMessage(error, "Employee rate request could not be submitted."));
        return;
      }
    } else {
      try {
        saveEmployee(emp);
      } catch (error) {
        toast.error(getErrorMessage(error, "Employee could not be saved."));
        return;
      }
    }
    setShowForm(false); setEditing(null); onTick();
    toast.success(editing ? "Employee updated successfully." : "Employee added successfully.");
  };

  const pendingEmpApprovals = getPendingApprovals().filter(a => a.type === "employee");
  const hasVendorPaymentsForBanner = currentUserHasPermission("vendor_payments");

  return (
    <div>
      {/* ── Rate Approvals Banner ── */}
      {pendingEmpApprovals.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e", marginBottom: 10 }}>
            🔔 Pending Rate Approvals ({pendingEmpApprovals.length})
          </div>
          {pendingEmpApprovals.map(approval => (
            <div key={approval.id} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{approval.targetName}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Proposed: <strong style={{ color: "#1e293b" }}>₹{Number(approval.proposedAmount).toLocaleString("en-IN")}/trek</strong>
                  {" · "}Current: ₹{Number(approval.currentAmount || 0).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  By {approval.proposedBy} · {new Date(approval.proposedAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              {hasVendorPaymentsForBanner ? (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success btn-sm py-0 px-2" style={{ fontSize: 12 }}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Approve Pay Request?",
                        message: `Approve the trek pay change for ${approval.targetName}?`,
                        confirmText: "Approve",
                        type: "success",
                      });
                      if (!ok) return;
                      const existingEmp = getAllEmployees().find(e => e.employeeId === approval.targetId);
                      if (!existingEmp) { toast.error("Employee not found."); return; }
                      approveRateRequest(approval.id);
                      saveEmployee({ ...existingEmp, payPerTrek: approval.proposedAmount });
                      logActivity({
                        action: "RATE_APPROVAL_APPROVED",
                        actionLabel: "Approved Rate Request",
                        details: `Approved payPerTrek ₹${approval.proposedAmount} for ${approval.targetName}`,
                        module: "Employees",
                        severity: "success",
                      });
                      onTick();
                      toast.success("Employee pay request approved.");
                    }}
                  >Approve</button>
                  <button
                    className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: 12 }}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Reject Pay Request?",
                        message: `Reject the trek pay change for ${approval.targetName}?`,
                        confirmText: "Continue",
                        type: "danger",
                      });
                      if (!ok) return;
                      const reason = window.prompt("Reason for rejection:");
                      if (reason === null) return;
                      rejectRateRequest(approval.id, reason);
                      logActivity({
                        action: "RATE_APPROVAL_REJECTED",
                        actionLabel: "Rejected Rate Request",
                        details: `Rejected payPerTrek ₹${approval.proposedAmount} for ${approval.targetName}. Reason: ${reason}`,
                        module: "Employees",
                        severity: "warning",
                      });
                      onTick();
                      toast.warning("Employee pay request rejected.");
                    }}
                  >Reject</button>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Awaiting Rohit's approval</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="adm-page-header">
        <h3 className="adm-page-title">👥 Employees</h3>
        <div className="d-flex gap-2 align-items-center">
          <span className="adm-count-badge">{list.length} employee{list.length!==1?"s":""}</span>
          <DownloadButton
            getData={()=>list.map(e=>({ id:e.employeeId, name:e.fullName, role:e.role, expertise:e.expertise, contact:e.contactNumber, email:e.email, events:e.eventsHandled, rating:e.performanceRating, status:e.status }))}
            filename="employees" title="Employee List — Gadvede Trekkers"
          />
          <button className="btn btn-success btn-sm" onClick={()=>{ setEditing(null); setShowForm(true); }}>+ Add Employee</button>
        </div>
      </div>

      {showForm && (
        <EmployeeForm initial={editing} onSave={handleSave} onCancel={()=>{ setShowForm(false); setEditing(null); }} />
      )}

      <div className="adm-filter-bar">
        <input className="form-control form-control-sm" placeholder="Search name, email, ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:2}} />
        <select className="form-select form-select-sm" value={roleF} onChange={e=>setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <select className="form-select form-select-sm" value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {list.length === 0
        ? <div className="adm-empty"><div className="adm-empty-icon">👥</div><p className="adm-empty-text">No employees found.</p></div>
        : (
          <div className="emp-card-grid">
            {list.map(e=>(
              <div key={e.employeeId} className={`emp-card ${e.status==="inactive"?"emp-card--inactive":""}`}>
                <div className="emp-card-head">
                  <div className="emp-avatar">
                    {e.profilePhoto ? <img src={e.profilePhoto} alt={e.fullName} /> : <span>{e.fullName?.[0]||"?"}</span>}
                  </div>
                  <div className="emp-card-info">
                    <div className="emp-card-name">{e.fullName}</div>
                    <div className="emp-card-role">{e.role}</div>
                    <div className="emp-card-stars" title={`Rating: ${e.performanceRating}`}>{stars(e.performanceRating)}</div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                <div className="emp-card-skills">
                  {(e.skills||[]).slice(0,4).map(s=><span key={s} className="emp-skill-tag">{s}</span>)}
                  {(e.skills||[]).length>4 && <span className="emp-skill-tag">+{e.skills.length-4}</span>}
                </div>

                <div className="emp-card-stats">
                  <div><span>Events</span><strong>{e.eventsHandled||0}</strong></div>
                  <div><span>Exp</span><strong>{e.experience?.years||0}y</strong></div>
                  <div><span>Rating</span><strong>{(e.performanceRating||0).toFixed(1)}</strong></div>
                </div>

                <div className="emp-card-actions">
                  <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{fontSize:11}}
                    onClick={()=>setExpanded(expanded===e.employeeId?null:e.employeeId)}>
                    {expanded===e.employeeId?"Hide":"Details"}
                  </button>
                  <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{fontSize:11}}
                    onClick={()=>{ setEditing(e); setShowForm(true); window.scrollTo(0,0); }}>
                    Edit
                  </button>
                  <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{fontSize:11}}
                    onClick={()=>{ if(window.confirm(`Delete ${e.fullName}?`)){ deleteEmployee(e.employeeId); onTick(); } }}>
                    Delete
                  </button>
                </div>

                {expanded===e.employeeId && (
                  <div className="emp-card-expanded">
                    <div><strong>ID:</strong> <code style={{fontSize:11}}>{e.employeeId}</code></div>
                    <div><strong>Email:</strong> {e.email||"—"}</div>
                    <div><strong>Contact:</strong> {e.contactNumber||"—"}</div>
                    <div><strong>Address:</strong> {e.address||"—"}</div>
                    <div><strong>Expertise:</strong> {e.expertise}</div>
                    <div><strong>Experience:</strong> {e.experience?.years}y — {e.experience?.description}</div>
                    {(e.certifications||[]).length>0 && (
                      <div><strong>Certifications:</strong> {e.certifications.map(c=>c.name).join(", ")}</div>
                    )}
                    {e.linkedin && <div><strong>LinkedIn:</strong> <a href={e.linkedin} target="_blank" rel="noopener noreferrer">{e.linkedin}</a></div>}
                    {e.instagram && <div><strong>Instagram:</strong> <a href={e.instagram} target="_blank" rel="noopener noreferrer">{e.instagram}</a></div>}
                    <div className="mt-2">
                      <strong>All Skills:</strong>
                      <div className="emp-card-skills mt-1">{(e.skills||[]).map(s=><span key={s} className="emp-skill-tag">{s}</span>)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ASSIGNMENTS TAB
═══════════════════════════════════════════════════════ */
const EMPTY_ASGN = {
  eventName:"",
  eventType:"Trek",
  date:"",
  assignedRole:"",
  employeeIds:[],
  notes:"",
  whatsappGroupLink:"",
};

function AssignmentsTab({ tick, onTick }) {
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_ASGN);
  const [editing,  setEditing]  = useState(null);
  const assignments = getAllAssignments();
  const employees   = getAllEmployees();

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleEmp = (id) => setForm(p=>({
    ...p,
    employeeIds: p.employeeIds.includes(id) ? p.employeeIds.filter(x=>x!==id) : [...p.employeeIds, id]
  }));
  const autofillWhatsAppLink = (eventName, date) => {
    const link = getWhatsAppLinkForDate(slugifyTrekName(eventName || ""), date);
    if (link) {
      setForm((current) => ({
        ...current,
        eventName,
        date,
        whatsappGroupLink: current.whatsappGroupLink || link,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      eventName,
      date,
    }));
  };

  const handleSave = () => {
    if (!form.eventName.trim()) { alert("Event name required"); return; }
    if (!form.date)             { alert("Date required"); return; }
    saveAssignment({ ...form, assignmentId: editing?.assignmentId });
    logActivity({
      action: editing ? "ASSIGNMENT_UPDATED" : "ASSIGNMENT_CREATED",
      actionLabel: editing ? "Updated Assignment" : "Created Assignment",
      details: `${form.eventType}: "${form.eventName}" on ${form.date} — ${form.employeeIds.length} assigned`,
      module: "Assignments",
      severity: "success",
    });
    setShowForm(false); setForm(EMPTY_ASGN); setEditing(null); onTick();
  };

  const startEdit = (a) => {
    setEditing(a); setForm({ ...a }); setShowForm(true); window.scrollTo(0,0);
  };

  return (
    <div>
      <div className="adm-page-header">
        <h3 className="adm-page-title">📅 Assignments</h3>
        <div className="d-flex gap-2 align-items-center">
          <span className="adm-count-badge">{assignments.length}</span>
          <button className="btn btn-success btn-sm" onClick={()=>{ setEditing(null); setForm(EMPTY_ASGN); setShowForm(true); }}>
            + New Assignment
          </button>
        </div>
      </div>

      {showForm && (
        <div className="emp-form-card mb-4">
          <h6 className="mb-3">{editing?"Edit Assignment":"New Assignment"}</h6>
          <div className="row g-2">
            <div className="col-md-5">
              <label className="emp-label">Event Name *</label>
              <input
                className="form-control form-control-sm"
                value={form.eventName}
                onChange={e=>autofillWhatsAppLink(e.target.value, form.date)}
              />
            </div>
            <div className="col-md-3">
              <label className="emp-label">Event Type</label>
              <select className="form-select form-select-sm" value={form.eventType} onChange={e=>set("eventType",e.target.value)}>
                {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="emp-label">Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={form.date}
                onChange={e=>autofillWhatsAppLink(form.eventName, e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="emp-label">Assigned Role</label>
              <input className="form-control form-control-sm" value={form.assignedRole} onChange={e=>set("assignedRole",e.target.value)} />
            </div>
            <div className="col-12">
              <label className="emp-label">Assign Employees (click to toggle)</label>
              <div className="emp-assign-grid">
                {employees.filter(e=>e.status==="active").map(e=>(
                  <button key={e.employeeId} type="button"
                    className={`emp-assign-chip ${form.employeeIds.includes(e.employeeId)?"emp-assign-chip--active":""}`}
                    onClick={()=>toggleEmp(e.employeeId)}
                  >
                    {e.fullName} <span style={{fontSize:10,opacity:0.7}}>({e.role})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="col-12">
              <label className="emp-label">Notes</label>
              <input className="form-control form-control-sm" value={form.notes} onChange={e=>set("notes",e.target.value)} />
            </div>
            <div className="col-12">
              <label className="emp-label">WhatsApp Group Link</label>
              <input
                type="url"
                className="form-control form-control-sm"
                placeholder="https://chat.whatsapp.com/..."
                value={form.whatsappGroupLink || ""}
                onChange={e=>set("whatsappGroupLink", e.target.value)}
              />
              <small style={{ color:"#64748b", fontSize:11 }}>
                If this trek date already has a WhatsApp group link in Trek Dates, it auto-fills here and can still be edited before leader allocation.
              </small>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-success btn-sm" onClick={handleSave}>{editing?"Update":"Save Assignment"}</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={()=>{ setShowForm(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {assignments.length===0
        ? <div className="adm-empty"><div className="adm-empty-icon">📅</div><p className="adm-empty-text">No assignments yet.</p></div>
        : (
          <div className="adm-table-wrap">
            <table className="table table-hover adm-table mb-0">
              <thead>
                <tr>
                  <th>Event</th><th>Type</th><th>Date</th><th>Role</th><th>Employees</th><th>WhatsApp Link</th><th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a=>(
                  <tr key={a.assignmentId}>
                    <td><strong>{a.eventName}</strong></td>
                    <td><span className="emp-type-badge">{a.eventType}</span></td>
                    <td style={{whiteSpace:"nowrap",fontSize:12}}>{a.date}</td>
                    <td style={{fontSize:12}}>{a.assignedRole||"—"}</td>
                    <td>
                      {(a.employeeIds||[]).map(id=>{
                        const emp = employees.find(e=>e.employeeId===id);
                        return emp ? <span key={id} className="emp-skill-tag">{emp.fullName}</span> : null;
                      })}
                      {(a.employeeIds||[]).length===0 && <span style={{color:"#94a3b8",fontSize:12}}>None</span>}
                    </td>
                    <td style={{ fontSize:12, maxWidth:180 }}>
                      {a.whatsappGroupLink
                        ? <a href={a.whatsappGroupLink} target="_blank" rel="noopener noreferrer" style={{ color:"#059669", fontWeight:600, wordBreak:"break-all" }}>
                            Join Group Link
                          </a>
                        : <span style={{color:"#94a3b8"}}>—</span>}
                    </td>
                    <td style={{fontSize:12,maxWidth:160}}>{a.notes||"—"}</td>
                    <td>
                      <button className="btn btn-outline-secondary btn-sm py-0 px-2 me-1" style={{fontSize:11}} onClick={()=>startEdit(a)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{fontSize:11}}
                        onClick={()=>{ if(window.confirm("Delete assignment?")){ deleteAssignment(a.assignmentId); onTick(); } }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPENSES TAB
═══════════════════════════════════════════════════════ */
const EMPTY_EXP = { employeeId:"", employeeName:"", eventName:"", expenseType:"Travel", amount:"", description:"" };

function ExpensesTab({ tick, onTick }) {
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [typeF,    setTypeF]    = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_EXP);
  const [reviewNote, setReviewNote] = useState("");
  const employees = getAllEmployees();

  const list = queryExpenses({ status: statusF||undefined, expenseType: typeF||undefined, search: search||undefined });

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = () => {
    if (!form.employeeId)        { alert("Select employee"); return; }
    if (!form.eventName.trim())  { alert("Event name required"); return; }
    if (!form.amount || isNaN(Number(form.amount))) { alert("Valid amount required"); return; }
    submitExpense({ ...form, amount: Number(form.amount) });
    setShowForm(false); setForm(EMPTY_EXP); onTick();
  };

  const handleStatusChange = (exp, newStatus) => {
    let pStatus = exp.paymentStatus;
    if (newStatus === "Approved" && !pStatus) pStatus = "Pending";
    updateExpenseStatus(exp.expenseId, newStatus, pStatus, reviewNote);
    setReviewNote(""); onTick();
  };

  const handlePayment = (exp, pStatus) => {
    updateExpenseStatus(exp.expenseId, exp.status, pStatus, exp.reviewNote);
    onTick();
  };

  const totals = useMemo(()=>{
    const all = getAllExpenses();
    return {
      total:    all.reduce((s,e)=>s+Number(e.amount||0),0),
      approved: all.filter(e=>e.status==="Approved").reduce((s,e)=>s+Number(e.amount||0),0),
      pending:  all.filter(e=>e.status==="Submitted"||e.status==="Under Review").reduce((s,e)=>s+Number(e.amount||0),0),
      paid:     all.filter(e=>e.paymentStatus==="Paid").reduce((s,e)=>s+Number(e.amount||0),0),
    };
  }, [tick]);

  return (
    <div>
      <div className="adm-page-header">
        <h3 className="adm-page-title">💸 Expenses</h3>
        <div className="d-flex gap-2 align-items-center">
          <DownloadButton
            getData={()=>list.map(e=>({ id:e.expenseId, employee:e.employeeName, event:e.eventName, type:e.expenseType, amount:e.amount, status:e.status, payment:e.paymentStatus||"—", submitted:e.submittedAt?.slice(0,10) }))}
            filename="expenses" title="Expense Report — Gadvede Trekkers"
          />
          <button className="btn btn-success btn-sm" onClick={()=>setShowForm(!showForm)}>+ Submit Expense</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="emp-exp-kpis">
        <div className="emp-exp-kpi"><span>Total Submitted</span><strong>₹{totals.total.toLocaleString("en-IN")}</strong></div>
        <div className="emp-exp-kpi emp-exp-kpi--approved"><span>Approved</span><strong>₹{totals.approved.toLocaleString("en-IN")}</strong></div>
        <div className="emp-exp-kpi emp-exp-kpi--pending"><span>Awaiting Review</span><strong>₹{totals.pending.toLocaleString("en-IN")}</strong></div>
        <div className="emp-exp-kpi emp-exp-kpi--paid"><span>Paid Out</span><strong>₹{totals.paid.toLocaleString("en-IN")}</strong></div>
      </div>

      {showForm && (
        <div className="emp-form-card mb-4">
          <h6 className="mb-3">Submit Expense</h6>
          <div className="row g-2">
            <div className="col-md-4">
              <label className="emp-label">Employee *</label>
              <select className="form-select form-select-sm" value={form.employeeId} onChange={e=>{
                const emp = employees.find(x=>x.employeeId===e.target.value);
                set("employeeId", e.target.value);
                set("employeeName", emp?.fullName||"");
              }}>
                <option value="">— Select Employee —</option>
                {employees.map(e=><option key={e.employeeId} value={e.employeeId}>{e.fullName}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="emp-label">Event / Trek</label>
              <input className="form-control form-control-sm" value={form.eventName} onChange={e=>set("eventName",e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="emp-label">Type</label>
              <select className="form-select form-select-sm" value={form.expenseType} onChange={e=>set("expenseType",e.target.value)}>
                {EXP_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="emp-label">Amount (₹)</label>
              <input type="number" min="0" className="form-control form-control-sm" value={form.amount} onChange={e=>set("amount",e.target.value)} />
            </div>
            <div className="col-12">
              <label className="emp-label">Description</label>
              <input className="form-control form-control-sm" value={form.description} onChange={e=>set("description",e.target.value)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-success btn-sm" onClick={handleSubmit}>Submit</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="adm-filter-bar">
        <input className="form-control form-control-sm" placeholder="Search employee, event, ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:2}} />
        <select className="form-select form-select-sm" value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          {EXP_STATUS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="form-select form-select-sm" value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="">All Types</option>
          {EXP_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {list.length===0
        ? <div className="adm-empty"><div className="adm-empty-icon">💸</div><p className="adm-empty-text">No expense records found.</p></div>
        : (
          <div className="adm-table-wrap">
            <table className="table table-hover adm-table mb-0">
              <thead>
                <tr>
                  <th>ID</th><th>Employee</th><th>Event</th><th>Type</th><th>Amount</th>
                  <th>Status</th><th>Payment</th><th>Date</th><th style={{width:180}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(exp=>(
                  <tr key={exp.expenseId}>
                    <td style={{fontFamily:"monospace",fontSize:11}}>{exp.expenseId}</td>
                    <td style={{fontSize:13}}>{exp.employeeName}</td>
                    <td style={{fontSize:12,maxWidth:130}} className="text-truncate">{exp.eventName}</td>
                    <td><span className="emp-type-badge">{exp.expenseType}</span></td>
                    <td><strong>₹{Number(exp.amount||0).toLocaleString("en-IN")}</strong></td>
                    <td><StatusBadge status={exp.status} /></td>
                    <td>{exp.status==="Approved" ? <StatusBadge status={exp.paymentStatus||"Pending"} /> : <span style={{color:"#94a3b8",fontSize:12}}>—</span>}</td>
                    <td style={{fontSize:11}}>{exp.submittedAt?.slice(0,10)||"—"}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {exp.status==="Submitted" && (
                          <button className="btn btn-outline-warning btn-sm py-0 px-2" style={{fontSize:10}}
                            onClick={()=>handleStatusChange(exp,"Under Review")}>Review</button>
                        )}
                        {(exp.status==="Submitted"||exp.status==="Under Review") && (
                          <>
                            <button className="btn btn-success btn-sm py-0 px-2" style={{fontSize:10}}
                              onClick={()=>handleStatusChange(exp,"Approved")}>✓ Approve</button>
                            <button className="btn btn-danger btn-sm py-0 px-2" style={{fontSize:10}}
                              onClick={()=>{
                                const note = prompt("Rejection reason (optional):", "");
                                if (note !== null) { updateExpenseStatus(exp.expenseId,"Rejected","",note); onTick(); }
                              }}>✕ Reject</button>
                          </>
                        )}
                        {exp.status==="Approved" && exp.paymentStatus==="Pending" && (
                          <button className="btn btn-success btn-sm py-0 px-2" style={{fontSize:10}}
                            onClick={()=>handlePayment(exp,"Paid")}>Mark Paid</button>
                        )}
                        {exp.status==="Rejected" && exp.reviewNote && (
                          <span className="text-danger" style={{fontSize:10}} title={exp.reviewNote}>⚠ {exp.reviewNote.slice(0,20)}…</span>
                        )}
                        <button className="btn btn-outline-danger btn-sm py-0 px-1" style={{fontSize:10}}
                          onClick={()=>{ if(window.confirm("Delete expense?")){ deleteExpense(exp.expenseId); onTick(); } }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AVAILABILITY TAB
═══════════════════════════════════════════════════════ */
function AvailabilityTab({ tick, onTick }) {
  const employees = getAllEmployees().filter(e=>e.status==="active");
  const assignments = getAllAssignments();
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [blockedInput, setBlockedInput] = useState("");
  const [notes, setNotes] = useState("");

  /* next 5 weekends */
  const weekends = useMemo(()=>{
    const res=[]; let d=new Date();
    while(res.length < 10) {
      const day = d.getDay();
      if(day===0||day===6) res.push(d.toISOString().slice(0,10));
      d = new Date(d.getTime()+86400000);
    }
    return res;
  },[]);

  const availMap = getAvailabilityMap();

  const isBlocked = (empId, date) => (availMap[empId]?.blockedDates||[]).includes(date);
  const isAssigned = (empId, date) =>
    assignments.some(a => a.date===date && (a.employeeIds||[]).includes(empId));

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    const avail = availMap[emp.employeeId] || {};
    setBlockedInput((avail.blockedDates||[]).join(", "));
    setNotes(avail.notes||"");
  };

  const saveAvail = () => {
    const dates = blockedInput.split(",").map(d=>d.trim()).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d));
    setEmployeeAvailability(selectedEmp.employeeId, dates, notes);
    setSelectedEmp(null); onTick();
  };

  return (
    <div>
      <div className="adm-page-header">
        <h3 className="adm-page-title">📆 Availability Tracker</h3>
        <span className="adm-count-badge">{employees.length} active</span>
      </div>

      <div className="emp-avail-legend">
        <span><span className="emp-avail-dot emp-avail-dot--available" />Available</span>
        <span><span className="emp-avail-dot emp-avail-dot--assigned" />Assigned</span>
        <span><span className="emp-avail-dot emp-avail-dot--blocked" />Blocked / On Leave</span>
      </div>

      {selectedEmp && (
        <div className="emp-form-card mb-4">
          <h6>Edit Availability — {selectedEmp.fullName}</h6>
          <div className="row g-2">
            <div className="col-md-8">
              <label className="emp-label">Blocked Dates (YYYY-MM-DD, comma separated)</label>
              <input className="form-control form-control-sm" value={blockedInput} onChange={e=>setBlockedInput(e.target.value)} placeholder="2026-04-05, 2026-04-12, …" />
            </div>
            <div className="col-md-4">
              <label className="emp-label">Notes</label>
              <input className="form-control form-control-sm" value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-success btn-sm" onClick={saveAvail}>Save</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setSelectedEmp(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="emp-avail-table-wrap">
        <table className="emp-avail-table">
          <thead>
            <tr>
              <th className="emp-avail-name-col">Employee</th>
              {weekends.map(d=>(
                <th key={d} className={d.endsWith("6")?"emp-avail-sat":"emp-avail-sun"}>
                  {d.slice(5)}<br/><span style={{fontSize:9,fontWeight:400}}>{new Date(d+"T12:00:00").toLocaleDateString("en",{weekday:"short"})}</span>
                </th>
              ))}
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(e=>(
              <tr key={e.employeeId}>
                <td className="emp-avail-name-col">
                  <div style={{fontWeight:600,fontSize:13}}>{e.fullName}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{e.role}</div>
                </td>
                {weekends.map(d=>{
                  const blocked  = isBlocked(e.employeeId, d);
                  const assigned = isAssigned(e.employeeId, d);
                  let cls = "emp-avail-cell emp-avail-cell--available";
                  let lbl = "✓";
                  if (blocked)  { cls="emp-avail-cell emp-avail-cell--blocked";  lbl="✕"; }
                  if (assigned) { cls="emp-avail-cell emp-avail-cell--assigned"; lbl="🏕"; }
                  return <td key={d} className={cls} title={assigned?"Assigned to event":blocked?"Blocked":"Available"}>{lbl}</td>;
                })}
                <td>
                  <button className="btn btn-link btn-sm p-0" style={{fontSize:12}} onClick={()=>openEdit(e)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════════════ */
function DashboardTab({ tick }) {
  const employees   = getAllEmployees();
  const assignments = getAllAssignments();
  const expenses    = getAllExpenses();

  const active   = employees.filter(e=>e.status==="active").length;
  const inactive = employees.filter(e=>e.status==="inactive").length;
  const totalExpense = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const approvedExp  = expenses.filter(e=>e.status==="Approved").reduce((s,e)=>s+Number(e.amount||0),0);
  const paidExp      = expenses.filter(e=>e.paymentStatus==="Paid").reduce((s,e)=>s+Number(e.amount||0),0);

  /* Leader Rankings */
  const leaders = [...employees]
    .filter(e=>e.role==="Trek Leader")
    .sort((a,b)=>(b.performanceRating||0)-(a.performanceRating||0));

  /* Role distribution */
  const roleCounts = ROLES.reduce((acc,r)=>{
    acc[r]=employees.filter(e=>e.role===r).length; return acc;
  },{});

  /* expense by type */
  const expByType = EXP_TYPES.reduce((acc,t)=>{
    acc[t]=expenses.filter(e=>e.expenseType===t).reduce((s,x)=>s+Number(x.amount||0),0); return acc;
  },{});

  const maxExpType = Math.max(...Object.values(expByType),1);

  /* upcoming assignments */
  const today = new Date().toISOString().slice(0,10);
  const upcoming = assignments.filter(a=>a.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);

  return (
    <div>
      <div className="adm-page-header">
        <h3 className="adm-page-title">📊 Employee Dashboard</h3>
      </div>

      {/* KPIs */}
      <div className="emp-dash-kpis">
        <div className="emp-dash-kpi"><div className="emp-dash-kpi-val">{employees.length}</div><div className="emp-dash-kpi-lbl">Total Staff</div></div>
        <div className="emp-dash-kpi emp-dash-kpi--green"><div className="emp-dash-kpi-val">{active}</div><div className="emp-dash-kpi-lbl">Active</div></div>
        <div className="emp-dash-kpi emp-dash-kpi--gray"><div className="emp-dash-kpi-val">{inactive}</div><div className="emp-dash-kpi-lbl">Inactive</div></div>
        <div className="emp-dash-kpi"><div className="emp-dash-kpi-val">{assignments.length}</div><div className="emp-dash-kpi-lbl">Assignments</div></div>
        <div className="emp-dash-kpi emp-dash-kpi--orange"><div className="emp-dash-kpi-val">₹{totalExpense.toLocaleString("en-IN")}</div><div className="emp-dash-kpi-lbl">Total Expenses</div></div>
        <div className="emp-dash-kpi emp-dash-kpi--green"><div className="emp-dash-kpi-val">₹{paidExp.toLocaleString("en-IN")}</div><div className="emp-dash-kpi-lbl">Paid Out</div></div>
      </div>

      <div className="emp-dash-grid">

        {/* Leader Rankings */}
        <div className="emp-dash-card">
          <div className="emp-dash-card-title">🏆 Trek Leader Rankings</div>
          {leaders.length===0
            ? <p style={{color:"#94a3b8",fontSize:13}}>No trek leaders found.</p>
            : leaders.map((l,i)=>(
              <div key={l.employeeId} className="emp-rank-row">
                <span className="emp-rank-num">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                <div className="emp-rank-avatar">
                  {l.profilePhoto ? <img src={l.profilePhoto} alt="" /> : <span>{l.fullName?.[0]}</span>}
                </div>
                <div className="emp-rank-info">
                  <div style={{fontWeight:600,fontSize:13}}>{l.fullName}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{l.eventsHandled||0} events · {l.experience?.years||0}y exp</div>
                </div>
                <div className="emp-rank-stars">{stars(l.performanceRating)}<br/><span style={{fontSize:11}}>{(l.performanceRating||0).toFixed(1)}</span></div>
              </div>
            ))
          }
        </div>

        {/* Role Distribution */}
        <div className="emp-dash-card">
          <div className="emp-dash-card-title">👤 Team Composition</div>
          {ROLES.map(r=>(
            <div key={r} className="emp-role-row">
              <span style={{fontSize:13,minWidth:120}}>{r}</span>
              <div className="emp-role-bar-wrap">
                <div className="emp-role-bar" style={{width:`${(roleCounts[r]||0)/Math.max(employees.length,1)*100}%`}} />
              </div>
              <span style={{fontSize:12,fontWeight:600,minWidth:24,textAlign:"right"}}>{roleCounts[r]||0}</span>
            </div>
          ))}
        </div>

        {/* Expense by Type */}
        <div className="emp-dash-card">
          <div className="emp-dash-card-title">💸 Expenses by Type</div>
          {EXP_TYPES.map(t=>(
            <div key={t} className="emp-role-row">
              <span style={{fontSize:13,minWidth:100}}>{t}</span>
              <div className="emp-role-bar-wrap">
                <div className="emp-role-bar emp-role-bar--orange" style={{width:`${(expByType[t]||0)/maxExpType*100}%`}} />
              </div>
              <span style={{fontSize:12,fontWeight:600,minWidth:60,textAlign:"right"}}>₹{(expByType[t]||0).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>

        {/* Upcoming Assignments */}
        <div className="emp-dash-card">
          <div className="emp-dash-card-title">📅 Upcoming Assignments</div>
          {upcoming.length===0
            ? <p style={{color:"#94a3b8",fontSize:13}}>No upcoming assignments.</p>
            : upcoming.map(a=>(
              <div key={a.assignmentId} className="emp-upcoming-row">
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{a.eventName}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{a.eventType} · {(a.employeeIds||[]).length} assigned</div>
                </div>
                <span className="emp-date-badge">{a.date}</span>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MANAGEMENT TAB
═══════════════════════════════════════════════════════ */
const MANAGEMENT_TEAM = [
  { id: "MGT-001", name: "Pratik Ubhe",     role: "Management", username: "pratik.ubhe",     initials: "PU", color: "#1a9b65" },
  { id: "MGT-002", name: "Rohit Panhalkar", role: "Management", username: "rohit.panhalkar", initials: "RP", color: "#2563eb" },
  { id: "MGT-003", name: "Akshay Kangude",  role: "Management", username: "akshay.kangude",  initials: "AK", color: "#d97706" },
];

function ManagementTab() {
  const [tick, setTick] = useState(0);

  const handleToggle = (username, permission) => {
    togglePermission(username, permission);
    logActivity({
      action: "PERMISSION_CHANGED",
      actionLabel: "Permission Updated",
      details: `Toggled "${ALL_PERMISSIONS[permission]?.label}" for ${username}`,
      module: "Employees",
      severity: "warning",
    });
    setTick(t => t + 1);
  };

  return (
    <div>
      <div className="adm-page-header">
        <h3 className="adm-page-title">🏅 Management Team</h3>
        <span className="adm-count-badge">{MANAGEMENT_TEAM.length} members</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {MANAGEMENT_TEAM.map(m => {
          const perms = getUserPermissions(m.username);
          return (
            <div key={m.id} className="emp-form-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div className="emp-avatar" style={{ background: m.color, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{m.initials}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{m.username} · {m.id}</div>
                </div>
                <span className="emp-badge emp-badge--active">Active</span>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>Login ID</span>
                  <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{m.username}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Password</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 2, color: "#94a3b8" }}>••••••••••••</span>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#1a2e1a" }}>
                Access Permissions
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(ALL_PERMISSIONS).map(([key, perm]) => {
                  const has = perms.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => handleToggle(m.username, key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        border: has ? "2px solid #1a9b65" : "2px solid #e2e8f0",
                        background: has ? "#f0fdf4" : "#f8fafc",
                        color: has ? "#0c6e44" : "#94a3b8",
                      }}
                      title={perm.desc}
                    >
                      <span>{perm.icon}</span>
                      <span>{perm.label}</span>
                      <span style={{ fontSize: 10, marginLeft: 2 }}>{has ? "✓" : "✕"}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
                Click any permission to toggle on/off. Changes take effect on next login.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN  ManageEmployees
═══════════════════════════════════════════════════════ */
const TABS = [
  { id:"management",   icon:"🏅", label:"Management"  },
  { id:"employees",    icon:"👥", label:"Employees"   },
  { id:"assignments",  icon:"📅", label:"Assignments" },
  { id:"expenses",     icon:"💸", label:"Expenses"    },
  { id:"availability", icon:"📆", label:"Availability"},
  { id:"dashboard",    icon:"📊", label:"Dashboard"   },
];

export default function ManageEmployees() {
  const [tab,  setTab]  = useState("management");
  const [tick, setTick] = useState(0);
  const onTick = () => setTick(t=>t+1);

  return (
    <div className="adm-page">
      <div className="emp-tab-bar">
        {TABS.map(t=>(
          <button key={t.id} className={`emp-tab-btn ${tab===t.id?"emp-tab-btn--active":""}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==="management"   && <ManagementTab />}
      {tab==="employees"    && <EmployeesTab    tick={tick} onTick={onTick} />}
      {tab==="assignments"  && <AssignmentsTab  tick={tick} onTick={onTick} />}
      {tab==="expenses"     && <ExpensesTab     tick={tick} onTick={onTick} />}
      {tab==="availability" && <AvailabilityTab tick={tick} onTick={onTick} />}
      {tab==="dashboard"    && <DashboardTab    tick={tick} />}
    </div>
  );
}
