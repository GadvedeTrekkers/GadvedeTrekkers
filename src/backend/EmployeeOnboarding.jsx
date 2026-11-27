import { useState } from "react";
import { getAllEmployees, saveEmployee, deleteEmployee } from "../data/employeeStorage";
import { submitRateApproval, hasPendingRequest } from "../data/rateApprovalStorage";
import { logActivity } from "../data/activityLogStorage";
import { currentUserHasPermission, getCurrentAdminUser } from "../data/permissionStorage";
import {
  createEmployeeCredentials, getCredentialsByEmployeeId, getAllCredentials,
  approveOnboarding, rejectOnboarding, getPendingOnboardings,
} from "../data/employeePortalStorage";

/* ── Who can see/edit sensitive fields (bank, Aadhaar, pay) ── */
function isManagement() {
  try {
    const u = JSON.parse(sessionStorage.getItem("gt_user"));
    if (!u || u.username === "admin") return true;
    return ["pratik.ubhe", "rohit.panhalkar", "akshay.kangude"].includes(u.username);
  } catch { return true; }
}

/* Who can directly save pay amounts (Rohit / Admin) vs needs approval */
function canDirectlySetPay() {
  return currentUserHasPermission("vendor_payments");
}

/* Who can approve/reject employee onboarding (Akshay / Pratik / Admin) */
function isApprover() {
  try {
    const u = JSON.parse(sessionStorage.getItem("gt_user"));
    if (!u || u.username === "admin") return true;
    return ["akshay.kangude", "pratik.ubhe"].includes(u.username);
  } catch { return true; }
}

const ROLES      = ["Trek Leader", "Coordinator", "Support Staff", "Guide", "Instructor"];
const EXPERTISE  = ["Trek Leader", "Coordinator", "Guide", "Instructor", "Photographer"];
const SKILLS_LIST = ["Trek Leadership","First Aid","Navigation","Rock Climbing","Photography",
  "Coordination","Customer Service","Event Planning","Camp Setup","Yoga","Fitness Training",
  "Logistics","Vehicle Management","Budget Tracking","Documentation","Nutrition"];
const ACCOUNT_TYPES = ["Savings", "Current"];

const BLANK = {
  fullName: "", contactNumber: "", email: "", address: "",
  role: "Trek Leader", expertise: "Trek Leader", status: "active",
  experience: { years: "", description: "" },
  skills: [], certifications: [], linkedin: "", instagram: "", profilePhoto: "",
  /* Pay */
  payPerTrek: "",
  /* Bank */
  bankName: "", accountNumber: "", ifscCode: "", branch: "", accountType: "Savings",
  /* Identity */
  aadhaarNumber: "",
};

export default function EmployeeOnboarding() {
  const canManage  = isManagement();
  const canPay     = canDirectlySetPay();
  const canApprove = isApprover();

  const [view, setView]       = useState("list"); // list | form
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState({ ...BLANK });
  const [activeSection, setActiveSection] = useState("personal");
  const [msg, setMsg]         = useState("");
  const [search, setSearch]   = useState("");
  const [tick, setTick]       = useState(0);
  const [rejectId, setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showCreds, setShowCreds]   = useState(null); // employeeId whose creds to reveal

  /* ── skill/cert helpers ── */
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput]   = useState({ name: "", details: "" });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setExp = (k, v) => setForm(p => ({ ...p, experience: { ...p.experience, [k]: v } }));
  const toggleSkill = (s) => {
    const cur = form.skills || [];
    set("skills", cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  };
  const addCustomSkill = () => {
    if (!skillInput.trim()) return;
    set("skills", [...(form.skills || []), skillInput.trim()]);
    setSkillInput("");
  };
  const addCert = () => {
    if (!certInput.name.trim()) return;
    set("certifications", [...(form.certifications || []), { ...certInput }]);
    setCertInput({ name: "", details: "" });
  };
  const removeCert = (i) => set("certifications", form.certifications.filter((_, idx) => idx !== i));

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("profilePhoto", ev.target.result);
    reader.readAsDataURL(file);
  };

  const openNew = () => {
    setForm({ ...BLANK });
    setEditId(null);
    setActiveSection("personal");
    setMsg("");
    setView("form");
  };

  const openEdit = (emp) => {
    setForm({
      ...BLANK, ...emp,
      bankName: emp.bankName || "", accountNumber: emp.accountNumber || "",
      ifscCode: emp.ifscCode || "", branch: emp.branch || "",
      accountType: emp.accountType || "Savings",
      aadhaarNumber: emp.aadhaarNumber || "",
      payPerTrek: emp.payPerTrek || "",
    });
    setEditId(emp.employeeId);
    setActiveSection("personal");
    setMsg("");
    setView("form");
  };

  const handleSave = () => {
    if (!form.fullName.trim()) { setMsg("Full name is required."); return; }

    const payToSave = form.payPerTrek;
    const employees = getAllEmployees();
    const existing  = editId ? employees.find(e => e.employeeId === editId) : null;

    /* Build record — exclude sensitive fields if user can't manage */
    const record = {
      ...form,
      id: editId || undefined,
      employeeId: editId || undefined,
      /* Strip bank/Aadhaar if user lacks permission */
      ...(!canManage && {
        bankName: existing?.bankName || "",
        accountNumber: existing?.accountNumber || "",
        ifscCode: existing?.ifscCode || "",
        branch: existing?.branch || "",
        accountType: existing?.accountType || "Savings",
        aadhaarNumber: existing?.aadhaarNumber || "",
      }),
    };

    /* Handle pay per trek approval */
    if (payToSave && !canPay) {
      /* Save without new payPerTrek, submit for approval */
      const saved = saveEmployee({ ...record, payPerTrek: existing?.payPerTrek || "" });
      submitRateApproval({
        type: "employee",
        targetId: saved.employeeId || editId,
        targetName: form.fullName,
        field: "payPerTrek",
        proposedAmount: payToSave,
        currentAmount: existing?.payPerTrek || 0,
      });
      /* Auto-generate portal credentials for new employees */
      if (!editId) createEmployeeCredentials({ employeeId: saved.employeeId, fullName: form.fullName });
      logActivity({
        action: editId ? "EMPLOYEE_UPDATED" : "EMPLOYEE_ONBOARDED",
        actionLabel: editId ? "Updated Employee" : "Onboarded Employee",
        details: `${form.fullName} (${form.role}) — Pay per trek submitted for approval: ₹${payToSave}`,
        module: "Onboarding",
        severity: "info",
      });
      setMsg("Employee saved. Pay per trek submitted for Rohit's approval.");
    } else {
      const saved = saveEmployee(record);
      /* Auto-generate portal credentials for new employees */
      if (!editId) createEmployeeCredentials({ employeeId: saved.employeeId, fullName: form.fullName });
      logActivity({
        action: editId ? "EMPLOYEE_UPDATED" : "EMPLOYEE_ONBOARDED",
        actionLabel: editId ? "Updated Employee" : "Onboarded Employee",
        details: `${form.fullName} (${form.role})${payToSave ? ` — Pay per trek: ₹${payToSave}` : ""}`,
        module: "Onboarding",
        severity: "info",
      });
      setMsg(editId ? "Employee updated." : "Employee onboarded successfully. Portal credentials generated.");
    }

    setTick(t => t + 1);
    setTimeout(() => { setView("list"); setMsg(""); }, 1200);
  };

  const handleDelete = (emp) => {
    if (!window.confirm(`Delete ${emp.fullName}? This cannot be undone.`)) return;
    deleteEmployee(emp.employeeId);
    logActivity({ action: "EMPLOYEE_DELETED", actionLabel: "Deleted Employee", details: emp.fullName, module: "Onboarding", severity: "warning" });
    setTick(t => t + 1);
  };

  /* ── Employees list ── */
  const employees = getAllEmployees().filter(e =>
    !search.trim() || e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase())
  );

  const SECTIONS = ["personal", "pay", ...(canManage ? ["bank", "identity"] : [])];
  const SECTION_LABELS = { personal: "👤 Personal", pay: "💵 Pay Details", bank: "🏦 Bank Account", identity: "🪪 Identity" };

  /* ── RENDER ── */
  if (view === "form") return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">📋 {editId ? "Edit Employee" : "Onboard New Employee"}</h3>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setView("list")}>← Back</button>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {SECTIONS.map(s => (
          <button key={s}
            className={`btn btn-sm ${activeSection === s ? "btn-success" : "btn-outline-secondary"}`}
            onClick={() => setActiveSection(s)}
          >{SECTION_LABELS[s]}</button>
        ))}
      </div>

      {/* ── PERSONAL ── */}
      {activeSection === "personal" && (
        <div className="emp-form-card">
          <div className="emp-form-grid">
            <div className="emp-form-photo-col">
              <div className="emp-photo-preview">
                {form.profilePhoto ? <img src={form.profilePhoto} alt="Profile" /> : <span>👤</span>}
              </div>
              <label className="btn btn-outline-secondary btn-sm mt-2" style={{fontSize:12}}>
                Upload Photo <input type="file" accept="image/*" hidden onChange={handlePhoto} />
              </label>
            </div>
            <div className="emp-form-main">
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="emp-label">Full Name *</label>
                  <input className="form-control form-control-sm" value={form.fullName} onChange={e=>set("fullName",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Contact Number</label>
                  <input className="form-control form-control-sm" value={form.contactNumber} onChange={e=>set("contactNumber",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Email</label>
                  <input type="email" className="form-control form-control-sm" value={form.email} onChange={e=>set("email",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Address</label>
                  <input className="form-control form-control-sm" value={form.address} onChange={e=>set("address",e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="emp-label">Role</label>
                  <select className="form-select form-select-sm" value={form.role} onChange={e=>set("role",e.target.value)}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="emp-label">Expertise</label>
                  <select className="form-select form-select-sm" value={form.expertise} onChange={e=>set("expertise",e.target.value)}>
                    {EXPERTISE.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="emp-label">Status</label>
                  <select className="form-select form-select-sm" value={form.status} onChange={e=>set("status",e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Experience (years)</label>
                  <input type="number" min="0" className="form-control form-control-sm" value={form.experience.years} onChange={e=>setExp("years",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Experience Description</label>
                  <input className="form-control form-control-sm" value={form.experience.description} onChange={e=>setExp("description",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">LinkedIn</label>
                  <input className="form-control form-control-sm" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e=>set("linkedin",e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="emp-label">Instagram</label>
                  <input className="form-control form-control-sm" placeholder="https://instagram.com/..." value={form.instagram} onChange={e=>set("instagram",e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="emp-section-label mt-3">🎯 Skills</div>
          <div className="emp-skill-grid">
            {SKILLS_LIST.map(s=>(
              <button key={s} type="button"
                className={`emp-skill-chip ${(form.skills||[]).includes(s) ? "emp-skill-chip--active" : ""}`}
                onClick={()=>toggleSkill(s)}>{s}</button>
            ))}
          </div>
          <div className="d-flex gap-2 mt-2">
            <input className="form-control form-control-sm" placeholder="Add custom skill…" value={skillInput}
              onChange={e=>setSkillInput(e.target.value)} style={{maxWidth:200}} />
            <button className="btn btn-outline-success btn-sm" onClick={addCustomSkill}>+ Add</button>
          </div>

          {/* Certifications */}
          <div className="emp-section-label mt-3">🏅 Certifications</div>
          <div className="d-flex gap-2 align-items-end flex-wrap mb-2">
            <div>
              <label className="emp-label">Cert Name</label>
              <input className="form-control form-control-sm" style={{minWidth:160}} value={certInput.name}
                onChange={e=>setCertInput(p=>({...p,name:e.target.value}))} />
            </div>
            <div>
              <label className="emp-label">Details</label>
              <input className="form-control form-control-sm" style={{minWidth:200}} value={certInput.details}
                onChange={e=>setCertInput(p=>({...p,details:e.target.value}))} />
            </div>
            <button className="btn btn-outline-success btn-sm" onClick={addCert}>+ Add</button>
          </div>
          {(form.certifications||[]).map((c,i)=>(
            <div key={i} className="emp-cert-row">
              <span>🏅 <strong>{c.name}</strong> — {c.details}</span>
              <button className="btn btn-link btn-sm text-danger p-0 ms-2" onClick={()=>removeCert(i)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* ── PAY DETAILS ── */}
      {activeSection === "pay" && (
        <div className="emp-form-card">
          <div style={{fontSize:15, fontWeight:700, color:"#1e293b", marginBottom:16}}>💵 Pay Details</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="emp-label">
                Pay per Trek (₹)
                {!canPay && <span style={{color:"#f59e0b", fontSize:11, marginLeft:6}}>⏳ Requires Rohit's approval</span>}
              </label>
              <input type="number" min="0" className="form-control form-control-sm"
                placeholder="e.g. 2000"
                value={form.payPerTrek}
                onChange={e=>set("payPerTrek",e.target.value)}
              />
              <small className="text-muted" style={{fontSize:11}}>This amount is auto-fetched when initiating trek payments.</small>
              {editId && hasPendingRequest(editId, "payPerTrek") && (
                <div style={{marginTop:6, fontSize:11, color:"#f59e0b"}}>⏳ A pay change is awaiting Rohit's approval.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BANK ACCOUNT ── */}
      {activeSection === "bank" && canManage && (
        <div className="emp-form-card">
          <div style={{fontSize:15, fontWeight:700, color:"#1e293b", marginBottom:4}}>🏦 Bank Account Details</div>
          <div style={{fontSize:12, color:"#64748b", marginBottom:16}}>🔒 Visible to management only</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="emp-label">Bank Name</label>
              <input className="form-control form-control-sm" placeholder="e.g. State Bank of India"
                value={form.bankName} onChange={e=>set("bankName",e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="emp-label">Account Number</label>
              <input className="form-control form-control-sm" placeholder="e.g. 00000123456789"
                value={form.accountNumber} onChange={e=>set("accountNumber",e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="emp-label">IFSC Code</label>
              <input className="form-control form-control-sm" placeholder="e.g. SBIN0001234"
                value={form.ifscCode} onChange={e=>set("ifscCode",e.target.value.toUpperCase())} />
            </div>
            <div className="col-md-4">
              <label className="emp-label">Branch</label>
              <input className="form-control form-control-sm" placeholder="e.g. Pune Main Branch"
                value={form.branch} onChange={e=>set("branch",e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="emp-label">Account Type</label>
              <select className="form-select form-select-sm" value={form.accountType} onChange={e=>set("accountType",e.target.value)}>
                {ACCOUNT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── IDENTITY ── */}
      {activeSection === "identity" && canManage && (
        <div className="emp-form-card">
          <div style={{fontSize:15, fontWeight:700, color:"#1e293b", marginBottom:4}}>🪪 Identity Details</div>
          <div style={{fontSize:12, color:"#64748b", marginBottom:16}}>🔒 Visible to management only</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="emp-label">Aadhaar Number</label>
              <input className="form-control form-control-sm" placeholder="XXXX XXXX XXXX"
                maxLength={14}
                value={form.aadhaarNumber}
                onChange={e=>{
                  const raw = e.target.value.replace(/\D/g,"").slice(0,12);
                  const fmt = raw.replace(/(\d{4})(\d{4})(\d{0,4})/,"$1 $2 $3").trim();
                  set("aadhaarNumber", fmt);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save / Cancel */}
      <div className="d-flex gap-2 mt-3 align-items-center">
        <button className="btn btn-success btn-sm px-4" onClick={handleSave}>
          {editId ? "Update Employee" : "Onboard Employee"}
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setView("list")}>Cancel</button>
        {msg && <span style={{fontSize:13, color: msg.includes("error") || msg.includes("required") ? "#ef4444" : "#22c55e", fontWeight:600}}>{msg}</span>}
      </div>
    </div>
  );

  /* ── LIST VIEW ── */
  const pendingOnboardings = getPendingOnboardings();

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h3 className="adm-page-title">📋 Employee Onboarding</h3>
        <div className="d-flex gap-2 align-items-center">
          <span className="adm-count-badge">{employees.length} employee{employees.length !== 1 ? "s" : ""}</span>
          <button className="btn btn-success btn-sm" onClick={openNew}>+ Onboard New Employee</button>
        </div>
      </div>

      {/* ── Pending Portal Approvals banner (Akshay / Pratik only) ── */}
      {canApprove && pendingOnboardings.length > 0 && (
        <div style={{background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:14, marginBottom:16}}>
          <div style={{fontWeight:700, fontSize:13, color:"#92400e", marginBottom:10}}>
            ⏳ {pendingOnboardings.length} Employee Portal Request{pendingOnboardings.length > 1 ? "s" : ""} Awaiting Approval
          </div>
          {pendingOnboardings.map(cred => (
            <div key={cred.employeeId} style={{display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid #fef3c7", flexWrap:"wrap"}}>
              <div style={{flex:1, minWidth:160}}>
                <div style={{fontWeight:600, fontSize:13}}>{cred.fullName}</div>
                <div style={{fontSize:11, color:"#78716c", fontFamily:"monospace"}}>
                  Login: <strong>{cred.username}</strong> (password set on server)
                  <span style={{marginLeft:8, color:"#a16207"}}>Ref: {cred.referralCode}</span>
                </div>
              </div>
              {rejectId === cred.employeeId ? (
                <div className="d-flex gap-2 align-items-center" style={{flexWrap:"wrap"}}>
                  <input className="form-control form-control-sm" style={{width:200}}
                    placeholder="Rejection reason…" value={rejectReason}
                    onChange={e=>setRejectReason(e.target.value)} />
                  <button className="btn btn-danger btn-sm py-0" onClick={() => {
                    rejectOnboarding(cred.employeeId, rejectReason);
                    setRejectId(null); setRejectReason(""); setTick(t=>t+1);
                  }}>Confirm Reject</button>
                  <button className="btn btn-outline-secondary btn-sm py-0" onClick={()=>{setRejectId(null);setRejectReason("");}}>Cancel</button>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm py-0 px-3" onClick={() => {
                    approveOnboarding(cred.employeeId); setTick(t=>t+1);
                  }}>✅ Approve</button>
                  <button className="btn btn-outline-danger btn-sm py-0" onClick={()=>setRejectId(cred.employeeId)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="adm-search-row mb-3">
        <input className="form-control form-control-sm adm-search"
          placeholder="Search by name or role…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {employees.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">👤</div>
          <p className="adm-empty-text">{search ? `No employees match "${search}"` : "No employees onboarded yet."}</p>
          <button className="btn btn-success btn-sm" onClick={openNew}>+ Onboard First Employee</button>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="table table-hover adm-table mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Pay / Trek</th>
                {canManage && <th>Bank</th>}
                {canManage && <th>Aadhaar</th>}
                <th>Status</th>
                <th>Portal</th>
                <th style={{width:110}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.employeeId}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {emp.profilePhoto
                        ? <img src={emp.profilePhoto} alt="" style={{width:32, height:32, borderRadius:"50%", objectFit:"cover"}} />
                        : <div style={{width:32, height:32, borderRadius:"50%", background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14}}>👤</div>
                      }
                      <div>
                        <div style={{fontWeight:600, fontSize:13}}>{emp.fullName}</div>
                        <div style={{fontSize:11, color:"#94a3b8"}}>{emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize:13}}>{emp.role}</td>
                  <td style={{fontSize:12}}>{emp.contactNumber || "—"}</td>
                  <td>
                    {emp.payPerTrek
                      ? <strong style={{color:"#16a34a"}}>₹{Number(emp.payPerTrek).toLocaleString("en-IN")}</strong>
                      : <span style={{color:"#94a3b8", fontSize:12}}>Not set</span>}
                    {hasPendingRequest(emp.employeeId, "payPerTrek") &&
                      <span style={{fontSize:10, color:"#f59e0b", marginLeft:4}}>⏳ pending</span>}
                  </td>
                  {canManage && (
                    <td>
                      {emp.accountNumber
                        ? <span style={{fontSize:12, color:"#16a34a"}}>✅ {emp.bankName || "Set"} ••••{String(emp.accountNumber).slice(-4)}</span>
                        : <span style={{color:"#94a3b8", fontSize:12}}>Not set</span>}
                    </td>
                  )}
                  {canManage && (
                    <td>
                      {emp.aadhaarNumber
                        ? <span style={{fontSize:12, color:"#16a34a"}}>✅ ••••{String(emp.aadhaarNumber).replace(/\s/g,"").slice(-4)}</span>
                        : <span style={{color:"#94a3b8", fontSize:12}}>Not set</span>}
                    </td>
                  )}
                  <td>
                    <span className={`badge ${emp.status === "active" ? "bg-success" : "bg-secondary"}`} style={{fontSize:10}}>
                      {emp.status || "active"}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const cred = getCredentialsByEmployeeId(emp.employeeId);
                      if (!cred) return <span style={{fontSize:11, color:"#94a3b8"}}>No credentials</span>;
                      const colors = { APPROVED: "#16a34a", PENDING: "#d97706", REJECTED: "#dc2626" };
                      const labels = { APPROVED: "✅ Active", PENDING: "⏳ Pending", REJECTED: "❌ Rejected" };
                      return (
                        <div>
                          <span style={{fontSize:11, fontWeight:600, color: colors[cred.onboardingStatus] || "#64748b"}}>
                            {labels[cred.onboardingStatus] || cred.onboardingStatus}
                          </span>
                          {canManage && (
                            <div>
                              <button className="btn btn-link btn-sm p-0" style={{fontSize:10}}
                                onClick={() => setShowCreds(showCreds === emp.employeeId ? null : emp.employeeId)}>
                                {showCreds === emp.employeeId ? "Hide" : "View Creds"}
                              </button>
                              {showCreds === emp.employeeId && (
                                <div style={{fontSize:10, fontFamily:"monospace", background:"#f1f5f9", borderRadius:4, padding:"2px 6px", marginTop:2}}>
                                  <div>👤 {cred.username}</div>
                                  <div>🔑 password set on server</div>
                                  <div style={{color:"#0284c7"}}>🔗 {cred.referralCode}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{fontSize:11}}
                        onClick={() => openEdit(emp)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{fontSize:11}}
                        onClick={() => handleDelete(emp)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
